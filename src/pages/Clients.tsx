import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Mail, Building, Users, DollarSign, Calendar, Edit, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/database-config";
import { toast } from "sonner";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

interface Client {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  company: string;
  employment_type: 'fulltime' | 'freelance';
  project_rate: number | null;
  monthly_rate: number | null;
}

export default function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    company: "",
    employment_type: "freelance" as 'fulltime' | 'freelance',
    project_rate: "",
    monthly_rate: "",
  });

  useEffect(() => {
    checkAuth();
    loadClients();
  }, []);

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
    }
  };

  const loadClients = async () => {
    try {
      const data = await db.query({
        collection: "clients",
        operation: "select",
        orderBy: { column: "created_at", ascending: false },
      });
      setClients(data || []);
    } catch (error) {
      console.error("Error loading clients:", error);
      toast.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (editingClient) {
        // Update existing client
        const updatedClient = await db.query({
          collection: "clients",
          operation: "update",
          where: { id: editingClient.id },
          data: {
            full_name: formData.full_name,
            email: formData.email,
            company: formData.company,
            employment_type: formData.employment_type,
            project_rate: null,
            monthly_rate: formData.employment_type === 'fulltime' && formData.monthly_rate ? parseFloat(formData.monthly_rate) : null,
          },
        });

        setClients(clients.map(c => c.id === editingClient.id ? updatedClient : c));
        toast.success("Client updated successfully");
      } else {
        // Create new client
        const newClient = await db.query({
          collection: "clients",
          operation: "insert",
          data: {
            user_id: user?.id || null,
            full_name: formData.full_name,
            email: formData.email,
            company: formData.company,
            employment_type: formData.employment_type,
            project_rate: null,
            monthly_rate: formData.employment_type === 'fulltime' && formData.monthly_rate ? parseFloat(formData.monthly_rate) : null,
          },
        });

        setClients([newClient, ...clients]);
        toast.success("Client added successfully");
      }

      setIsDialogOpen(false);
      setEditingClient(null);
      setFormData({ full_name: "", email: "", company: "", employment_type: "freelance", project_rate: "", monthly_rate: "" });
    } catch (error) {
      console.error("Error saving client:", error);
      toast.error("Failed to save client");
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      full_name: client.full_name,
      email: client.email,
      company: client.company || "",
      employment_type: client.employment_type,
      project_rate: client.project_rate?.toString() || "",
      monthly_rate: client.monthly_rate?.toString() || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (clientId: string) => {
    try {
      await db.query({
        collection: "clients",
        operation: "delete",
        where: { id: clientId },
      });

      setClients(clients.filter(c => c.id !== clientId));
      toast.success("Client deleted successfully");
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.error("Failed to delete client");
    }
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingClient(null);
      setFormData({ full_name: "", email: "", company: "", employment_type: "freelance", project_rate: "", monthly_rate: "" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen">
        <AppSidebar />
        <div className="flex-1 bg-gradient-to-br from-background via-primary/5 to-success/5">
          <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
            <div className="flex items-center px-6 py-4 gap-4">
              <SidebarTrigger />
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-glow">
                  <Users className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Clients</h1>
                  <p className="text-sm text-muted-foreground">Manage your client relationships</p>
                </div>
              </div>

              <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
                <DialogTrigger asChild>
                  <Button className="gradient-primary">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Client
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingClient ? "Edit Client" : "Add New Client"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) =>
                          setFormData({ ...formData, full_name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) =>
                          setFormData({ ...formData, company: e.target.value })
                        }
                        placeholder="Optional"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="employment_type">Employment Type</Label>
                      <Select
                        value={formData.employment_type}
                        onValueChange={(value: 'fulltime' | 'freelance') =>
                          setFormData({ ...formData, employment_type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="freelance">Freelance</SelectItem>
                          <SelectItem value="fulltime">Full Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.employment_type === 'fulltime' && (
                      <div>
                        <Label htmlFor="monthly_rate">Monthly Rate (₹)</Label>
                        <Input
                          id="monthly_rate"
                          type="number"
                          step="0.01"
                          value={formData.monthly_rate}
                          onChange={(e) =>
                            setFormData({ ...formData, monthly_rate: e.target.value })
                          }
                        />
                      </div>
                    )}

                    <Button type="submit" className="w-full gradient-primary">
                      {editingClient ? "Update Client" : "Add Client"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </header>

          <main className="px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clients.map((client) => (
                <Card key={client.id} className="shadow-elegant hover:shadow-glow transition-smooth">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                        {client.full_name.charAt(0)}
                      </div>
                      {client.full_name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      {client.email}
                    </div>
                    {client.company && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building className="h-4 w-4" />
                        {client.company}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {client.employment_type === 'fulltime' ? 'Full Time' : 'Freelance'}
                    </div>
                    {client.project_rate && (
                      <div className="flex items-center gap-2 text-sm font-semibold text-success">
                        <DollarSign className="h-4 w-4" />
                        ₹{client.project_rate}/project
                      </div>
                    )}
                    {client.monthly_rate && (
                      <div className="flex items-center gap-2 text-sm font-semibold text-success">
                        <DollarSign className="h-4 w-4" />
                        ₹{client.monthly_rate}/month
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-2 pt-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => navigate(`/clients/${client.id}/worksheet`)}
                        className="w-full gradient-primary"
                      >
                        View Worksheet
                      </Button>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(client)}
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="flex-1 text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Client?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {client.full_name}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(client.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {clients.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">No clients added yet</p>
                <Button onClick={() => setIsDialogOpen(true)} className="gradient-primary">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Client
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
