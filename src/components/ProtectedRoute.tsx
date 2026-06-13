// src/components/ProtectedRoute.tsx
// Wrap any Route element that must require authentication.
//
// Usage in your router (e.g. App.tsx):
//   <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
//   <Route path="/account"  element={<ProtectedRoute><Account /></ProtectedRoute>} />
//
// If the user isn't logged in, they're sent to /login with a returnTo param.
// The AuthProvider's loading state is respected — no flash of redirect.

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface Props {
  children: React.ReactNode;
  /** Optional: override redirect target (default: /login) */
  redirectTo?: string;
}

const ProtectedRoute = ({ children, redirectTo = "/login" }: Props) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // While Supabase is resolving the session, render nothing (avoids flash)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground animate-pulse">
          Authenticating…
        </span>
      </div>
    );
  }

  if (!user) {
    // Preserve the intended destination so login can redirect back
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`${redirectTo}?returnTo=${returnTo}`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
