import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Users, DollarSign, FileText, BarChart3, LogOut, Settings, MessageSquare, Database } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/database-config";
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Profile {
  id: string;
  full_name: string;
  email: string;
  user_category: string;
  subscription_tier: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Use universal database layer
      const profileData = await db.query({
        collection: 'profiles',
        operation: 'select',
        where: { id: session.user.id },
        limit: 1
      }) as Profile[];

      if (profileData && profileData.length > 0) {
        setProfile(profileData[0]);
      }

      // Load projects
      const projectsData = await db.query({
        collection: 'projects',
        operation: 'select',
        where: { creator_id: session.user.id }
      }) as any[];
      setProjects(projectsData || []);

      // Load payments
      const paymentsData = await db.query({
        collection: 'payments',
        operation: 'select',
        where: { recipient_id: session.user.id }
      }) as any[];
      setPayments(paymentsData || []);

    } catch (error: any) {
      toast.error("Failed to load dashboard data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const projectStatusData = {
    labels: ['Draft', 'In Review', 'Approved', 'Completed'],
    datasets: [{
      data: [
        projects.filter(p => p.status === 'draft').length,
        projects.filter(p => p.status === 'in_review').length,
        projects.filter(p => p.status === 'approved').length,
        projects.filter(p => p.status === 'completed').length,
      ],
      backgroundColor: ['#94a3b8', '#3b82f6', '#10b981', '#22c55e'],
    }]
  };

  const paymentData = {
    labels: ['Pending', 'Paid', 'Overdue'],
    datasets: [{
      label: 'Payments',
      data: [
        payments.filter(p => p.status === 'pending').length,
        payments.filter(p => p.status === 'paid').length,
        payments.filter(p => p.status === 'overdue').length,
      ],
      backgroundColor: ['#f59e0b', '#10b981', '#ef4444'],
    }]
  };

  const totalRevenue = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

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
        <div className="flex-1 bg-gradient-to-br from-background via-primary/5 to-success/5">
          {/* Header */}
          <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
            <div className="flex items-center px-6 py-4 gap-4">
              <SidebarTrigger />
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-glow">
                  <Video className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Xrozen Workflow</h1>
                  <p className="text-sm text-muted-foreground capitalize">
                    {profile?.user_category} • {profile?.subscription_tier}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </header>

          <main className="px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {profile?.full_name || 'User'}!</h2>
          <p className="text-muted-foreground">Here's an overview of your workflow</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-elegant hover:shadow-glow transition-smooth cursor-pointer"
                onClick={() => navigate("/projects")}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <Video className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{projects.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Active projects</p>
            </CardContent>
          </Card>

          <Card className="shadow-elegant hover:shadow-glow transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="w-4 h-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₹{totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Total earned</p>
            </CardContent>
          </Card>

          <Card className="shadow-elegant hover:shadow-glow transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <FileText className="w-4 h-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {payments.filter(p => p.status === 'pending').length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting payment</p>
            </CardContent>
          </Card>

          <Card className="shadow-elegant hover:shadow-glow transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <BarChart3 className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {projects.length > 0 
                  ? Math.round((projects.filter(p => p.status === 'completed').length / projects.length) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">Projects completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Project Status</CardTitle>
              <CardDescription>Distribution of your projects by status</CardDescription>
            </CardHeader>
            <CardContent>
              <Doughnut data={projectStatusData} options={{ maintainAspectRatio: true }} />
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Payment Overview</CardTitle>
              <CardDescription>Payment status breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <Bar data={paymentData} options={{ 
                maintainAspectRatio: true,
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                  }
                }
              }} />
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with common tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              className="gradient-primary h-auto py-4 flex-col gap-2"
              onClick={() => navigate("/projects")}
            >
              <Video className="w-6 h-6" />
              <span>Manage Projects</span>
            </Button>
            <Button 
              className="h-auto py-4 flex-col gap-2"
              variant="outline"
              onClick={() => navigate("/chat")}
            >
              <MessageSquare className="w-6 h-6" />
              <span>Messages</span>
            </Button>
            <Button 
              className="h-auto py-4 flex-col gap-2 gradient-success"
              onClick={() => navigate("/profile")}
            >
              <Settings className="w-6 h-6" />
              <span>Settings</span>
            </Button>
          </CardContent>
        </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
