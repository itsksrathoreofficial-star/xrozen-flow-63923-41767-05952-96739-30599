import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { message, conversationId, messages } = await req.json();

    // Build context from user's data
    const [profileData, projectsData, editorsData, clientsData, paymentsData] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('projects').select('*').eq('creator_id', user.id),
      supabase.from('editors').select('*'),
      supabase.from('clients').select('*'),
      supabase.from('payments').select('*').or(`payer_id.eq.${user.id},recipient_id.eq.${user.id}`)
    ]);

    const context = `
User Context:
- Name: ${profileData.data?.full_name || 'Unknown'}
- Email: ${profileData.data?.email || 'Unknown'}
- Role: ${profileData.data?.user_category || 'Unknown'}

Projects: ${projectsData.data?.length || 0} total
${projectsData.data?.slice(0, 5).map(p => `- ${p.name} (${p.status})`).join('\n') || 'No projects'}

Editors: ${editorsData.data?.length || 0} available
Clients: ${clientsData.data?.length || 0} available
Payments: ${paymentsData.data?.length || 0} transactions
`;

    const systemPrompt = `You are XrozenAI, an expert AI assistant for the Xrozen Workflow platform. 
You help users manage video editing projects, track editors and clients, handle payments, and provide insights.
You can perform actions like creating projects, adding clients/editors, and more.
Always be helpful, concise, and professional.

${context}

Answer questions based on the user's actual data shown above. If you don't have specific information, say so clearly.

Available Actions:
- create_project: Create a new project
- add_client: Add a new client
- add_editor: Add a new editor
- list_projects: List all user's projects

When users ask you to perform actions, use the appropriate tools.`;

    // Define tools for AI actions
    const tools = [
      {
        type: "function",
        function: {
          name: "create_project",
          description: "Create a new video editing project",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Project name" },
              description: { type: "string", description: "Project description" },
              client_id: { type: "string", description: "Client UUID (optional)" },
              deadline: { type: "string", description: "Deadline in YYYY-MM-DD format (optional)" }
            },
            required: ["name"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "add_client",
          description: "Add a new client to the system",
          parameters: {
            type: "object",
            properties: {
              full_name: { type: "string", description: "Client full name" },
              email: { type: "string", description: "Client email" },
              company: { type: "string", description: "Company name (optional)" }
            },
            required: ["full_name", "email"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "add_editor",
          description: "Add a new editor to the system",
          parameters: {
            type: "object",
            properties: {
              full_name: { type: "string", description: "Editor full name" },
              email: { type: "string", description: "Editor email" },
              specialty: { type: "string", description: "Editor specialty (optional)" },
              employment_type: { type: "string", enum: ["freelance", "fulltime"], description: "Employment type (optional, defaults to freelance)" },
              monthly_salary: { type: "number", description: "Monthly salary for fulltime editors (optional)" }
            },
            required: ["full_name", "email"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "list_projects",
          description: "List all user's projects with their current status",
          parameters: { type: "object", properties: {} }
        }
      }
    ];

    // Call Lovable AI Gateway with tools
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
          { role: 'user', content: message }
        ],
        tools: tools,
        tool_choice: "auto"
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const choice = aiData.choices[0];
    let assistantMessage = choice.message.content || '';

    // Handle tool calls if AI wants to perform actions
    if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
      const toolCall = choice.message.tool_calls[0];
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);

      try {
        let toolResult = '';

        // Execute the requested tool
        let actionData = null;
        switch (functionName) {
          case 'create_project':
            const { data: newProject, error: projectError } = await supabase
              .from('projects')
              .insert({
                name: functionArgs.name,
                description: functionArgs.description,
                creator_id: user.id,
                client_id: functionArgs.client_id,
                deadline: functionArgs.deadline,
                status: 'draft'
              })
              .select()
              .single();
            
            if (projectError) throw projectError;
            actionData = { type: 'project', id: newProject.id, name: functionArgs.name };
            toolResult = `Successfully created project "${functionArgs.name}"`;
            break;

          case 'add_client':
            const { data: newClient, error: clientError } = await supabase
              .from('clients')
              .insert({
                full_name: functionArgs.full_name,
                email: functionArgs.email,
                company: functionArgs.company,
                user_id: user.id,
                employment_type: 'freelance'
              })
              .select()
              .single();
            
            if (clientError) throw clientError;
            actionData = { type: 'client', id: newClient.id, name: functionArgs.full_name };
            toolResult = `Successfully added client "${functionArgs.full_name}"`;
            break;

          case 'add_editor':
            const { data: newEditor, error: editorError } = await supabase
              .from('editors')
              .insert({
                full_name: functionArgs.full_name,
                email: functionArgs.email,
                specialty: functionArgs.specialty,
                employment_type: functionArgs.employment_type || 'freelance',
                monthly_salary: functionArgs.monthly_salary,
                user_id: user.id
              })
              .select()
              .single();
            
            if (editorError) throw editorError;
            actionData = { type: 'editor', id: newEditor.id, name: functionArgs.full_name };
            toolResult = `Successfully added editor "${functionArgs.full_name}"`;
            break;

          case 'list_projects':
            const { data: projects, error: listError } = await supabase
              .from('projects')
              .select('*')
              .eq('creator_id', user.id)
              .order('created_at', { ascending: false });
            
            if (listError) throw listError;
            toolResult = projects.length > 0 
              ? `Found ${projects.length} projects:\n${projects.map(p => `- ${p.name} (${p.status})`).join('\n')}`
              : 'No projects found.';
            break;

          default:
            toolResult = 'Unknown tool requested';
        }

        assistantMessage = `✅ ${toolResult}${actionData ? `\n\n__ACTION_DATA__${JSON.stringify(actionData)}__ACTION_DATA__` : ''}`;
      } catch (error) {
        console.error('Tool execution error:', error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        assistantMessage = `❌ Failed to execute action: ${errorMsg}`;
      }
    }

    // Create or update conversation
    let convId = conversationId;
    if (!convId) {
      const { data: newConv } = await supabase
        .from('ai_conversations')
        .insert({ user_id: user.id, title: message.slice(0, 50) })
        .select()
        .single();
      convId = newConv?.id;
    }

    // Save messages
    if (convId) {
      await supabase.from('ai_messages').insert([
        { conversation_id: convId, role: 'user', content: message },
        { conversation_id: convId, role: 'assistant', content: assistantMessage }
      ]);
    }

    return new Response(
      JSON.stringify({ 
        response: assistantMessage,
        conversationId: convId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in xrozen-ai:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
