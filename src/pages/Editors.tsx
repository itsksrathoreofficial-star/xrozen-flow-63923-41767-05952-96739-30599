import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Mail, DollarSign, Briefcase, UserCircle, Calendar, Edit, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/database-config";
import { toast } from "sonner";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

interface Editor {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  specialty: string;
  employment_type: 'fulltime' | 'freelance';
  hourly_rate: number | null;
  monthly_salary: number | null;
}

export default function Editors() {
  const navigate = useNavigate();
  const [editors, setEditors] = useState<Editor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEditor, setEditingEditor] = useState<Editor | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    specialty: "",
    employment_type: "freelance" as 'fulltime' | 'freelance',
    hourly_rate: "",
    monthly_salary: "",
  });

  useEffect(() => {
    checkAuth();
    loadEditors();
  }, []);

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
    }
  };

  const loadEditors = async () => {
    try {
      const data = await db.query({
        collection: "editors",
        operation: "select",
        orderBy: { column: "created_at", ascending: false },
      });
      setEditors(data || []);
    } catch (error) {
      console.error("Error loading editors:", error);
      toast.error("Failed to load editors");
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
      
      if (editingEditor) {
        // Update existing editor
        const updatedEditor = await db.query({
          collection: "editors",
          operation: "update",
          where: { id: editingEditor.id },
          data: {
            full_name: formData.full_name,
            email: formData.email,
            specialty: formData.specialty,
            employment_type: formData.employment_type,
            hourly_rate: null,
            monthly_salary: formData.employment_type === 'fulltime' && formData.monthly_salary ? parseFloat(formData.monthly_salary) : null,
          },
        });

        setEditors(editors.map(e => e.id === editingEditor.id ? updatedEditor : e));
        toast.success("Editor updated successfully");
      } else {
        // Create new editor
        const newEditor = await db.query({
          collection: "editors",
          operation: "insert",
          data: {
            user_id: user?.id || null,
            full_name: formData.full_name,
            email: formData.email,
            specialty: formData.specialty,
            employment_type: formData.employment_type,
            hourly_rate: null,
            monthly_salary: formData.employment_type === 'fulltime' && formData.monthly_salary ? parseFloat(formData.monthly_salary) : null,
          },
        });

        setEditors([newEditor, ...editors]);
        toast.success("Editor added successfully");
      }

      setIsDialogOpen(false);
      setEditingEditor(null);
      setFormData({ full_name: "", email: "", specialty: "", employment_type: "freelance", hourly_rate: "", monthly_salary: "" });
    } catch (error) {
      console.error("Error saving editor:", error);
      toast.error("Failed to save editor");
    }
  };

  const handleEdit = (editor: Editor) => {
    setEditingEditor(editor);
    setFormData({
      full_name: editor.full_name,
      email: editor.email,
      specialty: editor.specialty || "",
      employment_type: editor.employment_type,
      hourly_rate: editor.hourly_rate?.toString() || "",
      monthly_salary: editor.monthly_salary?.toString() || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (editorId: string) => {
    try {
      await db.query({
        collection: "editors",
        operation: "delete",
        where: { id: editorId },
      });

      setEditors(editors.filter(e => e.id !== editorId));
      toast.success("Editor deleted successfully");
    } catch (error) {
      console.error("Error deleting editor:", error);
      toast.error("Failed to delete editor");
    }
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingEditor(null);
      setFormData({ full_name: "", email: "", specialty: "", employment_type: "freelance", hourly_rate: "", monthly_salary: "" });
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
                  <UserCircle className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Editors</h1>
                  <p className="text-sm text-muted-foreground">Manage your video editing team</p>
                </div>
              </div>

              <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
                <DialogTrigger asChild>
                  <Button className="gradient-primary">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Editor
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingEditor ? "Edit Editor" : "Add New Editor"}</DialogTitle>
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
                      <Label htmlFor="specialty">Specialty</Label>
                      <Textarea
                        id="specialty"
                        value={formData.specialty}
                        onChange={(e) =>
                          setFormData({ ...formData, specialty: e.target.value })
                        }
                        placeholder="e.g., Motion Graphics, Color Grading"
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
                        <Label htmlFor="monthly_salary">Monthly Salary (₹)</Label>
                        <Input
                          id="monthly_salary"
                          type="number"
                          step="0.01"
                          value={formData.monthly_salary}
                          onChange={(e) =>
                            setFormData({ ...formData, monthly_salary: e.target.value })
                          }
                        />
                      </div>
                    )}

                    <Button type="submit" className="w-full gradient-primary">
                      {editingEditor ? "Update Editor" : "Add Editor"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </header>

          <main className="px-8 py-8">

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {editors.map((editor) => (
                <Card key={editor.id} className="shadow-elegant hover:shadow-glow transition-smooth">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                        {editor.full_name.charAt(0)}
                      </div>
                      {editor.full_name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      {editor.email}
                    </div>
                    {editor.specialty && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Briefcase className="h-4 w-4" />
                        {editor.specialty}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {editor.employment_type === 'fulltime' ? 'Full Time' : 'Freelance'}
                    </div>
                    {editor.hourly_rate && (
                      <div className="flex items-center gap-2 text-sm font-semibold text-success">
                        <DollarSign className="h-4 w-4" />
                        ₹{editor.hourly_rate}/hr
                      </div>
                    )}
                    {editor.monthly_salary && (
                      <div className="flex items-center gap-2 text-sm font-semibold text-success">
                        <DollarSign className="h-4 w-4" />
                        ₹{editor.monthly_salary}/month
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-2 pt-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => navigate(`/editors/${editor.id}/worksheet`)}
                        className="w-full gradient-primary"
                      >
                        View Worksheet
                      </Button>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(editor)}
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
                              <AlertDialogTitle>Delete Editor?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {editor.full_name}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(editor.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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

            {editors.length === 0 && (
              <div className="text-center py-12">
                <UserCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">No editors added yet</p>
                <Button onClick={() => setIsDialogOpen(true)} className="gradient-primary">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Editor
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
