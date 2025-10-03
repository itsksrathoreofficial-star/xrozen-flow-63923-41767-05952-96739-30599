import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface SubscriptionGuardProps {
  children: React.ReactNode;
  requiredAccess?: string;
}

export function SubscriptionGuard({ children, requiredAccess }: SubscriptionGuardProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      // Check app mode first
      const { data: settings } = await supabase
        .from("app_settings" as any)
        .select("value")
        .eq("key", "app_mode")
        .single();

      const appMode = settings && "value" in settings ? (settings.value as any).mode : "free";

      // In free mode, allow everything
      if (appMode === "free") {
        setHasAccess(true);
        setLoading(false);
        return;
      }

      // In paid mode, check subscription
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: subscription } = await supabase
        .from("user_subscriptions" as any)
        .select("*, subscription_plans(*)")
        .eq("user_id", user.id)
        .single();

      if (!subscription) {
        setHasAccess(false);
        setSubscriptionStatus(null);
      } else if ((subscription as any).status === "active") {
        // Check if subscription expired
        const endDate = new Date((subscription as any).end_date);
        if (endDate < new Date()) {
          setHasAccess(false);
          setSubscriptionStatus("expired");
        } else {
          setHasAccess(true);
          setSubscriptionStatus(subscription);
        }
      } else if ((subscription as any).status === "limited") {
        // Limited access - can only view shared projects
        setHasAccess(requiredAccess === "view");
        setSubscriptionStatus(subscription);
      } else {
        setHasAccess(false);
        setSubscriptionStatus(subscription);
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-success/5">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-success/5 p-4">
        <Card className="max-w-md w-full shadow-elegant">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-warning" />
              <CardTitle>Subscription Required</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {subscriptionStatus?.status === "expired" 
                ? "Your subscription has expired. Please renew to continue using this feature."
                : subscriptionStatus?.status === "limited"
                ? "Your free account has limited access. Upgrade to unlock full features."
                : "You need an active subscription to access this feature."}
            </p>
            <div className="flex gap-2">
              <Button 
                className="gradient-primary flex-1"
                onClick={() => navigate("/subscription-select")}
              >
                {subscriptionStatus?.status === "expired" ? "Renew Now" : "Upgrade Plan"}
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate("/dashboard")}
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
