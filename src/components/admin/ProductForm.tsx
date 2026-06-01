import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import type { DbProduct } from "@/hooks/useProducts";

const schema = z.object({
  title: z.string().trim().min(1, "Title required").max(160),
  price: z.coerce.number().min(0, "Price must be ≥ 0"),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  category: z.string().trim().max(80).optional().or(z.literal("")),
  stock: z.coerce.number().int().min(0),
  featured: z.boolean(),
  series: z.string().trim().max(120).optional().or(z.literal("")),
  set_name: z.string().trim().max(120).optional().or(z.literal("")),
  edition: z.string().trim().max(60).optional().or(z.literal("")),
  grade: z.string().trim().max(40).optional().or(z.literal("")),
  rarity: z.enum(["Common", "Rare", "Epic", "Legendary", "Grail"]).optional(),
});

type Props = {
  initial?: DbProduct | null;
  onDone: () => void;
  onCancel: () => void;
};

const ProductForm = ({ initial, onDone, onCancel }: Props) => {
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    price: String(initial?.price ?? ""),
    description: initial?.description ?? "",
    category: initial?.category ?? "",
    stock: String(initial?.stock ?? 0),
    featured: !!initial?.featured,
    series: initial?.series ?? "",
    set_name: initial?.set_name ?? "",
    edition: initial?.edition ?? "",
    grade: initial?.grade ?? "",
    rarity: (initial?.rarity as any) ?? "Rare",
  });
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const onFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      setImageUrl(data.publicUrl);
      toast.success("Image uploaded");
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: parsed.data.title,
        price: parsed.data.price,
        description: parsed.data.description || null,
        image_url: imageUrl || null,
        category: parsed.data.category || null,
        stock: parsed.data.stock,
        featured: parsed.data.featured,
        series: parsed.data.series || null,
        set_name: parsed.data.set_name || null,
        edition: parsed.data.edition || null,
        grade: parsed.data.grade || null,
        rarity: parsed.data.rarity || null,
      };
      if (initial) {
        const { error } = await supabase.from("products").update(payload).eq("id", initial.id);
        if (error) throw error;
        toast.success("Product updated");
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
        toast.success("Product created");
      }
      onDone();
    } catch (err: any) {
      toast.error(err.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 md:col-span-2">
          <Label>Title *</Label>
          <Input value={form.title} onChange={(e) => set("title", e.target.value)} required maxLength={160} />
        </div>
        <div className="space-y-2">
          <Label>Price (INR) *</Label>
          <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => set("price", e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Stock *</Label>
          <Input type="number" min="0" step="1" value={form.stock} onChange={(e) => set("stock", e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Input value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="e.g. Trading Cards" />
        </div>
        <div className="space-y-2">
          <Label>Rarity</Label>
          <select
            value={form.rarity}
            onChange={(e) => set("rarity", e.target.value as any)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {["Common", "Rare", "Epic", "Legendary", "Grail"].map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Series</Label>
          <Input value={form.series} onChange={(e) => set("series", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Set</Label>
          <Input value={form.set_name} onChange={(e) => set("set_name", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Edition</Label>
          <Input value={form.edition} onChange={(e) => set("edition", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Grade</Label>
          <Input value={form.grade} onChange={(e) => set("grade", e.target.value)} placeholder="e.g. PSA 10" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Description</Label>
          <Textarea rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} maxLength={4000} />
        </div>
        <label className="flex items-center gap-2 md:col-span-2">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => set("featured", e.target.checked)}
            className="h-4 w-4"
          />
          <span className="text-sm">Featured on storefront</span>
        </label>
      </div>

      <div className="space-y-2">
        <Label>Image</Label>
        <div className="flex items-center gap-4">
          {imageUrl && (
            <img src={imageUrl} alt="" className="h-20 w-20 object-cover border border-border" />
          )}
          <label className="inline-flex items-center gap-2 px-4 h-10 border border-border cursor-pointer hover:bg-muted/30 text-sm">
            {uploading ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
            {uploading ? "Uploading…" : imageUrl ? "Replace image" : "Upload image"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={saving || uploading} className="rounded-none">
          {saving && <Loader2 className="animate-spin" size={14} />}
          {initial ? "Save changes" : "Create product"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-none">
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;
