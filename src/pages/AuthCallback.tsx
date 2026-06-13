// src/pages/AuthCallback.tsx
// Handles the OAuth redirect from Google → Supabase → back to the app.
// Reads ?next= (set by Login.tsx) and redirects the user to their intended page.

import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // The ?next= param is what Login.tsx encodes as the returnTo destination
    const next = searchParams.get("next");
    // Safety: only allow relative paths
    const destination =
      next && next.startsWith("/") ? next : "/account";

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("[AuthCallback] session error:", error);
        navigate("/login?error=auth_failed", { replace: true });
        return;
      }
      if (session) {
        navigate(destination, { replace: true });
      } else {
        navigate("/login?error=auth_failed", { replace: true });
      }
    });
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground animate-pulse">
        Authenticating…
      </span>
    </div>
  );
}
