import { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthState {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  isAdmin: false,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkRole = async (userId: string) => {
    console.log("[AuthContext] checkRole →", userId);
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      if (error) console.error("[AuthContext] checkRole error:", error.message, error.code);
      const admin = !!data;
      console.log("[AuthContext] isAdmin:", admin);
      setIsAdmin(admin);
    } catch (err) {
      console.error("[AuthContext] checkRole threw:", err);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Seed initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) checkRole(s.user.id);
      else setLoading(false);
    });

    // Keep in sync with all future auth events
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      console.log("[AuthContext] onAuthStateChange", _event, s?.user?.id ?? "signed out");
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        checkRole(s.user.id);
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
