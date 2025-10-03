import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, TrendingUp, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays, startOfMonth, endOfMonth } from "date-fns";

interface Project {
  id: string;
  name: string;
  project_type: string;
  fee: number;
  assigned_date: string;
  deadline: string;
  created_at: string;
  updated_at: string;
  status: string;
  is_subproject: boolean;
  parent_project_id: string | null;
}

interface Editor {
  id: string;
  full_name: string;
  email: string;
  employment_type: string;
}

const EditorWorkSheet = () => {
  const { editorId } = useParams<{ editorId: string }>();
  const navigate = useNavigate();
  const [editor, setEditor] = useState<Editor | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());
  const months = [
    { value: "0", label: "January" }, { value: "1", label: "February" },
    { value: "2", label: "March" }, { value: "3", label: "April" },
    { value: "4", label: "May" }, { value: "5", label: "June" },
    { value: "6", label: "July" }, { value: "7", label: "August" },
    { value: "8", label: "September" }, { value: "9", label: "October" },
    { value: "10", label: "November" }, { value: "11", label: "December" }
  ];

  useEffect(() => {
    if (editorId) {
      fetchEditorData();
      fetchProjects();
    }
  }, [editorId]);

  useEffect(() => {
    filterProjects();
  }, [projects, selectedMonth, selectedYear]);

  const fetchEditorData = async () => {
    try {
      const { data, error } = await supabase
        .from("editors")
        .select("*")
        .eq("id", editorId)
        .single();

      if (error) throw error;
      setEditor(data);
    } catch (error: any) {
      toast.error("Failed to fetch editor data");
      console.error(error);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("editor_id", editorId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch projects");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = () => {
    if (selectedMonth === "all" && selectedYear === "all") {
      setFilteredProjects(projects);
      return;
    }

    const filtered = projects.filter((project) => {
      const projectDate = new Date(project.created_at);
      const yearMatch = selectedYear !== "all" ? projectDate.getFullYear().toString() === selectedYear : true;
      const monthMatch = selectedMonth !== "all" ? projectDate.getMonth().toString() === selectedMonth : true;
      return yearMatch && monthMatch;
    });

    setFilteredProjects(filtered);
  };

  const calculateMetrics = () => {
    const total = filteredProjects.length;
    const completed = filteredProjects.filter(p => p.status === "completed").length;
    
    const completedWithDates = filteredProjects.filter(p => 
      p.status === "completed" && p.assigned_date && p.updated_at
    );
    
    const avgCompletionTime = completedWithDates.length > 0
      ? completedWithDates.reduce((acc, p) => {
          const days = differenceInDays(new Date(p.updated_at), new Date(p.assigned_date));
          return acc + days;
        }, 0) / completedWithDates.length
      : 0;

    const totalFee = filteredProjects.reduce((acc, p) => acc + (p.fee || 0), 0);

    return { total, completed, avgCompletionTime: Math.round(avgCompletionTime), totalFee };
  };

  const metrics = calculateMetrics();

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      "in-progress": "secondary",
      draft: "outline",
      pending: "outline"
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const getParentProjectName = (parentId: string | null) => {
    if (!parentId) return null;
    const parent = projects.find(p => p.id === parentId);
    return parent?.name;
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1">
          <header className="border-b bg-background">
            <div className="flex items-center gap-4 px-6 py-4">
              <SidebarTrigger />
              <Button variant="ghost" size="icon" onClick={() => navigate("/editors")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Editor Work Sheet</h1>
                {editor && <p className="text-muted-foreground">{editor.full_name}</p>}
              </div>
            </div>
          </header>

          <div className="p-6 space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Filter by Date
                </CardTitle>
              </CardHeader>
              <CardContent className="flex gap-4">
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {years.map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Months</SelectItem>
                    {months.map(month => (
                      <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={() => { setSelectedMonth("all"); setSelectedYear("all"); }}>
                  Clear Filters
                </Button>
              </CardContent>
            </Card>

            {/* Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.total}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.completed}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Completion Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.avgCompletionTime} days</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{metrics.totalFee.toLocaleString('en-IN')}</div>
                </CardContent>
              </Card>
            </div>

            {/* Projects Table */}
            <Card>
              <CardHeader>
                <CardTitle>Projects List</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">Loading...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Assigned Date</TableHead>
                        <TableHead>Deadline</TableHead>
                        <TableHead>Fee</TableHead>
                        <TableHead>Completion Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProjects.map((project) => {
                        const parentName = getParentProjectName(project.parent_project_id);
                        const displayName = parentName ? `${parentName}: ${project.name}` : project.name;
                        const completionDays = project.status === "completed" && project.assigned_date
                          ? differenceInDays(new Date(project.updated_at), new Date(project.assigned_date))
                          : null;

                        return (
                          <TableRow key={project.id}>
                            <TableCell className="font-medium">{displayName}</TableCell>
                            <TableCell>{project.project_type || "N/A"}</TableCell>
                            <TableCell>{getStatusBadge(project.status)}</TableCell>
                            <TableCell>
                              {project.assigned_date ? format(new Date(project.assigned_date), "PP") : "N/A"}
                            </TableCell>
                            <TableCell>
                              {project.deadline ? format(new Date(project.deadline), "PP") : "N/A"}
                            </TableCell>
                            <TableCell>₹{project.fee?.toLocaleString('en-IN') || 0}</TableCell>
                            <TableCell>{completionDays !== null ? `${completionDays} days` : "-"}</TableCell>
                          </TableRow>
                        );
                      })}
                      {filteredProjects.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            No projects found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default EditorWorkSheet;
