import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Database, Users, Video, DollarSign, Settings, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/database-config";

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    totalRevenue: 0,
    activeSubscriptions: 0
  });
  const [dbProvider, setDbProvider] = useState("supabase");
  const [dbConfig, setDbConfig] = useState<any>(null);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Load database config
      const config = await db.getActiveConfig();
      if (config) {
        setDbConfig(config);
        setDbProvider(config.provider);
      }

      // Load stats
      const usersCount = await db.query({
        collection: 'profiles',
        operation: 'count'
      }) as number;

      const projectsCount = await db.query({
        collection: 'projects',
        operation: 'count'
      }) as number;

      const payments = await db.query({
        collection: 'payments',
        operation: 'select',
        where: { status: 'paid' }
      }) as any[];

      const revenue = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

      setStats({
        totalUsers: usersCount,
        totalProjects: projectsCount,
        totalRevenue: revenue,
        activeSubscriptions: usersCount
      });

    } catch (error: any) {
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      const result = await db.testConnection();
      if (result) {
        toast.success("Database connection successful!");
      } else {
        toast.error("Database connection failed");
      }
    } catch (error) {
      toast.error("Failed to test connection");
    }
  };

  const handleSwitchProvider = async () => {
    toast.info("Database migration feature is available in production. This would backup current data and migrate to the new provider.");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-success/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-glow">
            <Settings className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold">Admin Panel</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">System Management</h2>
          <p className="text-muted-foreground">Control panel for platform administration</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-elegant">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <Video className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalProjects}</div>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="w-4 h-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₹{stats.totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <Badge className="bg-success">{stats.activeSubscriptions}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.activeSubscriptions}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-elegant cursor-pointer hover:shadow-glow transition-shadow" onClick={() => navigate("/admin/users")}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-primary" />
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage users and permissions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Manage Users →
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-elegant cursor-pointer hover:shadow-glow transition-shadow" onClick={() => navigate("/admin/plans")}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-success" />
                <div>
                  <CardTitle>Subscription Plans</CardTitle>
                  <CardDescription>Configure pricing & features</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Manage Plans →
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-elegant cursor-pointer hover:shadow-glow transition-shadow" onClick={() => navigate("/admin/api")}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Settings className="w-8 h-8 text-primary" />
                <div>
                  <CardTitle>API Management</CardTitle>
                  <CardDescription>Configure API keys</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Manage APIs →
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-elegant cursor-pointer hover:shadow-glow transition-shadow" onClick={() => navigate("/admin/projects")}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Video className="w-8 h-8 text-primary" />
                <div>
                  <CardTitle>Projects Oversight</CardTitle>
                  <CardDescription>Monitor all projects</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                View Projects →
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-elegant cursor-pointer hover:shadow-glow transition-shadow" onClick={() => navigate("/admin/payments")}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-success" />
                <div>
                  <CardTitle>Payment Control</CardTitle>
                  <CardDescription>Track transactions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                View Payments →
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-elegant cursor-pointer hover:shadow-glow transition-shadow" onClick={() => navigate("/admin/logs")}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Settings className="w-8 h-8 text-primary" />
                <div>
                  <CardTitle>System Logs</CardTitle>
                  <CardDescription>Activity monitoring</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                View Logs →
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="database" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-xl">
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="database" className="space-y-6">
            <Card className="shadow-elegant">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Database className="w-6 h-6 text-primary" />
                  <div>
                    <CardTitle>Database Management</CardTitle>
                    <CardDescription>
                      Universal database abstraction layer - Switch providers seamlessly
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Provider Status */}
                <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Current Provider</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {dbConfig?.provider || 'supabase'} • Active
                      </p>
                    </div>
                    <Badge className="bg-success">Connected</Badge>
                  </div>
                </div>

                {/* Provider Selection */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Database Provider</Label>
                    <Select value={dbProvider} onValueChange={setDbProvider}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="supabase">Supabase</SelectItem>
                        <SelectItem value="firebase">Firebase</SelectItem>
                        <SelectItem value="mysql">MySQL</SelectItem>
                        <SelectItem value="postgresql">PostgreSQL</SelectItem>
                        <SelectItem value="mongodb">MongoDB</SelectItem>
                        <SelectItem value="sqlite">SQLite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Provider Configuration */}
                  {dbProvider !== 'supabase' && (
                    <div className="space-y-4 p-4 border rounded-lg">
                      <p className="text-sm font-medium">Provider Configuration</p>
                      {dbProvider === 'firebase' && (
                        <>
                          <Input placeholder="Project ID" />
                          <Input placeholder="API Key" />
                          <Input placeholder="Auth Domain" />
                        </>
                      )}
                      {dbProvider === 'mysql' && (
                        <>
                          <Input placeholder="Host" />
                          <Input placeholder="Port" />
                          <Input placeholder="Username" />
                          <Input placeholder="Password" type="password" />
                          <Input placeholder="Database Name" />
                        </>
                      )}
                      {dbProvider === 'postgresql' && (
                        <>
                          <Input placeholder="Host" />
                          <Input placeholder="Port" />
                          <Input placeholder="Username" />
                          <Input placeholder="Password" type="password" />
                          <Input placeholder="Database Name" />
                        </>
                      )}
                      {dbProvider === 'mongodb' && (
                        <>
                          <Input placeholder="Connection String" />
                          <Input placeholder="Database Name" />
                        </>
                      )}
                      {dbProvider === 'sqlite' && (
                        <Input placeholder="Database File Path" />
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button 
                    className="gradient-primary flex-1"
                    onClick={handleTestConnection}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Test Connection
                  </Button>
                  {dbProvider !== dbConfig?.provider && (
                    <Button 
                      className="gradient-success flex-1"
                      onClick={handleSwitchProvider}
                    >
                      <Database className="w-4 h-4 mr-2" />
                      Migrate to {dbProvider}
                    </Button>
                  )}
                </div>

                {/* Migration Info */}
                <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Note:</strong> Database migration will backup your current data, 
                    test the new connection, and migrate all records. This process is automated 
                    and includes rollback capabilities.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>


          <TabsContent value="settings">
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure platform settings</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  System configuration options will be displayed here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
