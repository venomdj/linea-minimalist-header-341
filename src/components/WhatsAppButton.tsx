/**
 * WhatsAppButton.tsx
 * ─────────────────────────────────────────────────────────────
 * Drop in: src/components/WhatsAppButton.tsx
 *
 * A reusable button that opens a wa.me link in a new tab.
 * Accepts either a pre-built URL or an order object + event type.
 * Uses shadcn/ui Button + Tailwind — no extra dependencies needed.
 * ─────────────────────────────────────────────────────────────
 */

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MessageCircle, ChevronDown } from "lucide-react";
import {
  whatsAppLinks,
  OrderBase,
  ShippedOrder,
  CancelledOrder,
} from "@/utils/whatsappHelpers";

// ── WhatsApp SVG icon ─────────────────────────────────────────

const WhatsAppIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

// ── Simple single-event button ───────────────────────────────

interface WhatsAppButtonProps {
  /** Pre-built wa.me URL */
  url: string;
  /** Optional label override */
  label?: string;
  /** Button variant */
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  tooltip?: string;
}

export function WhatsAppButton({
  url,
  label,
  variant = "outline",
  size = "sm",
  className = "",
  tooltip,
}: WhatsAppButtonProps) {
  const handleClick = () => window.open(url, "_blank", "noopener,noreferrer");

  const btn = (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={`gap-1.5 text-[#25D366] border-[#25D366]/40 hover:bg-[#25D366]/10 hover:border-[#25D366] ${className}`}
    >
      <WhatsAppIcon />
      {label && <span>{label}</span>}
    </Button>
  );

  if (!tooltip) return btn;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{btn}</TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ── Multi-event dropdown (for order rows) ────────────────────

export interface OrderRowWhatsAppProps {
  /** Core order data — required for all events */
  order: OrderBase & {
    trackingUrl?: string;
    courierName?: string;
    cancelReason?: string;
    isCod?: boolean;
  };
  /** Which events to show in the dropdown — defaults to all */
  events?: OrderEvent[];
  className?: string;
}

export type OrderEvent =
  | "placed"
  | "cod"
  | "payment"
  | "processing"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

const EVENT_LABELS: Record<OrderEvent, string> = {
  placed: "Order Placed",
  cod: "COD Confirmation",
  payment: "Payment Success",
  processing: "Order Processing",
  shipped: "Order Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Order Cancelled",
};

const ALL_EVENTS: OrderEvent[] = [
  "placed",
  "cod",
  "payment",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

function buildUrl(
  event: OrderEvent,
  order: OrderRowWhatsAppProps["order"]
): string {
  switch (event) {
    case "placed":
      return whatsAppLinks.orderPlaced(order);
    case "cod":
      return whatsAppLinks.codConfirmation(order);
    case "payment":
      return whatsAppLinks.paymentSuccess(order);
    case "processing":
      return whatsAppLinks.orderProcessing(order);
    case "shipped":
      return whatsAppLinks.orderShipped({
        ...order,
        trackingUrl: order.trackingUrl ?? "#",
        courierName: order.courierName,
      } as ShippedOrder);
    case "out_for_delivery":
      return whatsAppLinks.outForDelivery(order);
    case "delivered":
      return whatsAppLinks.orderDelivered(order);
    case "cancelled":
      return whatsAppLinks.orderCancelled({
        ...order,
        reason: order.cancelReason,
      } as CancelledOrder);
  }
}

/**
 * OrderWhatsAppDropdown
 *
 * A compact "Send WhatsApp" dropdown button you can add next to
 * any order row in your admin table.
 *
 * @example
 * <OrderWhatsAppDropdown
 *   order={{
 *     orderId: "ORD-001",
 *     customerName: "Ravi Kumar",
 *     phone: "919876543210",
 *     totalAmount: 1499,
 *     trackingUrl: "https://track.delhivery.com/...",
 *   }}
 * />
 */
export function OrderWhatsAppDropdown({
  order,
  events = ALL_EVENTS,
  className = "",
}: OrderRowWhatsAppProps) {
  const sendMessage = (event: OrderEvent) => {
    const url = buildUrl(event, order);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`gap-1 text-[#25D366] border-[#25D366]/40 hover:bg-[#25D366]/10 hover:border-[#25D366] ${className}`}
        >
          <WhatsAppIcon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline text-xs">WhatsApp</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
          <WhatsAppIcon className="h-3.5 w-3.5 text-[#25D366]" />
          Send notification to {order.customerName.split(" ")[0]}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {events.map((event) => (
          <DropdownMenuItem
            key={event}
            onClick={() => sendMessage(event)}
            className="text-sm cursor-pointer"
          >
            {EVENT_LABELS[event]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default OrderWhatsAppDropdown;
