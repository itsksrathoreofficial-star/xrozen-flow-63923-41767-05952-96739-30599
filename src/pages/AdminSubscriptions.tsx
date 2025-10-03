import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Crown } from "lucide-react";
import { toast } from "sonner";

export default function AdminSubscriptions() {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    // Check if user is admin
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

    loadSubscriptions();
  };

  const loadSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from("user_subscriptions" as any)
        .select(`
          *,
          profiles:user_id (full_name, email),
          subscription_plans:plan_id (name, price_inr)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error) {
      console.error("Error loading subscriptions:", error);
      toast.error("Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  };

  const updateSubscriptionStatus = async (subscriptionId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("user_subscriptions" as any)
        .update({ status: newStatus })
        .eq("id", subscriptionId);

      if (error) throw error;
      toast.success("Subscription status updated");
      loadSubscriptions();
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast.error("Failed to update subscription");
    }
  };

  const extendSubscription = async (subscriptionId: string, days: number) => {
    try {
      const subscription = subscriptions.find(s => s.id === subscriptionId);
      const currentEndDate = new Date(subscription.end_date || Date.now());
      const newEndDate = new Date(currentEndDate.getTime() + days * 24 * 60 * 60 * 1000);

      const { error } = await supabase
        .from("user_subscriptions" as any)
        .update({ end_date: newEndDate.toISOString() })
        .eq("id", subscriptionId);

      if (error) throw error;
      toast.success(`Subscription extended by ${days} days`);
      loadSubscriptions();
    } catch (error) {
      console.error("Error extending subscription:", error);
      toast.error("Failed to extend subscription");
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, any> = {
      active: { label: "Active", className: "bg-success" },
      expired: { label: "Expired", className: "bg-destructive" },
      cancelled: { label: "Cancelled", className: "bg-secondary" },
      limited: { label: "Limited", className: "bg-warning" }
    };
    const config = configs[status] || configs.active;
    return <Badge className={config.className}>{config.label}</Badge>;
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
                  <h1 className="text-xl font-bold">Subscription Management</h1>
                  <p className="text-sm text-muted-foreground">Manage user subscriptions</p>
                </div>
              </div>
            </div>
          </header>

          <main className="px-8 py-8">
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>All Subscriptions</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell>{(sub.profiles as any)?.full_name || "N/A"}</TableCell>
                        <TableCell>{(sub.profiles as any)?.email || "N/A"}</TableCell>
                        <TableCell>
                          {(sub.subscription_plans as any)?.name || "Free"}
                          <div className="text-xs text-muted-foreground">
                            ₹{(sub.subscription_plans as any)?.price_inr || 0}/mo
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(sub.status)}</TableCell>
                        <TableCell>
                          {new Date(sub.start_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {sub.end_date ? new Date(sub.end_date).toLocaleDateString() : "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Select
                              value={sub.status}
                              onValueChange={(value) => updateSubscriptionStatus(sub.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="expired">Expired</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => extendSubscription(sub.id, 30)}
                            >
                              +30 Days
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
