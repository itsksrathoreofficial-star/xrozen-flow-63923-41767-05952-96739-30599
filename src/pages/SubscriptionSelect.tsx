import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";

export default function SubscriptionSelect() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<any[]>([]);
  const [userCategory, setUserCategory] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [appMode, setAppMode] = useState("free");

  useEffect(() => {
    loadUserAndPlans();
  }, []);

  const loadUserAndPlans = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Get user category
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_category")
        .eq("id", user.id)
        .single();

      if (profile) {
        setUserCategory(profile.user_category);

        // Load plans for this category
        const { data: plansData } = await supabase
          .from("subscription_plans" as any)
          .select("*")
          .eq("user_category", profile.user_category)
          .eq("is_active", true)
          .order("price_inr", { ascending: true });

        if (plansData) {
          setPlans(plansData);
        }
      }

      // Check app mode
      const { data: settings } = await supabase
        .from("app_settings" as any)
        .select("value")
        .eq("key", "app_mode")
        .single();

      if (settings && "value" in settings) {
        setAppMode((settings.value as any).mode);
      }
    } catch (error) {
      console.error("Error loading plans:", error);
      toast.error("Failed to load subscription plans");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlan(planId);
    const plan = plans.find(p => p.id === planId);
    
    if (appMode === "free") {
      // In free mode, skip payment
      await createSubscription(planId, "free");
    } else {
      // In paid mode, initiate Razorpay payment
      await initiatePayment(plan);
    }
  };

  const initiatePayment = async (plan: any) => {
    try {
      // Get Razorpay config
      const { data: config } = await supabase
        .from("app_settings" as any)
        .select("value")
        .eq("key", "razorpay_config")
        .single();

      if (!config || !("value" in config) || !(config.value as any).key_id) {
        toast.error("Payment gateway not configured");
        return;
      }

      const razorpayKeyId = (config.value as any).key_id;

      // Create order via edge function
      const { data: order, error } = await supabase.functions.invoke("create-razorpay-order", {
        body: { amount: plan.price_inr, planId: plan.id }
      });

      if (error) throw error;

      // Initialize Razorpay
      const options = {
        key: razorpayKeyId,
        amount: plan.price_inr * 100,
        currency: "INR",
        name: "Xrozen Workflow",
        description: plan.name,
        order_id: order.id,
        handler: async (response: any) => {
          await verifyPayment(response, plan.id);
        },
        prefill: {
          email: (await supabase.auth.getUser()).data.user?.email
        }
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to initiate payment");
    }
  };

  const verifyPayment = async (paymentResponse: any, planId: string) => {
    try {
      // Verify payment via edge function
      const { error } = await supabase.functions.invoke("verify-razorpay-payment", {
        body: paymentResponse
      });

      if (error) throw error;

      await createSubscription(planId, "razorpay", paymentResponse.razorpay_payment_id);
      toast.success("Payment successful! Subscription activated");
      navigate("/dashboard");
    } catch (error) {
      console.error("Payment verification error:", error);
      toast.error("Payment verification failed");
    }
  };

  const createSubscription = async (planId: string, paymentMethod: string, paymentId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const subscriptionData: any = {
        user_id: user.id,
        plan_id: planId,
        status: "active",
        payment_method: paymentMethod,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      const { error } = await supabase
        .from("user_subscriptions" as any)
        .insert(subscriptionData);

      if (error) throw error;

      if (paymentMethod === "free") {
        toast.success("Free access enabled");
      }
      
      navigate("/dashboard");
    } catch (error) {
      console.error("Subscription creation error:", error);
      toast.error("Failed to create subscription");
    }
  };

  const handleSkip = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create a free limited subscription
      await supabase.from("user_subscriptions" as any).insert({
        user_id: user.id,
        status: "limited",
        payment_method: "free"
      });

      toast.info("Limited free access enabled. You can only view shared projects.");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to skip subscription");
    }
  };

  const getPlanIcon = (index: number) => {
    const icons = [Zap, Crown, Sparkles];
    return icons[index] || Crown;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-success/5">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-success/5 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-lg text-muted-foreground">
            Select the perfect plan for your {userCategory} needs
          </p>
          {appMode === "free" && (
            <Badge className="mt-4 bg-success">Free Mode Active - No Payment Required</Badge>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {plans.map((plan, index) => {
            const Icon = getPlanIcon(index);
            const features = Array.isArray(plan.features) ? plan.features : [];
            const isPremium = index === 2;

            return (
              <Card
                key={plan.id}
                className={`shadow-elegant hover:shadow-glow transition-all ${
                  isPremium ? "border-primary border-2" : ""
                }`}
              >
                {isPremium && (
                  <div className="bg-gradient-primary text-primary-foreground text-center py-2 text-sm font-semibold rounded-t-lg">
                    Most Popular
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Icon className="h-8 w-8 text-primary" />
                    {isPremium && <Badge className="bg-success">Best Value</Badge>}
                  </div>
                  <CardTitle className="text-2xl mt-4">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">₹{plan.price_inr}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {features.map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-success shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={isPremium ? "gradient-primary w-full" : "w-full"}
                    variant={isPremium ? "default" : "outline"}
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={selectedPlan === plan.id}
                  >
                    {selectedPlan === plan.id ? "Processing..." : "Select Plan"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center">
          <Button variant="ghost" onClick={handleSkip}>
            Skip for now (Limited Access)
          </Button>
        </div>
      </div>
    </div>
  );
}
