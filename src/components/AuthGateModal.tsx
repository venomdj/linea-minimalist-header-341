// src/components/AuthGateModal.tsx
// Shown when a guest user tries to access a purchase/checkout action.
// After login, the user is redirected back to their intended destination.

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, LogIn, ShieldCheck } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** The path to return to after successful login, e.g. "/product/42" */
  returnTo?: string;
  /** Optional context label shown in the modal, e.g. "purchase this card" */
  action?: string;
}

const AuthGateModal = ({ isOpen, onClose, returnTo = "/", action = "complete this purchase" }: Props) => {
  const navigate = useNavigate();

  // Lock body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!isOpen) return null;

  const encodedReturn = encodeURIComponent(returnTo);

  const goLogin = () => {
    onClose();
    navigate(`/login?returnTo=${encodedReturn}`);
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-gate-title"
    >
      {/* Dim overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-sm bg-zinc-950 border border-zinc-800 shadow-2xl animate-fade-in">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-zinc-500 hover:text-zinc-200 transition-colors"
          aria-label="Close"
        >
          <X size={16} strokeWidth={1.5} />
        </button>

        {/* Top accent line */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-600 to-transparent" />

        <div className="px-8 py-10">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 rounded-full border border-zinc-700 flex items-center justify-center bg-zinc-900">
              <ShieldCheck size={22} strokeWidth={1.5} className="text-zinc-300" />
            </div>
          </div>

          {/* Copy */}
          <h2
            id="auth-gate-title"
            className="font-display text-xl tracking-tight text-foreground text-center mb-2"
          >
            Sign in to continue
          </h2>
          <p className="text-sm text-zinc-400 text-center leading-relaxed mb-8">
            You need an account to {action}. Every transaction is graded,
            verified, and insured — your account keeps it all in one place.
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={goLogin}
              className="
                group w-full flex items-center justify-center gap-2.5
                h-11 bg-white text-zinc-950
                text-[11px] font-mono uppercase tracking-[0.18em]
                hover:bg-zinc-100 active:bg-zinc-200
                transition-colors duration-150
              "
            >
              <LogIn size={13} strokeWidth={2} />
              Sign In
            </button>


          </div>

          {/* Trust strip */}
          <p className="mt-6 text-center text-[10px] font-mono tracking-wider text-zinc-600 uppercase">
            PSA &amp; BGS Partner · Every card authenticated
          </p>
        </div>

        {/* Bottom accent line */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
      </div>
    </div>
  );
};

export default AuthGateModal;
