import { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, Loader2, Minimize2, Maximize2, ExternalLink, Fullscreen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useLocation, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

interface ActionData {
  type: 'project' | 'client' | 'editor';
  id: string;
  name: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  actionData?: ActionData;
}

export function XrozenAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // Check authentication
  useEffect(() => {
    console.log('XrozenAI - Component mounted');
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        console.log('XrozenAI - Auth check result:', { user: !!user, error });
        setIsAuthenticated(!!user);
      } catch (err) {
        console.error('XrozenAI - Auth check error:', err);
        setIsAuthenticated(false);
      }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
      console.log('XrozenAI - Auth state changed:', !!session?.user);
    });

    return () => {
      console.log('XrozenAI - Component unmounting');
      subscription.unsubscribe();
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Load conversation history - synced with XrozenAI page
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadRecentConversation();
    }
  }, [isOpen, isAuthenticated]);

  // Realtime subscription for data changes
  useEffect(() => {
    const channels: any[] = [];

    // Subscribe to editors
    const editorsChannel = (supabase as any)
      .channel('editors-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'editors' }, () => {
        console.log('Editor data changed - triggering refresh');
      })
      .subscribe();
    channels.push(editorsChannel);

    // Subscribe to clients
    const clientsChannel = (supabase as any)
      .channel('clients-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => {
        console.log('Client data changed - triggering refresh');
      })
      .subscribe();
    channels.push(clientsChannel);

    // Subscribe to projects
    const projectsChannel = (supabase as any)
      .channel('projects-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
        console.log('Project data changed - triggering refresh');
      })
      .subscribe();
    channels.push(projectsChannel);

    return () => {
      channels.forEach(ch => (supabase as any).removeChannel(ch));
    };
  }, []);

  const loadRecentConversation = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data: conversations, error: convError } = await (supabase as any)
        .from('ai_conversations')
        .select('*')
        .eq('user_id', user.user.id)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (convError) {
        console.error('Error loading conversations:', convError);
        return;
      }

      if (conversations && conversations.length > 0) {
        const convId = conversations[0].id;
        setConversationId(convId);

        const { data: msgs, error: msgsError } = await (supabase as any)
          .from('ai_messages')
          .select('*')
          .eq('conversation_id', convId)
          .order('created_at', { ascending: true });

        if (msgsError) {
          console.error('Error loading messages:', msgsError);
          return;
        }

        if (msgs) {
          setMessages(msgs.map((m: any) => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
            created_at: m.created_at
          })));
        }
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    const tempId = `temp-${Date.now()}`;
    
    setInput('');
    setLoading(true);
    
    // Add user message immediately
    setMessages(prev => [...prev, {
      id: tempId,
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString()
    }]);

    try {
      console.log('XrozenAI - Sending message:', userMessage);
      
      const { data, error } = await supabase.functions.invoke('xrozen-ai', {
        body: {
          message: userMessage,
          conversationId,
          messages: messages.filter(m => m.id !== tempId).map(m => ({
            role: m.role,
            content: m.content
          }))
        }
      });

      if (error) {
        console.error('XrozenAI - Error from edge function:', error);
        throw error;
      }

      console.log('XrozenAI - Response received:', data);

      // Update conversation ID if new
      if (!conversationId && data.conversationId) {
        setConversationId(data.conversationId);
      }

      // Parse action data from response
      let responseContent = data.response;
      let actionData: ActionData | undefined;
      
      const actionMatch = responseContent.match(/__ACTION_DATA__(.+?)__ACTION_DATA__/);
      if (actionMatch) {
        try {
          actionData = JSON.parse(actionMatch[1]);
          responseContent = responseContent.replace(/__ACTION_DATA__.+?__ACTION_DATA__/, '').trim();
        } catch (e) {
          console.error('Failed to parse action data:', e);
        }
      }

      // Replace temp message with actual message
      setMessages(prev => prev.map(m => 
        m.id === tempId 
          ? { ...m, id: `user-${Date.now()}` }
          : m
      ).concat({
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: responseContent,
        created_at: new Date().toISOString(),
        actionData
      }));

    } catch (error: any) {
      console.error('XrozenAI - Error sending message:', error);
      
      // Remove temp message on error
      setMessages(prev => prev.filter(m => m.id !== tempId));
      
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // Don't show on auth pages or when not authenticated
  const hideOnPaths = ['/auth', '/'];
  const shouldHide = hideOnPaths.includes(location.pathname);

  console.log('XrozenAI - Render check:', { 
    isAuthenticated, 
    path: location.pathname, 
    shouldHide,
    willRender: isAuthenticated && !shouldHide 
  });

  if (!isAuthenticated || shouldHide) {
    return null;
  }

  return (
    <>
      {/* Floating Button - Right Side */}
      {!isOpen && (
        <Button
          onClick={() => {
            console.log('XrozenAI - Button clicked, opening chat');
            setIsOpen(true);
          }}
          className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-xl z-[9999] bg-primary hover:bg-primary/90 hover:scale-105 transition-all duration-300"
          size="icon"
          title="Open XrozenAI Assistant"
        >
          <Sparkles className="h-7 w-7 text-primary-foreground" />
        </Button>
      )}

      {/* Chat Popup */}
      {isOpen && (
        <Card className={cn(
          "fixed bottom-6 right-6 shadow-2xl z-[9999] transition-all duration-300",
          isMinimized ? "w-80 h-16" : "w-96 h-[600px]",
          "flex flex-col bg-background border-2 border-primary/20"
        )}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">XrozenAI</h3>
                <p className="text-xs opacity-80">Your Project Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  navigate('/xrozen-ai');
                  setIsOpen(false);
                }}
                className="h-8 w-8 hover:bg-primary-foreground/20 text-primary-foreground"
                title="Open Full Page"
              >
                <Fullscreen className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMinimize}
                className="h-8 w-8 hover:bg-primary-foreground/20 text-primary-foreground"
                title={isMinimized ? "Maximize" : "Minimize"}
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  console.log('XrozenAI - Closing chat');
                  setIsOpen(false);
                }}
                className="h-8 w-8 hover:bg-primary-foreground/20 text-primary-foreground"
                title="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="h-8 w-8 text-primary-foreground" />
                      </div>
                      <h4 className="font-semibold mb-2">Welcome to XrozenAI!</h4>
                      <p className="text-sm mb-4">I can help you manage your workflow and perform actions</p>
                      <div className="text-xs space-y-2 bg-muted/50 rounded-lg p-4">
                        <p className="font-medium">Try asking:</p>
                        <ul className="space-y-1 text-left">
                          <li>• "Create a new project called Marketing Video"</li>
                          <li>• "Add a client named John Doe"</li>
                          <li>• "Generate an invoice for project XYZ"</li>
                          <li>• "Show me pending payments"</li>
                          <li>• "List all my projects"</li>
                        </ul>
                      </div>
                    </div>
                  )}
                  
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex flex-col gap-2",
                        msg.role === 'user' ? 'items-end' : 'items-start'
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg px-4 py-2 shadow-sm",
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        )}
                      >
                        {msg.role === 'assistant' ? (
                          <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        )}
                        <p className="text-xs opacity-50 mt-1">
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      
                      {msg.actionData && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const routes = {
                              project: '/projects',
                              client: '/clients',
                              editor: '/editors'
                            };
                            navigate(routes[msg.actionData!.type]);
                            setIsOpen(false);
                          }}
                          className="gap-2 text-xs"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View {msg.actionData.type}
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg px-4 py-2 flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Thinking...</span>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t bg-muted/30">
                <div className="flex gap-2 items-end">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Ask XrozenAI to help manage your workflow..."
                    disabled={loading}
                    className="flex-1 min-h-[60px] max-h-[120px] resize-none"
                    rows={2}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!input.trim() || loading}
                    size="icon"
                    className="h-[60px] w-12 bg-primary hover:bg-primary/90"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Powered by Xrozen
                </p>
              </div>
            </>
          )}
        </Card>
      )}
    </>
  );
}