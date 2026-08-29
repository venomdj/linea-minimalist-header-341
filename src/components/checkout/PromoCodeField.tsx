import { useState } from "react";
import { Tag, X, Check, Loader2 } from "lucide-react";
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

  if (applied) {
    return (
      <div className="border-t border-border/70 pt-5">
        <div className="flex items-start gap-3 border border-verified/40 bg-verified/5 rounded-lg p-3">
          <Check size={14} className="text-verified mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-mono tracking-wider text-verified">
              {applied.code} APPLIED
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {applied.description ||
                (applied.discountType === "percentage"
                  ? `${applied.discountValue}% off your order`
                  : `${formatPrice(applied.discountValue)} off your order`)}
            </p>
            <p className="text-sm text-foreground mt-1.5 tabular-nums">
              You save {formatPrice(applied.discount)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setCode(""); onClear(); }}
            aria-label="Remove promo code"
            className="text-muted-foreground hover:text-destructive transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-border/70 pt-5">
      <label htmlFor="promo-code" className="eyebrow flex items-center gap-2 mb-2">
        <Tag size={12} /> Promo code
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
          className="h-11 font-mono tracking-wider uppercase"
        />
        <Button
          type="button"
          variant="outline"
          disabled={disabled || checking || !code.trim()}
          onClick={() => onApply(code)}
          className="h-11 px-5 rounded-lg text-[11px] font-mono tracking-wider shrink-0">
          {checking ? <Loader2 size={13} className="animate-spin" /> : "APPLY"}
        </Button>
      </div>
      {error && (
        <p className="text-[11px] font-mono tracking-wider text-destructive mt-2">{error}</p>
      )}
    </div>
  );
};

export default PromoCodeField;
