// Server-side invoice PDF generation (mirrors src/lib/generateInvoice.ts)
import { jsPDF } from "npm:jspdf@2.5.2";

export interface InvoiceOrder {
  id: string;
  order_number?: string;
  order_date?: string;
  created_at: string;
  status: string;
  total_amount: number;
  subtotal?: number;
  gst_amount?: number;
  shipping_amount?: number;
  shipping_cost?: number;
  payment_method?: string;
  payment_status?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  shipping_address?: string;
  shipping_address2?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_pincode?: string;
  line_items?: Array<{
    title?: string;
    name?: string;
    quantity: number;
    price: number;
  }>;
}

const inr = (n: number) => `Rs ${Number(n ?? 0).toLocaleString("en-IN")}`;

/** Returns the invoice PDF as a base64 string (no data-uri prefix). */
export function buildInvoicePdfBase64(order: InvoiceOrder): string {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = 50;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("MYTHICAL VAULT", margin, y);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("TAX INVOICE", pageWidth - margin, y, { align: "right" });

  const orderNo = order.order_number ?? order.id.slice(0, 8).toUpperCase();
  const dateStr = new Date(order.order_date ?? order.created_at).toLocaleDateString("en-IN", {
    dateStyle: "long",
  });

  y += 18;
  doc.setFontSize(9);
  doc.text(`Invoice #: ${orderNo}`, pageWidth - margin, y, { align: "right" });
  y += 12;
  doc.text(`Date: ${dateStr}`, pageWidth - margin, y, { align: "right" });

  y += 28;
  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 20;

  doc.setFont("helvetica", "bold");
  doc.text("Billed To", margin, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  if (order.customer_name) { doc.text(order.customer_name, margin, y); y += 12; }
  if (order.customer_email) { doc.text(order.customer_email, margin, y); y += 12; }
  if (order.customer_phone) { doc.text(order.customer_phone, margin, y); y += 12; }

  const addrLines = [
    order.shipping_address,
    order.shipping_address2,
    [order.shipping_city, order.shipping_state, order.shipping_pincode].filter(Boolean).join(", "),
  ].filter(Boolean) as string[];
  addrLines.forEach((line) => { doc.text(line, margin, y); y += 12; });

  y += 18;

  const col = { item: margin, qty: 330, price: 400, amount: 470 };
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("ITEM", col.item, y);
  doc.text("QTY", col.qty, y);
  doc.text("PRICE", col.price, y);
  doc.text("AMOUNT", col.amount, y);
  y += 8;
  doc.line(margin, y, pageWidth - margin, y);
  y += 16;

  doc.setFont("helvetica", "normal");
  (order.line_items ?? []).forEach((item) => {
    const amount = Number(item.price) * Number(item.quantity);
    doc.text(String(item.title ?? item.name ?? "Item"), col.item, y, { maxWidth: 270 });
    doc.text(String(item.quantity), col.qty, y);
    doc.text(inr(item.price), col.price, y);
    doc.text(inr(amount), col.amount, y);
    y += 18;
  });

  y += 8;
  doc.line(margin, y, pageWidth - margin, y);
  y += 20;

  const totalsX = 400;
  const rightAlignX = pageWidth - margin;
  const row = (label: string, value: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.text(label, totalsX, y);
    doc.text(value, rightAlignX, y, { align: "right" });
    y += 16;
  };

  row("Subtotal", inr(order.subtotal ?? 0));
  row("GST", inr(order.gst_amount ?? 0));
  row("Shipping", inr(order.shipping_amount ?? order.shipping_cost ?? 0));
  y += 4;
  doc.line(totalsX, y, rightAlignX, y);
  y += 16;
  row("Total", inr(order.total_amount), true);

  y += 28;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Payment Method: ${order.payment_method ?? "-"}`, margin, y); y += 14;
  doc.text(`Payment Status: ${order.payment_status ?? "-"}`, margin, y); y += 14;
  doc.text(`Order Status: ${String(order.status ?? "").replace(/_/g, " ")}`, margin, y);

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(
    "This is a computer-generated invoice and does not require a signature.",
    margin,
    doc.internal.pageSize.getHeight() - 30,
  );

  const buf = doc.output("arraybuffer") as ArrayBuffer;
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function invoiceFilename(order: InvoiceOrder): string {
  const orderNo = order.order_number ?? order.id.slice(0, 8).toUpperCase();
  return `Invoice-${orderNo}.pdf`;
}
