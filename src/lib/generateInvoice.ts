// src/lib/generateInvoice.ts
import { jsPDF } from "jspdf";
import type { Order } from "@/types/order";

export function generateInvoicePDF(order: Order) {
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

  y += 18;
  doc.setFontSize(9);
  doc.text(`Invoice #: ${order.order_number}`, pageWidth - margin, y, { align: "right" });
  y += 12;
  doc.text(`Date: ${new Date(order.order_date).toLocaleDateString("en-IN", { dateStyle: "long" })}`, pageWidth - margin, y, { align: "right" });

  y += 28;
  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 20;

  doc.setFont("helvetica", "bold");
  doc.text("Billed To", margin, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.text(order.customer_name, margin, y); y += 12;
  doc.text(order.customer_email, margin, y); y += 12;
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
  order.line_items.forEach((item) => {
    const amount = item.price * item.quantity;
    doc.text(item.title, col.item, y, { maxWidth: 270 });
    doc.text(String(item.quantity), col.qty, y);
    doc.text(`Rs ${item.price.toLocaleString("en-IN")}`, col.price, y);
    doc.text(`Rs ${amount.toLocaleString("en-IN")}`, col.amount, y);
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

  row("Subtotal", `Rs ${order.subtotal.toLocaleString("en-IN")}`);
  row("GST", `Rs ${order.gst_amount.toLocaleString("en-IN")}`);
  row("Shipping", `Rs ${order.shipping_amount.toLocaleString("en-IN")}`);
  y += 4;
  doc.line(totalsX, y, rightAlignX, y);
  y += 16;
  row("Total", `Rs ${order.total_amount.toLocaleString("en-IN")}`, true);

  y += 28;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Payment Method: ${order.payment_method ?? "-"}`, margin, y); y += 14;
  doc.text(`Payment Status: ${order.payment_status ?? "-"}`, margin, y); y += 14;
  doc.text(`Order Status: ${order.status.replace(/_/g, " ")}`, margin, y);

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(
    "This is a computer-generated invoice and does not require a signature.",
    margin,
    doc.internal.pageSize.getHeight() - 30
  );

  return doc;
}

// Opens the invoice in a new tab for viewing/printing
export function viewInvoicePDF(order: Order) {
  const doc = generateInvoicePDF(order);
  window.open(doc.output("bloburl") as unknown as string, "_blank");
}
