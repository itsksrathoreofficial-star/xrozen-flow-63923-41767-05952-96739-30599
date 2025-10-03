import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ChatList } from "@/components/chat/ChatList";
import { ChatWindow } from "@/components/chat/ChatWindow";

const Chat = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    searchParams.get("project") || null
  );
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadProjectData();
      setSearchParams({ project: selectedProjectId });
    }
  }, [selectedProjectId]);

  const loadUserData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setCurrentUser(profile);
    } catch (error: any) {
      toast.error("Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  const loadProjectData = async () => {
    if (!selectedProjectId) return;

    try {
      const { data: project } = await supabase
        .from("projects")
        .select("*")
        .eq("id", selectedProjectId)
        .single();

      setSelectedProject(project);
    } catch (error: any) {
      console.error("Failed to load project:", error);
    }
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen">
        <AppSidebar />
        <div className="flex-1 flex flex-col h-screen">
          <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
            <div className="flex items-center px-6 py-4 gap-4">
              <SidebarTrigger />
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-glow">
                  <MessageSquare className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Messages</h1>
                  <p className="text-sm text-muted-foreground">
                    Project-based communication
                  </p>
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 flex overflow-hidden">
            {/* Chat List Sidebar */}
            <ChatList
              currentUserId={currentUser?.id}
              selectedProjectId={selectedProjectId}
              onSelectProject={handleSelectProject}
            />

            {/* Chat Window */}
            {selectedProjectId && selectedProject ? (
              <ChatWindow
                projectId={selectedProjectId}
                projectName={selectedProject.name}
                currentUserId={currentUser?.id}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-success/5">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground text-lg font-semibold">
                    Select a project to start chatting
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Choose a project from the list to view messages
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Chat;
