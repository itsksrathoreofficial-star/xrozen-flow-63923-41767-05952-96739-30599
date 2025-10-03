import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/database-config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MessageSquare, Clock, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { UniversalVideoPlayer } from "@/components/video-preview/UniversalVideoPlayer";
import { FeedbackComments } from "@/components/video-preview/FeedbackComments";
import { Badge } from "@/components/ui/badge";

const VideoPreview = () => {
  const { versionId } = useParams();
  const navigate = useNavigate();
  const [version, setVersion] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    loadVersionData();
    subscribeToFeedback();
  }, [versionId]);

  const loadVersionData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Load version
      const versionData = await db.query({
        collection: 'video_versions',
        operation: 'select',
        where: { id: versionId }
      }) as any[];

      if (!versionData || versionData.length === 0) {
        toast.error("Version not found");
        navigate("/projects");
        return;
      }

      setVersion(versionData[0]);

      // Load project
      const projectData = await db.query({
        collection: 'projects',
        operation: 'select',
        where: { id: versionData[0].project_id }
      }) as any[];

      if (projectData && projectData.length > 0) {
        setProject(projectData[0]);
      }

      // Load feedback
      await loadFeedback();
    } catch (error) {
      console.error("Error loading version:", error);
      toast.error("Failed to load video preview");
    } finally {
      setLoading(false);
    }
  };

  const loadFeedback = async () => {
    try {
      const feedbackData = await db.query({
        collection: 'video_feedback',
        operation: 'select',
        where: { version_id: versionId },
        orderBy: { column: 'timestamp_seconds', ascending: true }
      }) as any[];

      setFeedback(feedbackData || []);
    } catch (error) {
      console.error("Error loading feedback:", error);
    }
  };

  const subscribeToFeedback = () => {
    if (!versionId) return;
    
    const channel = supabase
      .channel('video_feedback_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'video_feedback',
          filter: `version_id=eq.${versionId}`
        },
        () => {
          loadFeedback();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleAddFeedback = async (commentText: string, timestamp?: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await db.query({
        collection: 'video_feedback',
        operation: 'insert',
        data: {
          version_id: versionId,
          user_id: user.id,
          comment_text: commentText,
          timestamp_seconds: timestamp !== undefined ? timestamp : currentTime
        }
      });

      toast.success("Feedback added");
      loadFeedback();
    } catch (error) {
      console.error("Error adding feedback:", error);
      toast.error("Failed to add feedback");
    }
  };

  const handleSeekToTimestamp = (seconds: number) => {
    if (playerRef.current && playerRef.current.seekTo) {
      playerRef.current.seekTo(seconds);
    }
  };

  const handleResolveFeedback = async (feedbackId: string, resolved: boolean) => {
    try {
      await db.query({
        collection: 'video_feedback',
        operation: 'update',
        where: { id: feedbackId },
        data: { is_resolved: resolved }
      });

      toast.success(resolved ? "Feedback marked as resolved" : "Feedback reopened");
      loadFeedback();
    } catch (error) {
      console.error("Error updating feedback:", error);
      toast.error("Failed to update feedback");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!version || !project) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen">
        <AppSidebar />
        <div className="flex-1 bg-gradient-to-br from-background via-primary/5 to-success/5">
          <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
            <div className="flex items-center justify-between px-6 py-4 gap-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Project
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  Version {version.version_number}
                </Badge>
                {version.approval_status === 'approved' && (
                  <Badge className="bg-success">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Approved
                  </Badge>
                )}
              </div>
            </div>
          </header>

          <main className="px-8 py-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
              <p className="text-muted-foreground">Version {version.version_number} Preview</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Video Player */}
              <div className="lg:col-span-2">
                <Card className="shadow-elegant">
                  <CardContent className="p-0">
                    <UniversalVideoPlayer
                      ref={playerRef}
                      url={version.preview_url || version.final_url}
                      onTimeUpdate={setCurrentTime}
                    />
                  </CardContent>
                </Card>

                {version.final_url && (
                  <Card className="shadow-elegant mt-4 border-2 border-success/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-success">
                        <CheckCircle className="w-5 h-5" />
                        Final Version Available
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <a
                        href={version.final_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-medium"
                      >
                        Download/View Final Version
                      </a>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Feedback Section */}
              <div className="lg:col-span-1">
                <FeedbackComments
                  feedback={feedback}
                  currentTime={currentTime}
                  onAddFeedback={handleAddFeedback}
                  onSeekToTimestamp={handleSeekToTimestamp}
                  onResolveFeedback={handleResolveFeedback}
                  playerRef={playerRef}
                />
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default VideoPreview;
