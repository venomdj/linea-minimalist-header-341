import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(72),
});

const AdminLogin = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user && isAdmin) navigate("/admin", { replace: true });
  }, [loading, user, isAdmin, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
        toast.success("Account created. An existing admin must promote you to the admin role.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        toast.success("Signed in");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Auth failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md border border-border bg-surface-1 p-8 space-y-6">
        <div className="space-y-2 text-center">
          <ShieldCheck className="mx-auto text-foreground" size={32} strokeWidth={1.5} />
          <h1 className="font-display text-2xl tracking-tight text-foreground">ADMIN ACCESS</h1>
          <p className="text-xs font-mono tracking-wider text-muted-foreground uppercase">
            Mythical Vault Control
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs tracking-wider uppercase">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs tracking-wider uppercase">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete={mode === "signup" ? "new-password" : "current-password"} />
          </div>
          <Button type="submit" disabled={busy} className="w-full rounded-none h-11 tracking-wider">
            {busy && <Loader2 className="animate-spin" size={14} />}
            {mode === "signin" ? "SIGN IN" : "CREATE ACCOUNT"}
          </Button>
        </form>

        <div className="text-center text-xs text-muted-foreground">
          {mode === "signin" ? (
            <button onClick={() => setMode("signup")} className="hover:text-foreground underline-offset-4 hover:underline">
              Need an account? Create one
            </button>
          ) : (
            <button onClick={() => setMode("signin")} className="hover:text-foreground underline-offset-4 hover:underline">
              Already have an account? Sign in
            </button>
          )}
        </div>

        {user && !isAdmin && (
          <div className="text-[11px] font-mono text-amber-400/90 border border-amber-500/30 bg-amber-500/5 p-3">
            Signed in as <span className="text-foreground">{user.email}</span> but this account is not an admin.
            Promote it from the backend dashboard (user_roles table → add row with role: admin).
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLogin;
