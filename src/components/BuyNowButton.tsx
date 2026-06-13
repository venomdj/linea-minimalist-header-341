// src/components/BuyNowButton.tsx
// A drop-in "Buy Now" button that automatically enforces auth gating.
// Replace any raw <button>Buy Now</button> in ProductDetail with this component.
//
// Props:
//   onPurchase  — the actual purchase/checkout handler (only called when authed)
//   productId   — used to build the returnTo URL after login
//   disabled    — e.g. when out of stock
//   className   — optional extra classes

import { useAuthGate } from "@/hooks/useAuthGate";
import { ShoppingBag } from "lucide-react";

interface Props {
  onPurchase: () => void;
  productId: string | number;
  disabled?: boolean;
  className?: string;
  label?: string;
}

const BuyNowButton = ({
  onPurchase,
  productId,
  disabled = false,
  className = "",
  label = "Buy Now",
}: Props) => {
  const { guardedAction, AuthGate } = useAuthGate({
    returnTo: `/product/${productId}`,
    action: "purchase this card",
  });

  return (
    <>
      <button
        disabled={disabled}
        onClick={() => guardedAction(onPurchase)}
        className={`
          group relative flex items-center justify-center gap-2.5
          w-full h-12
          bg-foreground text-background
          text-[11px] font-mono uppercase tracking-[0.2em]
          hover:bg-foreground/90 active:bg-foreground/80
          disabled:opacity-40 disabled:pointer-events-none
          transition-colors duration-150
          overflow-hidden
          ${className}
        `}
      >
        {/* Shimmer sweep */}
        <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
        <ShoppingBag size={14} strokeWidth={1.5} />
        {label}
      </button>

      {/* Auth gate modal — renders as portal when guest clicks Buy Now */}
      <AuthGate />
    </>
  );
};

export default BuyNowButton;
