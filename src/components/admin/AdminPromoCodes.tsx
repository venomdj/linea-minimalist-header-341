import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Ticket } from "lucide-react";

interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  min_order_value: number;
  max_discount: number | null;
  usage_limit: number | null;
  per_user_limit: number | null;
  starts_at: string | null;
  expires_at: string | null;
  enabled: boolean;
  used_count: number;
}

const emptyForm = {
  code: "", description: "", discount_type: "percentage",
  discount_value: "", min_order_value: "0", max_discount: "",
  usage_limit: "", per_user_limit: "", starts_at: "", expires_at: "",
  enabled: true,
};

type FormState = typeof emptyForm;

const toLocalInput = (iso: string | null) =>
  iso ? new Date(iso).toISOString().slice(0, 16) : "";

const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const AdminPromoCodes = () => {
  const [rows, setRows] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<PromoCode | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("promo_codes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data ?? []) as PromoCode[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const openNew = () => { setForm(emptyForm); setEditingId(null); setShowForm(true); };

  const openEdit = (r: PromoCode) => {
    setForm({
      code: r.code,
      description: r.description ?? "",
      discount_type: r.discount_type,
      discount_value: String(r.discount_value),
      min_order_value: String(r.min_order_value ?? 0),
      max_discount: r.max_discount != null ? String(r.max_discount) : "",
      usage_limit: r.usage_limit != null ? String(r.usage_limit) : "",
      per_user_limit: r.per_user_limit != null ? String(r.per_user_limit) : "",
      starts_at: toLocalInput(r.starts_at),
      expires_at: toLocalInput(r.expires_at),
      enabled: r.enabled,
    });
    setEditingId(r.id);
    setShowForm(true);
  };

  const save = async () => {
    const code = form.code.trim().toUpperCase();
    const value = Number(form.discount_value);
    if (!code) return toast.error("Code is required");
    if (!Number.isFinite(value) || value <= 0) return toast.error("Discount value must be greater than 0");
    if (form.discount_type === "percentage" && value > 100) return toast.error("Percentage cannot exceed 100");

    const payload = {
      code,
      description: form.description.trim() || null,
      discount_type: form.discount_type,
      discount_value: value,
      min_order_value: Number(form.min_order_value) || 0,
      max_discount: form.max_discount ? Number(form.max_discount) : null,
      usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      per_user_limit: form.per_user_limit ? Number(form.per_user_limit) : null,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      enabled: form.enabled,
    };

    setSaving(true);
    const { error } = editingId
      ? await supabase.from("promo_codes").update(payload).eq("id", editingId)
      : await supabase.from("promo_codes").insert(payload);
    setSaving(false);

    if (error) {
      toast.error(error.message.includes("promo_codes_code_key") ? "That code already exists" : error.message);
      return;
    }
    toast.success(editingId ? "Promo code updated" : "Promo code created");
    setShowForm(false);
    setEditingId(null);
    load();
  };

  const toggleEnabled = async (r: PromoCode) => {
    const { error } = await supabase.from("promo_codes").update({ enabled: !r.enabled }).eq("id", r.id);
    if (error) return toast.error(error.message);
    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, enabled: !x.enabled } : x)));
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const { error } = await supabase.from("promo_codes").delete().eq("id", toDelete.id);
    if (error) return toast.error(error.message);
    toast.success("Promo code deleted");
    setToDelete(null);
    load();
  };

  if (showForm) {
    return (
      <section className="border border-border bg-surface-1 p-6">
        <h2 className="font-display text-xl mb-6">{editingId ? "Edit promo code" : "New promo code"}</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Code</Label>
            <Input value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="WELCOME10" />
          </div>
          <div className="space-y-2">
            <Label>Discount type</Label>
            <div className="flex gap-2">
              {(["percentage", "fixed"] as const).map((t) => (
                <button key={t} type="button" onClick={() => set("discount_type", t)}
                  className={`flex-1 h-10 border text-xs font-mono tracking-wider uppercase transition-colors ${
                    form.discount_type === t ? "border-primary text-foreground" : "border-border text-muted-foreground"
                  }`}>
                  {t === "percentage" ? "Percentage %" : "Fixed ₹"}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Discount value</Label>
            <Input type="number" min="0" value={form.discount_value} onChange={(e) => set("discount_value", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Minimum order value (₹)</Label>
            <Input type="number" min="0" value={form.min_order_value} onChange={(e) => set("min_order_value", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Maximum discount (₹, optional)</Label>
            <Input type="number" min="0" value={form.max_discount} onChange={(e) => set("max_discount", e.target.value)} placeholder="No cap" />
          </div>
          <div className="space-y-2">
            <Label>Total usage limit (optional)</Label>
            <Input type="number" min="1" value={form.usage_limit} onChange={(e) => set("usage_limit", e.target.value)} placeholder="Unlimited" />
          </div>
          <div className="space-y-2">
            <Label>Per-user usage limit (optional)</Label>
            <Input type="number" min="1" value={form.per_user_limit} onChange={(e) => set("per_user_limit", e.target.value)} placeholder="Unlimited" />
          </div>
          <div className="space-y-2">
            <Label>Starts at (optional)</Label>
            <Input type="datetime-local" value={form.starts_at} onChange={(e) => set("starts_at", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Expires at (optional)</Label>
            <Input type="datetime-local" value={form.expires_at} onChange={(e) => set("expires_at", e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Description (shown to customers)</Label>
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} />
          </div>
          <div className="flex items-center gap-3 md:col-span-2">
            <Switch checked={form.enabled} onCheckedChange={(v) => set("enabled", v)} />
            <span className="text-sm text-muted-foreground">Enabled</span>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button onClick={save} disabled={saving} className="rounded-none">{saving ? "Saving…" : "Save"}</Button>
          <Button variant="outline" className="rounded-none" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</Button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl">Promo codes</h2>
        <Button onClick={openNew} className="rounded-none"><Plus size={14} /> New code</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : rows.length === 0 ? (
        <div className="border border-dashed border-border p-12 text-center text-muted-foreground">
          <Ticket className="mx-auto mb-3" />
          <p>No promo codes yet. Create one to start offering discounts.</p>
        </div>
      ) : (
        <div className="border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-left">
              <tr>
                {["Code", "Discount", "Min order", "Used", "Expires", "Active", "Actions"].map((h) => (
                  <th key={h} className="p-3 font-mono text-[11px] tracking-wider uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-3 font-mono">{r.code}</td>
                  <td className="p-3">
                    {r.discount_type === "percentage" ? `${r.discount_value}%` : inr(Number(r.discount_value))}
                    {r.max_discount ? <span className="text-muted-foreground"> (max {inr(Number(r.max_discount))})</span> : null}
                  </td>
                  <td className="p-3 tabular-nums">{inr(Number(r.min_order_value))}</td>
                  <td className="p-3 tabular-nums">{r.used_count}{r.usage_limit ? ` / ${r.usage_limit}` : ""}</td>
                  <td className="p-3 text-muted-foreground">{r.expires_at ? new Date(r.expires_at).toLocaleDateString("en-IN") : "—"}</td>
                  <td className="p-3"><Switch checked={r.enabled} onCheckedChange={() => toggleEnabled(r)} /></td>
                  <td className="p-3 text-right space-x-2 whitespace-nowrap">
                    <Button size="sm" variant="outline" className="rounded-none" onClick={() => openEdit(r)}><Pencil size={12} /> Edit</Button>
                    <Button size="sm" variant="outline" className="rounded-none text-destructive hover:text-destructive" onClick={() => setToDelete(r)}><Trash2 size={12} /> Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete promo code?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="text-foreground font-medium">{toDelete?.code}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

export default AdminPromoCodes;
