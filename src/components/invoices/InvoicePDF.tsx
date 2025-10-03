import jsPDF from "jspdf";
import { type Invoice } from "./InvoiceCard";

interface Project {
  name: string;
  fee: number;
}

export const generateInvoicePDF = async (
  invoice: Invoice, 
  projects: Project[],
  editorName: string
) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", 105, 20, { align: "center" });
  
  // Invoice Details
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Invoice #: ${invoice.invoice_number || invoice.id.slice(0, 8)}`, 20, 35);
  doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, 20, 42);
  doc.text(`Month: ${invoice.month}`, 20, 49);
  doc.text(`Status: ${invoice.status.toUpperCase()}`, 20, 56);
  
  // Editor Details
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Editor:", 20, 70);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(editorName, 20, 77);
  
  // Projects Table
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Projects", 20, 95);
  
  // Table Header
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Project Name", 20, 105);
  doc.text("Amount", 150, 105);
  
  // Table Rows
  doc.setFont("helvetica", "normal");
  let yPos = 115;
  projects.forEach((project) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    doc.text(project.name, 20, yPos);
    doc.text(`₹${Number(project.fee).toFixed(2)}`, 150, yPos);
    yPos += 10;
  });
  
  // Line separator
  yPos += 5;
  doc.line(20, yPos, 190, yPos);
  
  // Summary
  yPos += 10;
  doc.setFont("helvetica", "bold");
  doc.text("Total Amount:", 20, yPos);
  doc.text(`₹${Number(invoice.total_amount).toFixed(2)}`, 150, yPos);
  
  yPos += 10;
  doc.setFont("helvetica", "normal");
  doc.text("Paid Amount:", 20, yPos);
  doc.text(`₹${Number(invoice.paid_amount).toFixed(2)}`, 150, yPos);
  
  yPos += 10;
  doc.setFont("helvetica", "bold");
  doc.text("Remaining Amount:", 20, yPos);
  doc.text(`₹${Number(invoice.remaining_amount).toFixed(2)}`, 150, yPos);
  
  // Payment Details
  if (invoice.payment_method) {
    yPos += 15;
    doc.setFont("helvetica", "normal");
    doc.text(`Payment Method: ${invoice.payment_method}`, 20, yPos);
  }
  
  if (invoice.paid_date) {
    yPos += 7;
    doc.text(`Paid Date: ${new Date(invoice.paid_date).toLocaleDateString()}`, 20, yPos);
  }
  
  // Notes
  if (invoice.notes) {
    yPos += 15;
    doc.setFont("helvetica", "bold");
    doc.text("Notes:", 20, yPos);
    yPos += 7;
    doc.setFont("helvetica", "normal");
    const splitNotes = doc.splitTextToSize(invoice.notes, 170);
    doc.text(splitNotes, 20, yPos);
  }
  
  // Footer
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(
      `Generated on ${new Date().toLocaleDateString()} | Page ${i} of ${pageCount}`,
      105,
      285,
      { align: "center" }
    );
  }
  
  // Save the PDF
  const fileName = `Invoice_${invoice.invoice_number || invoice.id.slice(0, 8)}_${invoice.month}.pdf`;
  doc.save(fileName);
};
