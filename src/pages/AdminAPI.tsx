import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { Key, Plus, Edit, Trash2, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface APIKey {
  id: string;
  name: string;
  provider: string;
  api_key: string;
  is_active: boolean;
  usage_limit: number | null;
  current_usage: number;
  environment: string;
  created_at: string;
  last_used: string | null;
}

export default function AdminAPI() {
  const navigate = useNavigate();
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<APIKey | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    provider: "openai",
    api_key: "",
    usage_limit: "",
    environment: "production",
    is_active: true,
  });

  useEffect(() => {
    checkAdminAuth();
    loadAPIKeys();
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

  const loadAPIKeys = async () => {
    try {
      const { data, error } = await supabase
        .from("api_keys")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error) {
      console.error("Error loading API keys:", error);
      toast.error("Failed to load API keys");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const keyData = {
        name: formData.name,
        provider: formData.provider,
        api_key: formData.api_key,
        usage_limit: formData.usage_limit ? Number(formData.usage_limit) : null,
        environment: formData.environment,
        is_active: formData.is_active,
      };

      if (editingKey) {
        const { error } = await supabase
          .from("api_keys")
          .update(keyData)
          .eq("id", editingKey.id);

        if (error) throw error;
        toast.success("API key updated successfully");
      } else {
        const { error } = await supabase
          .from("api_keys")
          .insert({ ...keyData, current_usage: 0 });

        if (error) throw error;
        toast.success("API key created successfully");
      }

      resetForm();
      setDialogOpen(false);
      loadAPIKeys();
    } catch (error: any) {
      console.error("Error saving API key:", error);
      toast.error(error.message || "Failed to save API key");
    }
  };

  const handleEdit = (key: APIKey) => {
    setEditingKey(key);
    setFormData({
      name: key.name,
      provider: key.provider,
      api_key: key.api_key,
      usage_limit: key.usage_limit?.toString() || "",
      environment: key.environment,
      is_active: key.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this API key?")) return;

    try {
      const { error } = await supabase
        .from("api_keys")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("API key deleted successfully");
      loadAPIKeys();
    } catch (error) {
      console.error("Error deleting API key:", error);
      toast.error("Failed to delete API key");
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("api_keys")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      toast.success(`API key ${!currentStatus ? 'enabled' : 'disabled'}`);
      loadAPIKeys();
    } catch (error) {
      console.error("Error toggling API key:", error);
      toast.error("Failed to update API key status");
    }
  };

  const resetForm = () => {
    setEditingKey(null);
    setFormData({
      name: "",
      provider: "openai",
      api_key: "",
      usage_limit: "",
      environment: "production",
      is_active: true,
    });
  };

  const maskApiKey = (key: string) => {
    return key.substring(0, 8) + "..." + key.substring(key.length - 4);
  };

  const getUsagePercentage = (current: number, limit: number | null) => {
    if (!limit) return 0;
    return (current / limit) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-success/5 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <Button variant="ghost" onClick={() => navigate("/admin")} className="mb-4">
              ← Back to Admin
            </Button>
            <h1 className="text-3xl font-bold">API & Integration Management</h1>
            <p className="text-muted-foreground">Manage API keys and third-party integrations</p>
          </div>
          <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            Add API Key
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="shadow-elegant">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Keys</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{apiKeys.length}</div>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Keys</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">
                {apiKeys.filter(k => k.is_active).length}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Providers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {new Set(apiKeys.map(k => k.provider)).size}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Near Limit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">
                {apiKeys.filter(k => k.usage_limit && getUsagePercentage(k.current_usage, k.usage_limit) > 80).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* API Keys Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {apiKeys.map((apiKey) => {
            const usagePercentage = getUsagePercentage(apiKey.current_usage, apiKey.usage_limit);
            const isNearLimit = usagePercentage > 80;

            return (
              <Card key={apiKey.id} className="shadow-elegant">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Key className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{apiKey.name}</CardTitle>
                        <CardDescription className="capitalize">{apiKey.provider}</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Badge className={apiKey.is_active ? "bg-success" : "bg-muted"}>
                        {apiKey.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline" className="capitalize">{apiKey.environment}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">API Key</p>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{maskApiKey(apiKey.api_key)}</code>
                    </div>

                    {apiKey.usage_limit && (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Usage</span>
                          <span className={isNearLimit ? "text-warning font-medium" : ""}>
                            {apiKey.current_usage} / {apiKey.usage_limit}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              isNearLimit ? "bg-warning" : "bg-success"
                            }`}
                            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {apiKey.last_used && (
                      <div className="text-sm text-muted-foreground">
                        Last used: {new Date(apiKey.last_used).toLocaleDateString()}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => toggleStatus(apiKey.id, apiKey.is_active)}
                      >
                        {apiKey.is_active ? (
                          <>
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Disable
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Enable
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEdit(apiKey)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(apiKey.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingKey ? "Edit API Key" : "Add New API Key"}</DialogTitle>
            <DialogDescription>
              Configure API key details and usage limits
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Key Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., OpenAI Production"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="provider">Provider</Label>
                <Select value={formData.provider} onValueChange={(value) => setFormData({ ...formData, provider: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="google">Google Gemini</SelectItem>
                    <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                    <SelectItem value="stripe">Stripe</SelectItem>
                    <SelectItem value="twilio">Twilio</SelectItem>
                    <SelectItem value="sendgrid">SendGrid</SelectItem>
                    <SelectItem value="aws">AWS</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="api_key">API Key</Label>
              <Input
                id="api_key"
                type="password"
                placeholder="sk-..."
                value={formData.api_key}
                onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="usage_limit">Usage Limit (optional)</Label>
                <Input
                  id="usage_limit"
                  type="number"
                  placeholder="10000"
                  value={formData.usage_limit}
                  onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="environment">Environment</Label>
                <Select value={formData.environment} onValueChange={(value) => setFormData({ ...formData, environment: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="staging">Staging</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingKey ? "Update Key" : "Add Key"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
