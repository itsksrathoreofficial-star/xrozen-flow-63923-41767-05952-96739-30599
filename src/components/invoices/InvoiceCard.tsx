import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText, Trash2, Edit, DollarSign, Download } from "lucide-react";
import { format } from "date-fns";

// Local type definition matching our database schema
export interface Invoice {
  id: string;
  editor_id: string;
  month: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: "pending" | "paid" | "partial";
  payment_method: string | null;
  proceed_date: string | null;
  paid_date: string | null;
  invoice_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface InvoiceCardProps {
  invoice: Invoice;
  onEdit: (invoice: Invoice) => void;
  onDelete: (id: string) => void;
  onProcessPayment: (invoice: Invoice) => void;
  onDownloadPDF: (invoice: Invoice) => void;
}

export default function InvoiceCard({ 
  invoice, 
  onEdit, 
  onDelete, 
  onProcessPayment,
  onDownloadPDF 
}: InvoiceCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-success/10 text-success";
      case "pending":
        return "bg-warning/10 text-warning";
      case "partial":
        return "bg-primary/10 text-primary";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "paid":
        return "Paid";
      case "pending":
        return "Pending";
      case "partial":
        return "Partially Paid";
      default:
        return status;
    }
  };

  return (
    <Card className="shadow-elegant hover:shadow-glow transition-smooth">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-semibold">Invoice #{invoice.id.slice(0, 8)}</h3>
                <Badge className={getStatusColor(invoice.status)} variant="secondary">
                  {getStatusText(invoice.status)}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {format(new Date(invoice.created_at), "MMM dd, yyyy")} • Month: {invoice.month}
              </div>
              {invoice.notes && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-1">{invoice.notes}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Total</div>
              <div className="text-2xl font-bold">₹{Number(invoice.total_amount).toFixed(2)}</div>
              {invoice.remaining_amount > 0 && (
                <div className="text-sm text-warning">
                  Remaining: ₹{Number(invoice.remaining_amount).toFixed(2)}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {invoice.status !== "paid" && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onProcessPayment(invoice)}
                  className="gap-2"
                >
                  <DollarSign className="h-4 w-4" />
                  Payment
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownloadPDF(invoice)}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                PDF
              </Button>
              <Button variant="outline" size="icon" onClick={() => onEdit(invoice)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => onDelete(invoice.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
