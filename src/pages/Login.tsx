// src/pages/Login.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/account';
  const authError = searchParams.get('error');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Show friendly error if we were sent back from callback with an error
  useEffect(() => {
    if (authError === 'auth_failed') {
      setErrorMessage(
        'Google sign-in failed. Please try again or contact support if the problem persists.'
      );
    }
  }, [authError]);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate(redirect, { replace: true });
    }
  }, [user, loading, navigate, redirect]);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      // Always redirect to production domain so users land on mythicalvault.vercel.app
      // regardless of whether they clicked login from the Lovable preview URL.
      const PRODUCTION_URL = 'https://mythicalvault.vercel.app';
      const callbackUrl = `${PRODUCTION_URL}/auth/callback?next=${encodeURIComponent(redirect)}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            // Request offline access so Supabase can refresh tokens
            access_type: 'offline',
            // Use 'select_account' so users can choose a Google account
            prompt: 'select_account',
          },
        },
      });

      if (error) throw error;
      // Browser will navigate away to Google — no need to setIsLoading(false)
    } catch (err: unknown) {
      console.error('[Login] Google OAuth error:', err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Unable to start Google sign-in. Please try again.'
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-20 bg-zinc-950/20">
        <div className="w-full max-w-md border border-zinc-900 bg-black p-8 text-center space-y-8">
          <div className="space-y-2">
            <h1 className="text-xl font-light tracking-[0.2em] text-white uppercase">
              Access The Vault
            </h1>
            <p className="text-xs text-zinc-500 font-mono tracking-wider">
              AUTHENTICATE TO VIEW YOUR ORDERS AND ACCOUNT
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="border border-red-900/60 bg-red-950/20 px-4 py-3 text-left">
              <p className="text-xs text-red-400 font-mono leading-relaxed">{errorMessage}</p>
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="flex items-center justify-center gap-3 w-full bg-white text-black font-medium py-3 px-4 rounded-none hover:bg-zinc-200 transition duration-200 tracking-widest text-[11px] uppercase disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-zinc-400 border-t-zinc-800 rounded-full animate-spin flex-shrink-0" />
                Connecting…
              </>
            ) : (
              <>
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0112 4.909c1.69 0 3.218.6 4.418 1.582l3.51-3.51C17.642 1.052 14.914 0 12 0 7.354 0 3.307 2.657 1.277 6.538l3.99 3.227z" />
                  <path fill="#4285F4" d="M23.75 12.273c0-.818-.074-1.609-.21-2.373H12v4.509h6.586a5.64 5.64 0 01-2.441 3.7l3.864 3.003c2.26-2.083 3.741-5.145 3.741-8.839z" />
                  <path fill="#FBBC05" d="M5.266 14.235l-3.99 3.227A11.96 11.96 0 0012 24c2.914 0 5.642-1.052 7.654-2.831l-3.864-3.003a7.11 7.11 0 01-3.79 1.016 7.077 7.077 0 01-6.734-4.947z" />
                  <path fill="#34A853" d="M5.266 9.765a7.03 7.03 0 010 4.47l-3.99 3.227a11.936 11.936 0 010-10.924l3.99 3.227z" />
                </svg>
                Sign in with Google
              </>
            )}
          </button>

          <p className="text-[10px] text-zinc-600 max-w-xs mx-auto font-sans leading-relaxed">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
