import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Video, Clock, User, FileText, Plus, Edit, Trash2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/database-config";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { VersionManagement } from "@/components/project-details/VersionManagement";

const ProjectDetails = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [project, setProject] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [editor, setEditor] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadProjectDetails();
    loadUserRole();
    loadCurrentUser();
  }, [projectId]);

  const loadCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    } catch (error) {
      console.error("Error loading current user:", error);
    }
  };

  const loadUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const roles = await db.query({
        collection: 'user_roles',
        operation: 'select',
        where: { user_id: user.id },
        limit: 1
      }) as any[];

      if (roles && roles.length > 0) {
        setUserRole(roles[0].role);
      }
    } catch (error) {
      console.error("Error loading user role:", error);
    }
  };

  const loadProjectDetails = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Load project
      const projectData = await db.query({
        collection: 'projects',
        operation: 'select',
        where: { id: projectId }
      }) as any[];

      if (!projectData || projectData.length === 0) {
        toast.error("Project not found");
        navigate("/projects");
        return;
      }

      const projectInfo = projectData[0];
      setProject(projectInfo);

      // Load editor info if assigned
      if (projectInfo.editor_id) {
        const editorData = await db.query({
          collection: 'editors',
          operation: 'select',
          where: { id: projectInfo.editor_id }
        }) as any[];
        if (editorData && editorData.length > 0) {
          setEditor(editorData[0]);
        }
      }

      // Load client info if assigned
      if (projectInfo.client_id) {
        const clientData = await db.query({
          collection: 'clients',
          operation: 'select',
          where: { id: projectInfo.client_id }
        }) as any[];
        if (clientData && clientData.length > 0) {
          setClient(clientData[0]);
        }
      }

      // Load versions
      const versionsData = await db.query({
        collection: 'video_versions',
        operation: 'select',
        where: { project_id: projectId },
        orderBy: { column: 'version_number', ascending: false }
      }) as any[];
      
      setVersions(versionsData || []);
    } catch (error: any) {
      console.error("Error loading project details:", error);
      toast.error("Failed to load project details");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      await db.query({
        collection: 'projects',
        operation: 'update',
        where: { id: projectId },
        data: { status: newStatus }
      });

      setProject({ ...project, status: newStatus });
      toast.success("Status updated successfully");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: { variant: "secondary", label: "Draft", icon: FileText },
      in_review: { variant: "default", label: "In Review", icon: AlertCircle },
      approved: { variant: "default", label: "Approved", icon: CheckCircle, className: "bg-success" },
      completed: { variant: "default", label: "Completed", icon: CheckCircle, className: "bg-success" }
    };
    
    const config = variants[status] || variants.draft;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) {
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
                  onClick={() => navigate("/projects")}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Projects
                </Button>
              </div>
            </div>
          </header>

          <main className="px-8 py-8">
            {/* Project Header */}
            <div className="mb-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold mb-2">{project.name}</h1>
                  <p className="text-muted-foreground">{project.description || "No description"}</p>
                </div>
                {getStatusBadge(project.status)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                {/* Project Info Cards */}
                <Card className="shadow-elegant">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      Project Type
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-semibold">{project.project_type || "Not specified"}</p>
                  </CardContent>
                </Card>

                <Card className="shadow-elegant">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Editor
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-semibold">{editor?.full_name || "Not assigned"}</p>
                    {editor?.employment_type && (
                      <Badge variant="outline" className="mt-2">
                        {editor.employment_type}
                      </Badge>
                    )}
                  </CardContent>
                </Card>

                <Card className="shadow-elegant">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Client
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-semibold">{client?.full_name || "Not assigned"}</p>
                    {client?.company && (
                      <p className="text-sm text-muted-foreground mt-1">{client.company}</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Dates and Fee */}
              <Card className="shadow-elegant mt-4">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Assigned Date</p>
                      <p className="font-medium">
                        {project.assigned_date 
                          ? new Date(project.assigned_date).toLocaleDateString()
                          : "Not set"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Deadline</p>
                      <p className="font-medium">
                        {project.deadline 
                          ? new Date(project.deadline).toLocaleDateString()
                          : "Not set"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Project Fee</p>
                      <p className="font-medium">
                        {project.fee ? `₹${project.fee.toLocaleString()}` : "Not set"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Raw Footage</p>
                      {project.raw_footage_link ? (
                        <a 
                          href={project.raw_footage_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          View Link
                        </a>
                      ) : (
                        <p className="font-medium">Not provided</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Status Workflow */}
            <Card className="shadow-elegant mb-8">
              <CardHeader>
                <CardTitle>Status Workflow</CardTitle>
                <CardDescription>Update project status based on current progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {['draft', 'in_review', 'approved', 'completed'].map((status) => (
                    <Button
                      key={status}
                      variant={project.status === status ? "default" : "outline"}
                      onClick={() => handleStatusUpdate(status)}
                      className={project.status === status ? "gradient-primary" : ""}
                    >
                      {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Version Management */}
            <VersionManagement
              projectId={projectId!}
              versions={versions}
              onVersionsUpdate={loadProjectDetails}
              userRole={userRole}
              isProjectCreator={project?.creator_id === currentUserId}
            />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default ProjectDetails;
