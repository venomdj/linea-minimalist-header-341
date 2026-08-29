import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AppliedPromo {
  code: string;
  discount: number;
  description: string | null;
  discountType: "percentage" | "fixed";
  discountValue: number;
}

interface ValidationResult {
  valid: boolean;
  reason?: string;
  message?: string;
  code?: string;
  description?: string | null;
  discount?: number;
  discount_type?: "percentage" | "fixed";
  discount_value?: number;
}

/**
 * Handles promo-code validation against the backend.
 * Re-validates automatically whenever the subtotal changes so the discount
 * always reflects the live cart (and drops the code if it becomes invalid).
 */
export function usePromoCode(subtotal: number, email?: string) {
  const [applied, setApplied] = useState<AppliedPromo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const appliedRef = useRef<AppliedPromo | null>(null);

  useEffect(() => {
    appliedRef.current = applied;
  }, [applied]);

  const validate = useCallback(
    async (rawCode: string, opts?: { silent?: boolean }): Promise<boolean> => {
      const code = rawCode.trim().toUpperCase();
      if (!code) {
        setError("Enter a promo code.");
        return false;
      }
      if (!opts?.silent) setChecking(true);
      try {
        const { data, error: rpcError } = await supabase.rpc("validate_promo_code", {
          p_code: code,
          p_subtotal: subtotal,
          p_email: email || null,
        });
        if (rpcError) throw rpcError;
        const res = (data ?? {}) as unknown as ValidationResult;

        if (!res.valid) {
          setApplied(null);
          setError(res.message ?? "This promo code cannot be applied.");
          return false;
        }

        setApplied({
          code: res.code ?? code,
          discount: Number(res.discount ?? 0),
          description: res.description ?? null,
          discountType: res.discount_type ?? "percentage",
          discountValue: Number(res.discount_value ?? 0),
        });
        setError(null);
        return true;
      } catch {
        setApplied(null);
        setError("Could not verify this code. Please try again.");
        return false;
      } finally {
        if (!opts?.silent) setChecking(false);
      }
    },
    [subtotal, email],
  );

  const clear = useCallback(() => {
    setApplied(null);
    setError(null);
  }, []);

  // Re-check the applied code when the cart total changes
  useEffect(() => {
    const current = appliedRef.current;
    if (!current) return;
    void validate(current.code, { silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  // Live updates: if an admin edits/disables a code, re-check immediately
  useEffect(() => {
    const channel = supabase
      .channel("promo-codes-watcher")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "promo_codes" },
        () => {
          const current = appliedRef.current;
          if (current) void validate(current.code, { silent: true });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [validate]);

  return { applied, error, checking, validate, clear };
}
