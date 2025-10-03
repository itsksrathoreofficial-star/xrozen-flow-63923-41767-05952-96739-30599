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
import { ArrowLeft, Calendar, TrendingUp, CheckCircle, Clock, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";

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

interface Client {
  id: string;
  full_name: string;
  email: string;
  company: string;
  employment_type: string;
}

const ClientWorkSheet = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
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
    if (clientId) {
      fetchClientData();
      fetchProjects();
    }
  }, [clientId]);

  useEffect(() => {
    filterProjects();
  }, [projects, selectedMonth, selectedYear]);

  const fetchClientData = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();

      if (error) throw error;
      setClient(data);
    } catch (error: any) {
      toast.error("Failed to fetch client data");
      console.error(error);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("client_id", clientId)
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
    const inProgress = filteredProjects.filter(p => p.status === "in-progress").length;
    
    const completedWithDates = filteredProjects.filter(p => 
      p.status === "completed" && p.assigned_date && p.updated_at
    );
    
    const avgCompletionTime = completedWithDates.length > 0
      ? completedWithDates.reduce((acc, p) => {
          const days = differenceInDays(new Date(p.updated_at), new Date(p.assigned_date));
          return acc + days;
        }, 0) / completedWithDates.length
      : 0;

    const totalSpent = filteredProjects.filter(p => p.status === "completed").reduce((acc, p) => acc + (p.fee || 0), 0);
    const pendingAmount = filteredProjects.filter(p => p.status !== "completed").reduce((acc, p) => acc + (p.fee || 0), 0);

    return { 
      total, 
      completed, 
      inProgress,
      avgCompletionTime: Math.round(avgCompletionTime), 
      totalSpent,
      pendingAmount
    };
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
              <Button variant="ghost" size="icon" onClick={() => navigate("/clients")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Client Work Sheet</h1>
                {client && (
                  <div>
                    <p className="text-muted-foreground">{client.full_name}</p>
                    {client.company && <p className="text-sm text-muted-foreground">{client.company}</p>}
                  </div>
                )}
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
                  <p className="text-xs text-muted-foreground">
                    {metrics.inProgress} in progress
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.completed}</div>
                  <p className="text-xs text-muted-foreground">
                    {metrics.total > 0 ? Math.round((metrics.completed / metrics.total) * 100) : 0}% completion rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{metrics.totalSpent.toLocaleString('en-IN')}</div>
                  <p className="text-xs text-muted-foreground">
                    On completed projects
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{metrics.pendingAmount.toLocaleString('en-IN')}</div>
                  <p className="text-xs text-muted-foreground">
                    For ongoing projects
                  </p>
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
                        <TableHead>Days Active</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProjects.map((project) => {
                        const parentName = getParentProjectName(project.parent_project_id);
                        const displayName = parentName ? `${parentName}: ${project.name}` : project.name;
                        const daysActive = project.assigned_date
                          ? differenceInDays(
                              project.status === "completed" ? new Date(project.updated_at) : new Date(),
                              new Date(project.assigned_date)
                            )
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
                            <TableCell>{daysActive !== null ? `${daysActive} days` : "-"}</TableCell>
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

export default ClientWorkSheet;
