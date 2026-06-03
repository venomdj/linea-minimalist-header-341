// src/pages/AuthCallback.tsx
// Handles the OAuth callback from Google via Supabase.
// Supabase redirects here with ?code=... after the user authenticates.
// We exchange the code for a session, then redirect to the intended page.

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      // Supabase JS v2 automatically picks up the code from the URL and
      // exchanges it for a session when you call getSession() after a redirect.
      // The onAuthStateChange listener in AuthContext will fire as well.
      const { error } = await supabase.auth.exchangeCodeForSession(
        window.location.href
      );

      if (error) {
        console.error('[AuthCallback] Code exchange failed:', error.message);
        setErrorMsg(error.message);
        // After a short delay, send the user back to login with an error flag
        setTimeout(() => navigate('/login?error=auth_failed', { replace: true }), 3000);
        return;
      }

      // Decide where to land after login.
      // The `next` param is set by AccountLayout when it redirects to /login.
      const next = searchParams.get('next') || '/account';
      navigate(next, { replace: true });
    };

    handleCallback();
  }, [navigate, searchParams]);

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="border border-red-900/50 bg-zinc-950 p-8 max-w-sm w-full text-center space-y-4">
          <p className="text-xs font-mono tracking-widest text-red-400 uppercase">Authentication Error</p>
          <p className="text-sm text-zinc-400">{errorMsg}</p>
          <p className="text-xs text-zinc-600">Redirecting you back to login…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-5 h-5 border-2 border-zinc-700 border-t-zinc-300 rounded-full animate-spin" />
        <p className="text-xs font-mono tracking-widest text-zinc-500 uppercase">
          Completing sign-in…
        </p>
      </div>
    </div>
  );
}
