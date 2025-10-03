import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Crown, Edit, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminPlansManagement() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    user_category: "editor",
    price_inr: "",
    client_limit: "",
    editor_limit: "",
    description: "",
    features: "",
    is_active: true
  });

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!roleData || roleData.role !== "admin") {
      toast.error("Access denied. Admin only.");
      navigate("/dashboard");
      return;
    }

    loadPlans();
  };

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("subscription_plans" as any)
        .select("*")
        .order("user_category", { ascending: true })
        .order("price_inr", { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error("Error loading plans:", error);
      toast.error("Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const planData = {
        name: formData.name,
        user_category: formData.user_category,
        price_inr: parseFloat(formData.price_inr),
        client_limit: formData.client_limit ? parseInt(formData.client_limit) : null,
        editor_limit: formData.editor_limit ? parseInt(formData.editor_limit) : null,
        description: formData.description,
        features: formData.features.split("\n").filter(f => f.trim()),
        is_active: formData.is_active
      };

      let error;
      if (editingPlan) {
        ({ error } = await supabase
          .from("subscription_plans" as any)
          .update(planData)
          .eq("id", editingPlan.id));
      } else {
        ({ error } = await supabase
          .from("subscription_plans" as any)
          .insert(planData));
      }

      if (error) throw error;

      toast.success(editingPlan ? "Plan updated successfully" : "Plan created successfully");
      setIsDialogOpen(false);
      resetForm();
      loadPlans();
    } catch (error) {
      console.error("Error saving plan:", error);
      toast.error("Failed to save plan");
    }
  };

  const handleEdit = (plan: any) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      user_category: plan.user_category,
      price_inr: plan.price_inr.toString(),
      client_limit: plan.client_limit?.toString() || "",
      editor_limit: plan.editor_limit?.toString() || "",
      description: plan.description || "",
      features: Array.isArray(plan.features) ? plan.features.join("\n") : "",
      is_active: plan.is_active
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (planId: string) => {
    if (!confirm("Are you sure you want to delete this plan?")) return;

    try {
      const { error } = await supabase
        .from("subscription_plans" as any)
        .delete()
        .eq("id", planId);

      if (error) throw error;
      toast.success("Plan deleted successfully");
      loadPlans();
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast.error("Failed to delete plan");
    }
  };

  const togglePlanStatus = async (planId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("subscription_plans" as any)
        .update({ is_active: !currentStatus })
        .eq("id", planId);

      if (error) throw error;
      toast.success("Plan status updated");
      loadPlans();
    } catch (error) {
      console.error("Error updating plan status:", error);
      toast.error("Failed to update plan status");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      user_category: "editor",
      price_inr: "",
      client_limit: "",
      editor_limit: "",
      description: "",
      features: "",
      is_active: true
    });
    setEditingPlan(null);
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
        <div className="flex-1 bg-gradient-to-br from-background via-primary/5 to-success/5">
          <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
            <div className="flex items-center px-6 py-4 gap-4">
              <SidebarTrigger />
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-glow">
                  <Crown className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Plans Management</h1>
                  <p className="text-sm text-muted-foreground">Create and manage subscription plans</p>
                </div>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gradient-primary" onClick={resetForm}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Plan
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingPlan ? "Edit Plan" : "Create New Plan"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Plan Name</Label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>User Category</Label>
                        <Select
                          value={formData.user_category}
                          onValueChange={(value) => setFormData({ ...formData, user_category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="client">Client</SelectItem>
                            <SelectItem value="agency">Agency</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Price (₹)</Label>
                        <Input
                          type="number"
                          value={formData.price_inr}
                          onChange={(e) => setFormData({ ...formData, price_inr: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Client Limit</Label>
                        <Input
                          type="number"
                          placeholder="Unlimited"
                          value={formData.client_limit}
                          onChange={(e) => setFormData({ ...formData, client_limit: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Editor Limit</Label>
                        <Input
                          type="number"
                          placeholder="Unlimited"
                          value={formData.editor_limit}
                          onChange={(e) => setFormData({ ...formData, editor_limit: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Features (one per line)</Label>
                      <Textarea
                        rows={5}
                        value={formData.features}
                        onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                        placeholder="Up to 5 Clients&#10;Unlimited Projects&#10;Basic Support"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                      <Label>Active</Label>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" className="gradient-primary">
                        {editingPlan ? "Update Plan" : "Create Plan"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </header>

          <main className="px-8 py-8">
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>All Plans</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Limits</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {plans.map((plan) => (
                        <TableRow key={plan.id}>
                          <TableCell className="font-medium">{plan.name}</TableCell>
                          <TableCell className="capitalize">{plan.user_category}</TableCell>
                          <TableCell>₹{plan.price_inr}/mo</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              Clients: {plan.client_limit || "∞"}<br />
                              Editors: {plan.editor_limit || "∞"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={plan.is_active ? "bg-success" : "bg-secondary"}>
                              {plan.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleEdit(plan)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => togglePlanStatus(plan.id, plan.is_active)}
                              >
                                {plan.is_active ? "Disable" : "Enable"}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(plan.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
