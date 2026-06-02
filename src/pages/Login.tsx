import React from 'react';
import { supabase } from '../integrations/supabase/client';
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";

export default function Login() {
  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Redirects your users safely back to your home page after logging in
          redirectTo: window.location.origin, 
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error("Authentication failed:", error);
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
              AUTHENTICATE TO VIEW AND MANAGE YOUR LISTINGS
            </p>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="flex items-center justify-center gap-3 w-full bg-white text-black font-medium py-3 px-4 rounded-none hover:bg-zinc-200 transition duration-200 tracking-widest text-[11px] uppercase"
          >
            {/* Google Vector Icon Asset */}
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0112 4.909c1.69 0 3.218.6 4.418 1.582l3.51-3.51C17.642 1.052 14.914 0 12 0 7.354 0 3.307 2.657 1.277 6.538l3.99 3.227z" />
              <path fill="#4285F4" d="M23.75 12.273c0-.818-.074-1.609-.21-2.373H12v4.509h6.586a5.64 5.64 0 01-2.441 3.7l3.864 3.003c2.26-2.083 3.741-5.145 3.741-8.839z" />
              <path fill="#FBBC05" d="M5.266 14.235l-3.99 3.227A11.96 11.96 0 0012 24c2.914 0 5.642-1.052 7.654-2.831l-3.864-3.003a7.11 7.11 0 01-3.79 1.016 7.077 7.077 0 01-6.734-4.947z" />
              <path fill="#34A853" d="M5.266 9.765a7.03 7.03 0 010 4.47l-3.99 3.227a11.936 11.936 0 010-10.924l3.99 3.227z" />
            </svg>
            Sign in with Google
          </button>
          
          <p className="text-[10px] text-zinc-600 max-w-xs mx-auto font-sans leading-relaxed">
            By signing in, you agree to secure provenance authentication parameters.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
