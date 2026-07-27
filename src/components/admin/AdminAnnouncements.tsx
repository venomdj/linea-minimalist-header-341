import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAllAnnouncements, type Announcement } from "@/hooks/useAnnouncement";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Megaphone, Plus, Pencil, Trash2 } from "lucide-react";

type FormState = {
  title: string;
  message: string;
  type: Announcement["type"];
  cta_label: string;
  cta_link: string;
  starts_at: string;
  ends_at: string;
  priority: number;
  display_mode: Announcement["display_mode"];
  enabled: boolean;
};

const empty: FormState = {
  title: "",
  message: "",
  type: "info",
  cta_label: "",
  cta_link: "",
  starts_at: "",
  ends_at: "",
  priority: 0,
  display_mode: "both",
  enabled: true,
};

const toLocalInput = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 16) : "");

const AdminAnnouncements = () => {
  const { rows, loading, reload } = useAllAnnouncements();
  const [form, setForm] = useState<FormState | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const startCreate = () => {
    setEditingId(null);
    setForm({ ...empty });
  };

  const startEdit = (a: Announcement) => {
    setEditingId(a.id);
    setForm({
      title: a.title,
      message: a.message,
      type: a.type,
      cta_label: a.cta_label ?? "",
      cta_link: a.cta_link ?? "",
      starts_at: toLocalInput(a.starts_at),
      ends_at: toLocalInput(a.ends_at),
      priority: a.priority,
      display_mode: a.display_mode,
      enabled: a.enabled,
    });
  };

  const save = async () => {
    if (!form) return;
    if (!form.title.trim() || !form.message.trim()) {
      toast.error("Title and message are required");
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      message: form.message.trim(),
      type: form.type,
      cta_label: form.cta_label.trim() || null,
      cta_link: form.cta_link.trim() || null,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      priority: Number(form.priority) || 0,
      display_mode: form.display_mode,
      enabled: form.enabled,
    };
    const { error } = editingId
      ? await supabase.from("announcements").update(payload).eq("id", editingId)
      : await supabase.from("announcements").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editingId ? "Announcement updated" : "Announcement published");
    setForm(null);
    setEditingId(null);
    reload();
  };

  const toggle = async (a: Announcement) => {
    const { error } = await supabase.from("announcements").update({ enabled: !a.enabled }).eq("id", a.id);
    if (error) return toast.error(error.message);
    toast.success(a.enabled ? "Announcement disabled" : "Announcement live");
    reload();
  };

  const remove = async (a: Announcement) => {
    const { error } = await supabase.from("announcements").delete().eq("id", a.id);
    if (error) return toast.error(error.message);
    toast.success("Announcement deleted");
    reload();
  };

  if (form) {
    return (
      <section className="border border-border bg-surface-1 p-5 sm:p-6 space-y-5">
        <h2 className="font-display text-xl">{editingId ? "Edit announcement" : "New announcement"}</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Rain delay — Round 2 postponed" />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Message</Label>
            <Textarea rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Details visitors should know…" />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as Announcement["type"] })}
              className="w-full h-10 bg-background border border-input px-3 text-sm text-foreground"
            >
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Display mode</Label>
            <select
              value={form.display_mode}
              onChange={(e) => setForm({ ...form, display_mode: e.target.value as Announcement["display_mode"] })}
              className="w-full h-10 bg-background border border-input px-3 text-sm text-foreground"
            >
              <option value="both">Modal + Banner</option>
              <option value="modal">Fullscreen modal only</option>
              <option value="banner">Top banner only</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>CTA button label (optional)</Label>
            <Input value={form.cta_label} onChange={(e) => setForm({ ...form, cta_label: e.target.value })} placeholder="View schedule" />
          </div>
          <div className="space-y-1.5">
            <Label>CTA link (optional)</Label>
            <Input value={form.cta_link} onChange={(e) => setForm({ ...form, cta_link: e.target.value })} placeholder="/track-order or https://…" />
          </div>
          <div className="space-y-1.5">
            <Label>Starts at (optional)</Label>
            <Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Ends at (optional)</Label>
            <Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Priority (higher shows first)</Label>
            <Input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} />
          </div>
          <div className="flex items-center gap-3 pt-6">
            <Switch checked={form.enabled} onCheckedChange={(v) => setForm({ ...form, enabled: v })} />
            <Label className="cursor-default">Enabled (live for all visitors)</Label>
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={save} disabled={saving} className="rounded-none">
            {saving ? "Saving…" : editingId ? "Save changes" : "Publish"}
          </Button>
          <Button variant="outline" className="rounded-none" onClick={() => { setForm(null); setEditingId(null); }}>
            Cancel
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl">Announcements</h2>
          <p className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
            Site-wide notices — instant for every visitor
          </p>
        </div>
        <Button onClick={startCreate} className="rounded-none">
          <Plus size={14} /> New
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : rows.length === 0 ? (
        <div className="border border-dashed border-border p-12 text-center text-muted-foreground">
          <Megaphone className="mx-auto mb-3" />
          <p>No announcements yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((a) => (
            <div key={a.id} className="border border-border bg-surface-1 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-accent">{a.type}</span>
                  <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
                    {a.display_mode} · P{a.priority}
                  </span>
                  <span className={`text-[10px] font-mono tracking-widest uppercase ${a.enabled ? "text-verified" : "text-muted-foreground"}`}>
                    {a.enabled ? "Live" : "Off"}
                  </span>
                </div>
                <p className="font-medium truncate">{a.title}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">{a.message}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Switch checked={a.enabled} onCheckedChange={() => toggle(a)} aria-label="Toggle announcement" />
                <Button size="sm" variant="outline" className="rounded-none" onClick={() => startEdit(a)}>
                  <Pencil size={12} /> Edit
                </Button>
                <Button size="sm" variant="outline" className="rounded-none text-destructive hover:text-destructive" onClick={() => remove(a)}>
                  <Trash2 size={12} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default AdminAnnouncements;
