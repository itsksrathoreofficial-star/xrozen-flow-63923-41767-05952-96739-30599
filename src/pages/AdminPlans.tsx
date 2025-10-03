// @ts-nocheck - Waiting for database migration to generate types
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface SubscriptionPlan {
  id: string;
  name: string;
  category: string;
  tier: string;
  price: number;
  billing_period: string;
  features: string[];
  project_limit: number | null;
  storage_limit: number | null;
  is_active: boolean;
  trial_days: number;
  created_at: string;
}

export default function AdminPlans() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "editor",
    tier: "basic",
    price: "",
    billing_period: "monthly",
    features: "",
    project_limit: "",
    storage_limit: "",
    trial_days: "30",
    is_active: true,
  });

  useEffect(() => {
    checkAdminAuth();
    loadPlans();
  }, []);

  const checkAdminAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      toast.error("Unauthorized access");
      navigate("/dashboard");
    }
  };

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .order("category", { ascending: true })
        .order("price", { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error("Error loading plans:", error);
      toast.error("Failed to load subscription plans");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const features = formData.features
        .split('\n')
        .filter(f => f.trim())
        .map(f => f.trim());

      const planData = {
        name: formData.name,
        category: formData.category,
        tier: formData.tier,
        price: Number(formData.price),
        billing_period: formData.billing_period,
        features,
        project_limit: formData.project_limit ? Number(formData.project_limit) : null,
        storage_limit: formData.storage_limit ? Number(formData.storage_limit) : null,
        trial_days: Number(formData.trial_days),
        is_active: formData.is_active,
      };

      if (editingPlan) {
        const { error } = await supabase
          .from("subscription_plans")
          .update(planData)
          .eq("id", editingPlan.id);

        if (error) throw error;
        toast.success("Plan updated successfully");
      } else {
        const { error } = await supabase
          .from("subscription_plans")
          .insert(planData);

        if (error) throw error;
        toast.success("Plan created successfully");
      }

      resetForm();
      setDialogOpen(false);
      loadPlans();
    } catch (error: any) {
      console.error("Error saving plan:", error);
      toast.error(error.message || "Failed to save plan");
    }
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      category: plan.category,
      tier: plan.tier,
      price: plan.price.toString(),
      billing_period: plan.billing_period,
      features: plan.features.join('\n'),
      project_limit: plan.project_limit?.toString() || "",
      storage_limit: plan.storage_limit?.toString() || "",
      trial_days: plan.trial_days.toString(),
      is_active: plan.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this plan?")) return;

    try {
      const { error } = await supabase
        .from("subscription_plans")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Plan deleted successfully");
      loadPlans();
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast.error("Failed to delete plan");
    }
  };

  const resetForm = () => {
    setEditingPlan(null);
    setFormData({
      name: "",
      category: "editor",
      tier: "basic",
      price: "",
      billing_period: "monthly",
      features: "",
      project_limit: "",
      storage_limit: "",
      trial_days: "30",
      is_active: true,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const groupedPlans = plans.reduce((acc, plan) => {
    if (!acc[plan.category]) acc[plan.category] = [];
    acc[plan.category].push(plan);
    return acc;
  }, {} as Record<string, SubscriptionPlan[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-success/5 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <Button variant="ghost" onClick={() => navigate("/admin")} className="mb-4">
              ← Back to Admin
            </Button>
            <h1 className="text-3xl font-bold">Subscription Plans</h1>
            <p className="text-muted-foreground">Manage pricing and features</p>
          </div>
          <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Plan
          </Button>
        </div>

        {Object.entries(groupedPlans).map(([category, categoryPlans]) => (
          <div key={category} className="mb-8">
            <h2 className="text-2xl font-bold capitalize mb-4">{category} Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {categoryPlans.map((plan) => (
                <Card key={plan.id} className="shadow-elegant">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{plan.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-2">
                          <DollarSign className="h-4 w-4" />
                          ₹{plan.price}/{plan.billing_period}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={plan.is_active ? "bg-success" : "bg-muted"}>
                          {plan.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Features:</p>
                        <ul className="text-sm space-y-1 mt-2">
                          {plan.features.map((feature, index) => (
                            <li key={index}>• {feature}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Projects:</p>
                          <p className="font-medium">{plan.project_limit || "Unlimited"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Storage:</p>
                          <p className="font-medium">{plan.storage_limit ? `${plan.storage_limit}GB` : "Unlimited"}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEdit(plan)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleDelete(plan.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Edit Plan" : "Create New Plan"}</DialogTitle>
            <DialogDescription>
              Configure subscription plan details and pricing
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Plan Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
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

              <div className="space-y-2">
                <Label htmlFor="tier">Tier</Label>
                <Select value={formData.tier} onValueChange={(value) => setFormData({ ...formData, tier: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="billing_period">Billing Period</Label>
                <Select value={formData.billing_period} onValueChange={(value) => setFormData({ ...formData, billing_period: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="features">Features (one per line)</Label>
              <Textarea
                id="features"
                placeholder="10 projects&#10;5GB storage&#10;Basic support"
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                rows={5}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project_limit">Project Limit</Label>
                <Input
                  id="project_limit"
                  type="number"
                  placeholder="Leave empty for unlimited"
                  value={formData.project_limit}
                  onChange={(e) => setFormData({ ...formData, project_limit: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="storage_limit">Storage Limit (GB)</Label>
                <Input
                  id="storage_limit"
                  type="number"
                  placeholder="Leave empty for unlimited"
                  value={formData.storage_limit}
                  onChange={(e) => setFormData({ ...formData, storage_limit: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trial_days">Trial Days</Label>
                <Input
                  id="trial_days"
                  type="number"
                  value={formData.trial_days}
                  onChange={(e) => setFormData({ ...formData, trial_days: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Active Plan</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingPlan ? "Update Plan" : "Create Plan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
