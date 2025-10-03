// @ts-nocheck - Waiting for database migration to generate types
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Transaction {
  id: string;
  amount: number;
  description: string;
  transaction_date: string;
  transaction_type: string;
  payment_method: string | null;
}

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  onSuccess: () => void;
}

export default function ExpenseDialog({ 
  open, 
  onOpenChange, 
  transaction, 
  onSuccess 
}: ExpenseDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: transaction?.amount.toString() || "",
    description: transaction?.description || "",
    transactionDate: transaction?.transaction_date || new Date().toISOString().slice(0, 10),
    transactionType: transaction?.transaction_type || "expense",
    paymentMethod: transaction?.payment_method || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (Number(formData.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      if (transaction) {
        // Update existing transaction
        const { error } = await supabase
          .from("transactions")
          .update({
            amount: Number(formData.amount),
            description: formData.description,
            transaction_date: formData.transactionDate,
            transaction_type: formData.transactionType,
            payment_method: formData.paymentMethod || null,
          })
          .eq("id", transaction.id);

        if (error) throw error;
        toast.success("Transaction updated successfully");
      } else {
        // Create new transaction
        const { error } = await supabase
          .from("transactions")
          .insert({
            editor_id: user.id,
            amount: Number(formData.amount),
            description: formData.description,
            transaction_date: formData.transactionDate,
            transaction_type: formData.transactionType,
            payment_method: formData.paymentMethod || null,
          });

        if (error) throw error;
        toast.success("Transaction added successfully");
      }

      setFormData({
        amount: "",
        description: "",
        transactionDate: new Date().toISOString().slice(0, 10),
        transactionType: "expense",
        paymentMethod: "",
      });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error saving transaction:", error);
      toast.error("Failed to save transaction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{transaction ? "Edit" : "Add"} Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="transactionType">Transaction Type</Label>
            <Select 
              value={formData.transactionType} 
              onValueChange={(value) => setFormData({ ...formData, transactionType: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="deduction">Deduction</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter transaction description..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transactionDate">Date</Label>
            <Input
              id="transactionDate"
              type="date"
              value={formData.transactionDate}
              onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method (Optional)</Label>
            <Select 
              value={formData.paymentMethod} 
              onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : transaction ? "Update" : "Add"} Transaction
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
