// src/pages/Login.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import { useAuth } from "@/context/AuthContext";
import { ShieldCheck } from "lucide-react";

export default function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Support both ?redirect= (legacy) and ?returnTo= (new auth-gate param)
  const returnTo =
    searchParams.get('returnTo') ||
    searchParams.get('redirect') ||
    '/account';

  const authError = searchParams.get('error');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (authError === 'auth_failed') {
      setErrorMessage(
        'Google sign-in failed. Please try again or contact support if the problem persists.'
      );
    }
  }, [authError]);

  // Redirect if already logged in — honour returnTo
  useEffect(() => {
    if (!loading && user) {
      // Safety: only allow relative paths (prevent open redirect)
      const safe = returnTo.startsWith('/') ? returnTo : '/account';
      navigate(safe, { replace: true });
    }
  }, [user, loading, navigate, returnTo]);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const PRODUCTION_URL = 'https://mythicalvault.vercel.app';
      // Pass returnTo through so AuthCallback can redirect back to product page
      const callbackUrl = `${PRODUCTION_URL}/auth/callback?next=${encodeURIComponent(returnTo)}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) throw error;
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

  // Derive a human-readable action hint from returnTo
  const isProductReturn = returnTo.startsWith('/product/');
  const isCheckoutReturn = returnTo.startsWith('/checkout');

  const contextHint = isCheckoutReturn
    ? 'Sign in to complete your purchase'
    : isProductReturn
    ? 'Sign in to buy this card'
    : 'Authenticate to view your orders and account';

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-20 bg-zinc-950/20">
        <div className="w-full max-w-md border border-zinc-900 bg-black p-8 text-center space-y-8">

          {/* Icon — only shown when coming from a purchase flow */}
          {(isProductReturn || isCheckoutReturn) && (
            <div className="flex justify-center">
              <div className="w-11 h-11 rounded-full border border-zinc-800 flex items-center justify-center bg-zinc-950">
                <ShieldCheck size={20} strokeWidth={1.5} className="text-zinc-400" />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h1 className="text-xl font-light tracking-[0.2em] text-white uppercase">
              Access The Vault
            </h1>
            <p className="text-xs text-zinc-500 font-mono tracking-wider uppercase">
              {contextHint}
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
