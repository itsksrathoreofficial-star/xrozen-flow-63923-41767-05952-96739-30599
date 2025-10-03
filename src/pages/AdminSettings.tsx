import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Settings, CreditCard, ToggleLeft } from "lucide-react";
import { toast } from "sonner";

export default function AdminSettings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [appMode, setAppMode] = useState("free");
  const [razorpayKeyId, setRazorpayKeyId] = useState("");
  const [razorpayKeySecret, setRazorpayKeySecret] = useState("");

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

    loadSettings();
  };

  const loadSettings = async () => {
    try {
      // Load app mode
      const { data: modeData } = await supabase
        .from("app_settings" as any)
        .select("value")
        .eq("key", "app_mode")
        .single();

      if (modeData && "value" in modeData) {
        setAppMode((modeData.value as any).mode);
      }

      // Load Razorpay config
      const { data: razorpayData } = await supabase
        .from("app_settings" as any)
        .select("value")
        .eq("key", "razorpay_config")
        .single();

      if (razorpayData && "value" in razorpayData) {
        const config = razorpayData.value as any;
        setRazorpayKeyId(config.key_id || "");
        setRazorpayKeySecret(config.key_secret || "");
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const toggleAppMode = async () => {
    try {
      const newMode = appMode === "free" ? "paid" : "free";

      const { error } = await supabase
        .from("app_settings" as any)
        .update({ value: { mode: newMode } })
        .eq("key", "app_mode");

      if (error) throw error;

      setAppMode(newMode);
      toast.success(`App mode changed to ${newMode}`);
    } catch (error) {
      console.error("Error updating app mode:", error);
      toast.error("Failed to update app mode");
    }
  };

  const saveRazorpayConfig = async () => {
    try {
      const { error } = await supabase
        .from("app_settings" as any)
        .update({
          value: {
            key_id: razorpayKeyId,
            key_secret: razorpayKeySecret
          }
        })
        .eq("key", "razorpay_config");

      if (error) throw error;
      toast.success("Razorpay configuration saved");
    } catch (error) {
      console.error("Error saving Razorpay config:", error);
      toast.error("Failed to save Razorpay configuration");
    }
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
                  <Settings className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Admin Settings</h1>
                  <p className="text-sm text-muted-foreground">Configure app-wide settings</p>
                </div>
              </div>
            </div>
          </header>

          <main className="px-8 py-8 max-w-4xl mx-auto space-y-6">
            {/* App Mode Toggle */}
            <Card className="shadow-elegant">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ToggleLeft className="h-5 w-5" />
                      App Mode
                    </CardTitle>
                    <CardDescription>
                      Switch between free and paid subscription enforcement
                    </CardDescription>
                  </div>
                  <Badge className={appMode === "free" ? "bg-success" : "bg-primary"}>
                    {appMode === "free" ? "Free Mode" : "Paid Mode"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Current Mode: {appMode.toUpperCase()}</p>
                    <p className="text-sm text-muted-foreground">
                      {appMode === "free" 
                        ? "No payment required, full access for testing"
                        : "Subscription required, payment enforcement active"}
                    </p>
                  </div>
                  <Switch
                    checked={appMode === "paid"}
                    onCheckedChange={toggleAppMode}
                  />
                </div>

                <div className="text-sm text-muted-foreground">
                  <p className="font-semibold mb-2">Mode Details:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Free Mode:</strong> Users can select any plan without payment. Perfect for testing and development.</li>
                    <li><strong>Paid Mode:</strong> Users must complete payment via Razorpay to activate subscriptions.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Razorpay Configuration */}
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Razorpay Configuration
                </CardTitle>
                <CardDescription>
                  Configure Razorpay payment gateway
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="razorpay-key-id">Razorpay Key ID</Label>
                  <Input
                    id="razorpay-key-id"
                    value={razorpayKeyId}
                    onChange={(e) => setRazorpayKeyId(e.target.value)}
                    placeholder="rzp_test_..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="razorpay-key-secret">Razorpay Key Secret</Label>
                  <Input
                    id="razorpay-key-secret"
                    type="password"
                    value={razorpayKeySecret}
                    onChange={(e) => setRazorpayKeySecret(e.target.value)}
                    placeholder="Enter secret key"
                  />
                </div>

                <Button 
                  className="gradient-primary w-full"
                  onClick={saveRazorpayConfig}
                >
                  Save Razorpay Configuration
                </Button>

                <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                  <p className="font-semibold mb-1">How to get Razorpay keys:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Sign up at razorpay.com</li>
                    <li>Go to Settings → API Keys</li>
                    <li>Generate keys for Test/Live mode</li>
                    <li>Copy and paste here</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
