// src/hooks/useAuthGate.tsx   ← must be .tsx (contains JSX)
import { useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import AuthGateModal from "@/components/AuthGateModal";

interface Options {
  returnTo?: string;
  action?: string;
}

export function useAuthGate({ returnTo, action }: Options = {}) {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

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

  const resolvedReturnTo =
    returnTo ?? (typeof window !== "undefined" ? window.location.pathname : "/");

  const AuthGate = () => (
    <AuthGateModal
      isOpen={modalOpen}
      onClose={() => setModalOpen(false)}
      returnTo={resolvedReturnTo}
      action={action}
    />
  );

  return { guardedAction, AuthGate, isGateOpen: modalOpen };
}
