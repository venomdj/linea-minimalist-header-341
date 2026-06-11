import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import CategorySelect from "./CategorySelect";
import { toast } from "sonner";
import { Loader2, Upload, PackageX, Package } from "lucide-react";
import type { DbProduct } from "@/hooks/useProducts";

const schema = z.object({
  title: z.string().trim().min(1, "Title required").max(160),
  price: z.coerce.number().min(0, "Price must be ≥ 0"),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  category_id: z.string().optional().or(z.literal("")),
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
    category_id: (initial as any)?.category_id ?? "",
    category: initial?.category ?? "",
    stock: String(initial?.stock ?? 0),
    featured: !!initial?.featured,
    series: initial?.series ?? "",
    set_name: initial?.set_name ?? "",
    edition: initial?.edition ?? "",
    grade: initial?.grade ?? "",
    rarity: (initial?.rarity as any) ?? "Rare",
  });

  // in_stock can be manually overridden by admin even when stock > 0
  // Defaults to current DB value, or true if creating new
  const stockNum = initial?.stock ?? 0;
  const [inStock, setInStock] = useState<boolean>(
    initial ? (initial.in_stock ?? stockNum > 0) : true
  );

  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Computed: what in_stock will be after save
  const computedInStock = Number(form.stock) === 0 ? false : inStock;

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
      const finalStock = parsed.data.stock;
      // If stock is 0, force in_stock to false regardless of toggle
      const finalInStock = finalStock === 0 ? false : inStock;

      const payload = {
        title: parsed.data.title,
        price: parsed.data.price,
        description: parsed.data.description || null,
        image_url: imageUrl || null,
        category_id: parsed.data.category_id || null,
        category: parsed.data.category || null,
        stock: finalStock,
        in_stock: finalInStock,
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

        {/* ── Stock + in_stock controls ── */}
        <div className="space-y-2">
          <Label>Stock *</Label>
          <Input
            type="number"
            min="0"
            step="1"
            value={form.stock}
            onChange={(e) => {
              set("stock", e.target.value);
              // Auto-set in_stock when stock goes to 0
              const n = parseInt(e.target.value, 10);
              if (!isNaN(n) && n === 0) setInStock(false);
              if (!isNaN(n) && n > 0 && !inStock) setInStock(true);
            }}
            required
          />
        </div>

        {/* In-stock status badge + manual override */}
        <div className="md:col-span-2">
          <div className={`flex items-center justify-between p-3 border rounded-sm ${
            computedInStock ? "border-verified/30 bg-verified/5" : "border-destructive/30 bg-destructive/5"
          }`}>
            <div className="flex items-center gap-2">
              {computedInStock
                ? <Package size={14} className="text-verified" />
                : <PackageX size={14} className="text-destructive" />
              }
              <span className={`text-xs font-mono tracking-wider uppercase ${
                computedInStock ? "text-verified" : "text-destructive"
              }`}>
                {computedInStock ? "In Stock — Visible to buyers" : "Out of Stock — Hidden from buyers"}
              </span>
            </div>
            {/* Manual override: only show toggle when stock > 0 */}
            {Number(form.stock) > 0 && (
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs text-muted-foreground font-mono">
                  {inStock ? "Force OOS" : "Re-enable"}
                </span>
                <button
                  type="button"
                  onClick={() => setInStock((v) => !v)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    inStock ? "bg-verified" : "bg-muted"
                  }`}
                  aria-label="Toggle in stock"
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    inStock ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </label>
            )}
          </div>
          {Number(form.stock) > 0 && !inStock && (
            <p className="text-[11px] text-muted-foreground font-mono mt-1 tracking-wide">
              ⚠ Manual override active — item is marked out of stock despite having {form.stock} units.
            </p>
          )}
        </div>

        {/* NEW: Category ID dropdown */}
        <div className="space-y-2">
          <Label>Category</Label>
          <CategorySelect 
            value={form.category_id} 
            onChange={(e) => set("category_id", e)}
            placeholder="Select a category..."
          />
          <p className="text-[11px] text-muted-foreground font-mono tracking-wide">
            Select from predefined categories for better filtering and organization.
          </p>
        </div>

        {/* Legacy category field (optional, for backwards compatibility) */}
        <div className="space-y-2">
          <Label>Legacy Category (Optional)</Label>
          <Input 
            value={form.category} 
            onChange={(e) => set("category", e.target.value)} 
            placeholder="e.g. Trading Cards" 
          />
          <p className="text-[11px] text-muted-foreground font-mono tracking-wide">
            Legacy field. Use the Category dropdown above instead.
          </p>
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
