/**
 * whatsappHelpers.ts
 * ─────────────────────────────────────────────────────────────
 * Drop in: src/utils/whatsappHelpers.ts
 *
 * Zero-dependency helper for generating wa.me deep-links.
 * Each function returns an absolute URL you can pass to
 * window.open(url, '_blank') or an <a href>.
 * ─────────────────────────────────────────────────────────────
 */

// ── Types ────────────────────────────────────────────────────

export interface OrderBase {
  orderId: string;
  customerName: string;
  phone: string; // E.164 preferred, e.g. "919876543210"
  totalAmount: number;
  currency?: string; // default "INR"
}

export interface ShippedOrder extends OrderBase {
  trackingUrl: string;
  courierName?: string;
}

export interface CancelledOrder extends OrderBase {
  reason?: string;
}

export interface BackInStockAlert {
  phone: string;
  customerName: string;
  productName: string;
  productUrl?: string;
}

// ── Core helper ──────────────────────────────────────────────

/**
 * Sanitise a phone number to digits-only (strips +, spaces, dashes).
 */
export function sanitisePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Build a wa.me URL for the given phone + message.
 *
 * @param phone  Any format — will be cleaned automatically.
 * @param message Plain-text message (URL-encoded internally).
 */
export function buildWaLink(phone: string, message: string): string {
  const clean = sanitisePhone(phone);
  const encoded = encodeURIComponent(message.trim());
  return `https://wa.me/${clean}?text=${encoded}`;
}

// ── Currency formatter ───────────────────────────────────────

function fmt(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ── Per-event message factories ──────────────────────────────

/**
 * 1. Order Placed
 */
export function orderPlacedLink(order: OrderBase): string {
  const msg = `Hi ${order.customerName}! 👋

Thank you for your order at *Mythical Vault*! 🎉

🧾 *Order ID:* #${order.orderId}
💰 *Total:* ${fmt(order.totalAmount, order.currency)}

Your order has been received and is being processed. We'll keep you updated at every step!

Need help? Just reply to this message. 😊`;
  return buildWaLink(order.phone, msg);
}

/**
 * 2. COD Order – Request Confirmation
 */
export function codConfirmationLink(order: OrderBase): string {
  const msg = `Hi ${order.customerName}! 👋

You placed a *Cash on Delivery* order at Mythical Vault.

🧾 *Order ID:* #${order.orderId}
💰 *Amount to Pay on Delivery:* ${fmt(order.totalAmount, order.currency)}

Please *confirm* or *cancel* your order by replying:
✅ Reply *CONFIRM* to confirm your order
❌ Reply *CANCEL* to cancel your order

Your order will be processed once confirmed. Thank you!`;
  return buildWaLink(order.phone, msg);
}

/**
 * 3. Payment Successful
 */
export function paymentSuccessLink(order: OrderBase): string {
  const msg = `Hi ${order.customerName}! 💳✅

Your payment of *${fmt(order.totalAmount, order.currency)}* has been received successfully!

🧾 *Order ID:* #${order.orderId}

We're now preparing your order for dispatch. You'll receive a shipping update soon. 🚀`;
  return buildWaLink(order.phone, msg);
}

/**
 * 4. Order Processing
 */
export function orderProcessingLink(order: OrderBase): string {
  const msg = `Hi ${order.customerName}! ⚙️

Great news — your order *#${order.orderId}* is now being processed and prepared for packaging!

We'll notify you as soon as it ships. Stay tuned! 📦`;
  return buildWaLink(order.phone, msg);
}

/**
 * 5. Order Shipped
 */
export function orderShippedLink(order: ShippedOrder): string {
  const courierLine = order.courierName
    ? `\n🚚 *Courier:* ${order.courierName}`
    : "";
  const trackLine = order.trackingUrl
    ? `\n🔗 *Track your order:* ${order.trackingUrl}`
    : "";

  const msg = `Hi ${order.customerName}! 🚀

Your order *#${order.orderId}* has been shipped!${courierLine}${trackLine}

Estimated delivery: 2–5 business days.
Questions? Just reply here. 😊`;
  return buildWaLink(order.phone, msg);
}

/**
 * 6. Out for Delivery
 */
export function outForDeliveryLink(order: OrderBase): string {
  const msg = `Hi ${order.customerName}! 🛵

Your order *#${order.orderId}* is *OUT FOR DELIVERY* today!

Please make sure someone is available to receive the package. Keep your phone handy for delivery agent calls.

💰 ${order.currency === "COD" ? `Amount to pay: *${fmt(order.totalAmount, order.currency)}*` : "No payment needed — already paid!"}`;
  return buildWaLink(order.phone, msg);
}

/**
 * 7. Delivered
 */
export function orderDeliveredLink(order: OrderBase): string {
  const msg = `Hi ${order.customerName}! 🎉

Your order *#${order.orderId}* has been *DELIVERED* successfully!

We hope you love your purchase. 😊

⭐ We'd love to hear from you! Feel free to share your experience or leave a review. Your feedback means the world to us.

Thank you for shopping with *Mythical Vault*! 🛍️`;
  return buildWaLink(order.phone, msg);
}

/**
 * 8. Order Cancelled
 */
export function orderCancelledLink(order: CancelledOrder): string {
  const reasonLine = order.reason ? `\n📝 *Reason:* ${order.reason}` : "";
  const msg = `Hi ${order.customerName},

We're sorry to inform you that your order *#${order.orderId}* has been *cancelled*.${reasonLine}

If you paid online, your refund will be processed within 5–7 business days.

We're sorry for any inconvenience. Feel free to shop again at *Mythical Vault*! 🛍️`;
  return buildWaLink(order.phone, msg);
}

/**
 * 9. Back-in-Stock Alert
 */
export function backInStockLink(alert: BackInStockAlert): string {
  const productLine = alert.productUrl
    ? `\n🔗 *View product:* ${alert.productUrl}`
    : "";
  const msg = `Hi ${alert.customerName}! 🎉

Great news — *${alert.productName}* is back in stock at *Mythical Vault*!${productLine}

Hurry, stock is limited! 🏃‍♂️`;
  return buildWaLink(alert.phone, msg);
}

// ── Convenience object (mirrors the API-based helpers naming) ──

export const whatsAppLinks = {
  orderPlaced: orderPlacedLink,
  codConfirmation: codConfirmationLink,
  paymentSuccess: paymentSuccessLink,
  orderProcessing: orderProcessingLink,
  orderShipped: orderShippedLink,
  outForDelivery: outForDeliveryLink,
  orderDelivered: orderDeliveredLink,
  orderCancelled: orderCancelledLink,
  backInStock: backInStockLink,
};

export default whatsAppLinks;
