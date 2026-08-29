import { useState } from "react";
import { Tag, X, Check, Loader2, Sparkles, PartyPopper } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { AppliedPromo } from "@/hooks/usePromoCode";

interface Props {
  applied: AppliedPromo | null;
  error: string | null;
  checking: boolean;
  onApply: (code: string) => void | Promise<unknown>;
  onClear: () => void;
  formatPrice: (n: number) => string;
  disabled?: boolean;
}

const PromoCodeField = ({
  applied, error, checking, onApply, onClear, formatPrice, disabled,
}: Props) => {
  const [code, setCode] = useState("");

  // ── Applied state: celebratory, glowing confirmation ──
  if (applied) {
    return (
      <div className="border-t border-border/70 pt-5">
        <div className="relative overflow-hidden rounded-xl border border-verified/50 bg-gradient-to-br from-verified/10 via-verified/5 to-transparent p-4 shadow-[0_8px_28px_-12px_hsl(var(--verified)/0.55)] animate-scale-in">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-verified/70 to-transparent" />
          <div className="flex items-start gap-3">
            <div className="relative shrink-0 mt-0.5">
              <span className="absolute inset-0 rounded-full bg-verified/25 blur-md" />
              <div className="relative w-8 h-8 rounded-full bg-verified/15 border border-verified/50 flex items-center justify-center">
                <PartyPopper size={14} className="text-verified" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-mono tracking-[0.12em] text-verified font-semibold">
                {applied.code} APPLIED
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {applied.description ||
                  (applied.discountType === "percentage"
                    ? `${applied.discountValue}% off your order`
                    : `${formatPrice(applied.discountValue)} off your order`)}
              </p>
              <p className="mt-1.5 font-display text-lg text-verified tabular-nums">
                You save {formatPrice(applied.discount)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setCode(""); onClear(); }}
              aria-label="Remove promo code"
              className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Unapplied state: an inviting, hard-to-miss callout ──
  return (
    <div className="border-t border-border/70 pt-5">
      <div className="relative overflow-hidden rounded-xl border border-dashed border-accent/50 bg-gradient-to-br from-accent/10 via-accent/[0.04] to-transparent p-4">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
        <label htmlFor="promo-code" className="flex items-center gap-2 mb-2.5">
          <span className="relative shrink-0">
            <span className="absolute inset-0 rounded-full bg-accent/25 blur-md animate-pulse" />
            <span className="relative w-7 h-7 rounded-full bg-accent/15 border border-accent/50 flex items-center justify-center">
              <Sparkles size={12} className="text-accent" />
            </span>
          </span>
          <span className="font-display text-sm text-foreground tracking-tight">
            Have a promo code?
          </span>
        </label>
        <div className="flex gap-2">
          <Input
            id="promo-code"
            value={code}
            disabled={disabled}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); onApply(code); }
            }}
            placeholder="ENTER CODE"
            className="h-11 font-mono tracking-[0.15em] uppercase bg-background/60 border-accent/30 focus-visible:border-accent placeholder:text-muted-foreground/50"
          />
          <Button
            type="button"
            disabled={disabled || checking || !code.trim()}
            onClick={() => onApply(code)}
            className="h-11 px-5 rounded-lg text-[11px] font-mono tracking-wider shrink-0 bg-accent text-accent-foreground hover:bg-accent/90 shadow-[0_6px_20px_-8px_hsl(var(--accent)/0.6)] disabled:opacity-50 disabled:shadow-none">
            {checking ? <Loader2 size={13} className="animate-spin" /> : "APPLY"}
          </Button>
        </div>
        {error && (
          <p className="text-[11px] font-mono tracking-wider text-destructive mt-2 flex items-center gap-1.5">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default PromoCodeField;
