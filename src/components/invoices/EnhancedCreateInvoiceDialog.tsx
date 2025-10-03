// @ts-nocheck - Waiting for database migration to generate types
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Project {
  id: string;
  name: string;
  fee: number;
  status: string;
}

interface EnhancedCreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function EnhancedCreateInvoiceDialog({ 
  open, 
  onOpenChange, 
  onSuccess 
}: EnhancedCreateInvoiceDialogProps) {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    month: new Date().toISOString().slice(0, 7),
    notes: "",
  });

  useEffect(() => {
    if (open) {
      loadProjects();
    }
  }, [open]);

  const loadProjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("projects")
        .select("id, name, fee, status")
        .eq("creator_id", user.id)
        .is("invoice_id", null)
        .not("fee", "is", null);

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error loading projects:", error);
      toast.error("Failed to load projects");
    }
  };

  const toggleProject = (projectId: string) => {
    const newSelected = new Set(selectedProjects);
    if (newSelected.has(projectId)) {
      newSelected.delete(projectId);
    } else {
      newSelected.add(projectId);
    }
    setSelectedProjects(newSelected);
  };

  const calculateTotal = () => {
    return projects
      .filter(p => selectedProjects.has(p.id))
      .reduce((sum, p) => sum + Number(p.fee || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedProjects.size === 0) {
      toast.error("Please select at least one project");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      const totalAmount = calculateTotal();
      const invoiceNumber = `INV-${Date.now()}`;

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          editor_id: user.id,
          month: formData.month,
          total_amount: totalAmount,
          remaining_amount: totalAmount,
          invoice_number: invoiceNumber,
          notes: formData.notes || null,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Link projects to invoice - update each project individually
      for (const projectId of selectedProjects) {
        const { error: updateError } = await supabase
          .from("projects")
          .update({ invoice_id: invoice.id })
          .eq("id", projectId);
        
        if (updateError) throw updateError;
      }

      toast.success("Invoice created successfully");
      setFormData({
        month: new Date().toISOString().slice(0, 7),
        notes: "",
      });
      setSelectedProjects(new Set());
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error("Failed to create invoice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="month">Invoice Month</Label>
            <Input
              id="month"
              type="month"
              value={formData.month}
              onChange={(e) => setFormData({ ...formData, month: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Select Projects</Label>
            <ScrollArea className="h-[200px] rounded-md border p-4">
              {projects.length === 0 ? (
                <p className="text-sm text-muted-foreground">No projects available for invoicing</p>
              ) : (
                <div className="space-y-2">
                  {projects.map((project) => (
                    <div key={project.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={project.id}
                        checked={selectedProjects.has(project.id)}
                        onCheckedChange={() => toggleProject(project.id)}
                      />
                      <label
                        htmlFor={project.id}
                        className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {project.name} - ₹{Number(project.fee).toFixed(2)}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total Amount:</span>
              <span className="text-2xl font-bold">₹{calculateTotal().toFixed(2)}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedProjects.size} project{selectedProjects.size !== 1 ? 's' : ''} selected
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || selectedProjects.size === 0}>
              {loading ? "Creating..." : "Create Invoice"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
