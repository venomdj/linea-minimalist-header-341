import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Seed state from existing session first (synchronous path)
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        checkRole(s.user.id);
      } else {
        setLoading(false);
      }
    });

    // 2. Keep state in sync on every auth event going forward
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      console.log("[useAuth] onAuthStateChange", _event, s?.user?.id ?? "no user");
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        // No setTimeout — call directly. The Supabase deadlock concern only
        // applies when calling supabase.auth.* inside the callback; querying
        // a regular table is safe to do here without deferring.
        checkRole(s.user.id);
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const checkRole = async (userId: string) => {
    console.log("[useAuth] checkRole querying user_roles for", userId);
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (error) {
        console.error("[useAuth] checkRole error:", error.message, error.code);
        // Surface the error so it's not swallowed silently
      }

      const admin = !!data;
      console.log("[useAuth] checkRole result — isAdmin:", admin, "| raw data:", data);
      setIsAdmin(admin);
    } catch (err) {
      console.error("[useAuth] checkRole unexpected error:", err);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  return { session, user, isAdmin, loading };
}
