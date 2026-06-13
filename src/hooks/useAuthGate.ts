// src/hooks/useAuthGate.ts
// Drop-in hook to gate any purchase/checkout action behind authentication.
//
// Usage:
//   const { guardedAction, AuthGate } = useAuthGate({ returnTo: `/product/${id}`, action: "buy this card" });
//
//   <button onClick={() => guardedAction(() => proceedToCheckout())}>Buy Now</button>
//   <AuthGate />   ← render this anywhere in the same component tree

import { useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import AuthGateModal from "@/components/AuthGateModal";

interface Options {
  /** URL to return to after login — usually the current product page */
  returnTo?: string;
  /** Human-readable action description shown inside the modal */
  action?: string;
}

export function useAuthGate({ returnTo, action }: Options = {}) {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  /**
   * Call this instead of your normal purchase handler.
   * If the user is logged in, it runs `fn()` immediately.
   * If not, it opens the auth gate modal.
   */
  const guardedAction = useCallback(
    (fn: () => void) => {
      if (user) {
        fn();
      } else {
        setModalOpen(true);
      }
    },
    [user]
  );

  /** Render this component somewhere in your JSX tree — it's a portal-style modal */
  const AuthGate = () => (
    <AuthGateModal
      isOpen={modalOpen}
      onClose={() => setModalOpen(false)}
      returnTo={returnTo ?? window.location.pathname}
      action={action}
    />
  );

  return { guardedAction, AuthGate, isGateOpen: modalOpen };
}
