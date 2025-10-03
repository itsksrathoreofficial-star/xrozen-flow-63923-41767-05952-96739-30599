import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Plus, Trash2, MessageSquare, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

export default function XrozenAI() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      loadConversations();
    };
    checkAuth();
  }, [navigate]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Load conversations
  const loadConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await (supabase as any)
        .from('ai_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setConversations(data || []);
      
      // Auto-select most recent conversation
      if (data && data.length > 0 && !selectedConversation) {
        setSelectedConversation(data[0].id);
        loadMessages(data[0].id);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  };

  // Load messages for a conversation
  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Create new conversation
  const createNewConversation = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await (supabase as any)
        .from('ai_conversations')
        .insert({ 
          user_id: user.id, 
          title: 'New Conversation' 
        })
        .select()
        .single();

      if (error) throw error;

      setConversations(prev => [data, ...prev]);
      setSelectedConversation(data.id);
      setMessages([]);
      setInput('');
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: "Failed to create new conversation",
        variant: "destructive"
      });
    }
  };

  // Delete conversation
  const deleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      // Delete messages first
      await (supabase as any)
        .from('ai_messages')
        .delete()
        .eq('conversation_id', conversationId);

      // Delete conversation
      const { error } = await (supabase as any)
        .from('ai_conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;

      setConversations(prev => prev.filter(c => c.id !== conversationId));
      
      if (selectedConversation === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }

      toast({
        title: "Success",
        description: "Conversation deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive"
      });
    }
  };

  // Send message - auto-create conversation if needed
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
      let conversationIdToUse = selectedConversation;

      // Auto-create conversation if none exists
      if (!conversationIdToUse) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data: newConv, error: convError } = await (supabase as any)
          .from('ai_conversations')
          .insert({ 
            user_id: user.id, 
            title: userMessage.slice(0, 50) 
          })
          .select()
          .single();

        if (convError) throw convError;
        
        conversationIdToUse = newConv.id;
        setSelectedConversation(newConv.id);
        setConversations(prev => [newConv, ...prev]);
      }

      const { data, error } = await supabase.functions.invoke('xrozen-ai', {
        body: {
          message: userMessage,
          conversationId: conversationIdToUse,
          messages: messages.filter(m => m.id !== tempId).map(m => ({
            role: m.role,
            content: m.content
          }))
        }
      });

      if (error) throw error;

      // Parse action data from response
      let responseContent = data.response;
      const actionMatch = responseContent.match(/__ACTION_DATA__(.+?)__ACTION_DATA__/);
      if (actionMatch) {
        responseContent = responseContent.replace(/__ACTION_DATA__.+?__ACTION_DATA__/, '').trim();
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
        created_at: new Date().toISOString()
      }));

    } catch (error: any) {
      console.error('Error sending message:', error);
      
      setMessages(prev => prev.filter(m => m.id !== tempId));
      
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        
        <main className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur px-6">
            <SidebarTrigger />
            <div className="flex items-center gap-2 flex-1">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-semibold">XrozenAI</h1>
            </div>
            
            {/* History Button */}
            <Sheet open={showHistory} onOpenChange={setShowHistory}>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <History className="h-4 w-4" />
                  Chat History
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle>Conversation History</SheetTitle>
                </SheetHeader>
                
                <div className="mt-6">
                  <Button 
                    onClick={() => {
                      createNewConversation();
                      setShowHistory(false);
                    }} 
                    className="w-full gap-2 mb-4"
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                    New Conversation
                  </Button>

                  <ScrollArea className="h-[calc(100vh-200px)]">
                    <div className="space-y-2">
                      {loadingConversations ? (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                          Loading...
                        </div>
                      ) : conversations.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                          No conversations yet
                        </div>
                      ) : (
                        conversations.map((conv) => (
                          <div
                            key={conv.id}
                            className={cn(
                              "group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors",
                              selectedConversation === conv.id
                                ? "bg-primary/10 border border-primary/20"
                                : "hover:bg-muted"
                            )}
                            onClick={() => {
                              setSelectedConversation(conv.id);
                              loadMessages(conv.id);
                              setShowHistory(false);
                            }}
                          >
                            <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{conv.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(conv.updated_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => deleteConversation(conv.id, e)}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </SheetContent>
            </Sheet>
            
            <Button 
              onClick={createNewConversation} 
              variant="outline"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              New Conversation
            </Button>
          </header>

          <div className="flex-1 flex flex-col">
            {/* Messages - Always visible now */}
            <ScrollArea className="flex-1 p-6" ref={scrollRef}>
              <div className="max-w-4xl mx-auto space-y-6">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                      <MessageSquare className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-2xl font-semibold mb-3">Welcome to XrozenAI</h3>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                      Your intelligent assistant for managing projects, clients, and workflow
                    </p>
                    <div className="bg-muted/50 rounded-lg p-6 max-w-2xl mx-auto text-left">
                      <p className="font-medium mb-4">Try asking:</p>
                      <div className="grid gap-3">
                        <div className="flex items-start gap-3 p-3 bg-background rounded-md">
                          <div className="text-primary">•</div>
                          <p className="text-sm">"Create a new project called Marketing Video"</p>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-background rounded-md">
                          <div className="text-primary">•</div>
                          <p className="text-sm">"Add a client named John Doe with email john@example.com"</p>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-background rounded-md">
                          <div className="text-primary">•</div>
                          <p className="text-sm">"Show me all pending projects"</p>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-background rounded-md">
                          <div className="text-primary">•</div>
                          <p className="text-sm">"List my recent payments"</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex gap-4",
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-6 py-4 shadow-sm",
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        )}
                      >
                        {msg.role === 'assistant' ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        )}
                        <p className="text-xs opacity-50 mt-2">
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-2xl px-6 py-4 flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span className="text-muted-foreground">XrozenAI is thinking...</span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input - Always visible */}
            <div className="border-t bg-muted/30 p-6">
              <div className="max-w-4xl mx-auto">
                <div className="flex gap-3 items-end">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Ask XrozenAI anything about your workflow..."
                    disabled={loading}
                    className="flex-1 min-h-[80px] max-h-[200px] resize-none text-base"
                    rows={3}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!input.trim() || loading}
                    size="icon"
                    className="h-[80px] w-16 bg-primary hover:bg-primary/90"
                  >
                    {loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <Send className="h-6 w-6" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Powered by Xrozen AI • Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
