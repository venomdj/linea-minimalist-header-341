/**
 * ProductForm.tsx
 * Admin form for creating / editing a product.
 * Image upload → Supabase Storage (product-images bucket).
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { type DbProduct } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Upload, X, ImageIcon } from "lucide-react";

// ── Constants ──────────────────────────────────────────────────────────────
const BUCKET = "product-images";
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

// ── Types ──────────────────────────────────────────────────────────────────
interface Props {
  initial?: DbProduct | null;
  onDone: () => void;
  onCancel: () => void;
}

type FormState = {
  title: string;
  price: string;
  description: string;
  image_url: string;
  category: string;
  series: string;
  set_name: string;
  edition: string;
  grade: string;
  rarity: string;
  last_sale: string;
  stock: string;
  in_stock: boolean;
  featured: boolean;
  verified: boolean;
  is_new: boolean;
  population: string;
};

const RARITIES = ["Common", "Rare", "Epic", "Legendary", "Grail"] as const;

const empty: FormState = {
  title: "",
  price: "",
  description: "",
  image_url: "",
  category: "",
  series: "",
  set_name: "",
  edition: "",
  grade: "",
  rarity: "Rare",
  last_sale: "",
  stock: "1",
  in_stock: true,
  featured: false,
  verified: true,
  is_new: false,
  population: "",
};

const dbToForm = (p: DbProduct): FormState => ({
  title: p.title ?? "",
  price: String(p.price ?? ""),
  description: p.description ?? "",
  image_url: p.image_url ?? "",
  category: p.category ?? "",
  series: p.series ?? "",
  set_name: p.set_name ?? "",
  edition: p.edition ?? "",
  grade: p.grade ?? "",
  rarity: p.rarity ?? "Rare",
  last_sale: p.last_sale != null ? String(p.last_sale) : "",
  stock: String(p.stock ?? 1),
  in_stock: p.in_stock ?? true,
  featured: p.featured ?? false,
  verified: p.verified ?? true,
  is_new: p.is_new ?? false,
  population: p.population != null ? String(p.population) : "",
});

// ── Image Upload Zone ──────────────────────────────────────────────────────
interface ImageUploadProps {
  currentUrl: string;
  onUploaded: (url: string) => void;
  onClear: () => void;
  disabled?: boolean;
}

const ImageUploadZone = ({ currentUrl, onUploaded, onClear, disabled }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string>(currentUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep preview in sync when form resets (e.g. editing a different product)
  useEffect(() => {
    setPreview(currentUrl);
  }, [currentUrl]);

  const uploadFile = useCallback(async (file: File) => {
    if (!ACCEPTED.includes(file.type)) {
      toast.error("Only JPEG, PNG, WebP or GIF images are allowed");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image must be under 8 MB");
      return;
    }

    // Instant local preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);

    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: false, contentType: file.type });

      if (upErr) throw upErr;

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      onUploaded(data.publicUrl);
      toast.success("Image uploaded");
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
      setPreview(currentUrl); // revert preview on failure
    } finally {
      setUploading(false);
    }
  }, [currentUrl, onUploaded]);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    uploadFile(files[0]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!disabled) handleFiles(e.dataTransfer.files);
  };

  const handleClear = () => {
    setPreview("");
    onClear();
    if (inputRef.current) inputRef.current.value = "";
  };

  // ── With image ────────────────────────────────────────────────────────
  if (preview) {
    return (
      <div className="relative group w-full">
        <div className="relative border border-border overflow-hidden bg-muted/20" style={{ aspectRatio: "3/4", maxWidth: 180 }}>
          <img
            src={preview}
            alt="Product"
            className="w-full h-full object-cover"
            onError={() => setPreview("")}
          />
          {uploading && (
            <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
              <Loader2 size={20} className="animate-spin" />
            </div>
          )}
          {/* Replace overlay on hover */}
          {!uploading && !disabled && (
            <div
              className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 cursor-pointer"
              onClick={() => inputRef.current?.click()}
            >
              <Upload size={18} />
              <span className="font-mono text-[10px] tracking-widest uppercase">Replace</span>
            </div>
          )}
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-1.5 left-[calc(180px-28px)] p-1 bg-background border border-border hover:bg-destructive hover:border-destructive hover:text-destructive-foreground transition-colors"
            title="Remove image"
          >
            <X size={12} />
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={disabled || uploading}
        />
      </div>
    );
  }

  // ── Empty drop zone ───────────────────────────────────────────────────
  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`
        flex flex-col items-center justify-center gap-3
        border-2 border-dashed transition-colors cursor-pointer
        py-10 px-6 w-full
        ${dragOver
          ? "border-foreground bg-muted/30"
          : "border-border hover:border-foreground/50 bg-muted/10"
        }
        ${disabled ? "pointer-events-none opacity-50" : ""}
      `}
    >
      {uploading ? (
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      ) : (
        <ImageIcon size={24} className="text-muted-foreground" />
      )}
      <div className="text-center">
        <p className="font-mono text-xs tracking-wider uppercase text-foreground">
          {uploading ? "Uploading…" : "Drop image here"}
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">
          or <span className="underline underline-offset-2">click to browse</span> · JPEG, PNG, WebP · max 8 MB
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={disabled || uploading}
      />
    </div>
  );
};

// ── Main Form ──────────────────────────────────────────────────────────────
const ProductForm = ({ initial, onDone, onCancel }: Props) => {
  const [form, setForm] = useState<FormState>(initial ? dbToForm(initial) : empty);
  const [saving, setSaving] = useState(false);
  const { categories, loading: catsLoading } = useCategories();

  useEffect(() => {
    setForm(initial ? dbToForm(initial) : empty);
  }, [initial?.id]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!form.price || isNaN(Number(form.price))) { toast.error("A valid price is required"); return; }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        price: Number(form.price),
        description: form.description.trim() || null,
        image_url: form.image_url.trim() || null,
        category: form.category || null,
        series: form.series.trim() || null,
        set_name: form.set_name.trim() || null,
        edition: form.edition.trim() || null,
        grade: form.grade.trim() || null,
        rarity: form.rarity || null,
        last_sale: form.last_sale ? Number(form.last_sale) : null,
        stock: parseInt(form.stock ?? "0", 10),
        in_stock: form.in_stock,
        featured: form.featured,
        verified: form.verified,
        is_new: form.is_new,
        population: form.population ? parseInt(form.population, 10) : null,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* ── Core details ────────────────────────────────────────────────── */}
      <fieldset className="space-y-4">
        <legend className="font-mono text-[11px] tracking-widest uppercase text-muted-foreground pb-1 border-b border-border w-full">
          Core details
        </legend>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Title */}
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="title" className="font-mono text-xs tracking-wider uppercase">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Charizard VMAX — PSA 10"
              required
            />
          </div>

          {/* Price */}
          <div className="space-y-1.5">
            <Label htmlFor="price" className="font-mono text-xs tracking-wider uppercase">
              Price (₹) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              placeholder="0"
              required
            />
          </div>

          {/* Last Sale */}
          <div className="space-y-1.5">
            <Label htmlFor="last_sale" className="font-mono text-xs tracking-wider uppercase">
              Last sale price (₹)
            </Label>
            <Input
              id="last_sale"
              type="number"
              min="0"
              step="0.01"
              value={form.last_sale}
              onChange={(e) => set("last_sale", e.target.value)}
              placeholder="Optional — used for trend %"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label htmlFor="category" className="font-mono text-xs tracking-wider uppercase">
              Category
            </Label>
            <Select
              value={form.category || "__none__"}
              onValueChange={(v) => set("category", v === "__none__" ? "" : v)}
            >
              <SelectTrigger id="category" className="rounded-none font-mono text-xs">
                <SelectValue placeholder="Select a category…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__" className="font-mono text-xs text-muted-foreground">
                  — No category —
                </SelectItem>
                {catsLoading ? (
                  <SelectItem value="__loading__" disabled className="font-mono text-xs">
                    Loading…
                  </SelectItem>
                ) : (
                  categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.slug} className="font-mono text-xs">
                      {cat.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Controls which filter tab this product appears under on the storefront.
            </p>
          </div>

          {/* Rarity */}
          <div className="space-y-1.5">
            <Label htmlFor="rarity" className="font-mono text-xs tracking-wider uppercase">
              Rarity
            </Label>
            <Select value={form.rarity} onValueChange={(v) => set("rarity", v)}>
              <SelectTrigger id="rarity" className="rounded-none font-mono text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RARITIES.map((r) => (
                  <SelectItem key={r} value={r} className="font-mono text-xs">
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="description" className="font-mono text-xs tracking-wider uppercase">
            Description
          </Label>
          <Textarea
            id="description"
            rows={3}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Optional product description…"
          />
        </div>

        {/* ── Image upload ─────────────────────────────────────────────── */}
        <div className="space-y-1.5">
          <Label className="font-mono text-xs tracking-wider uppercase">
            Product image
          </Label>
          <ImageUploadZone
            currentUrl={form.image_url}
            onUploaded={(url) => set("image_url", url)}
            onClear={() => set("image_url", "")}
            disabled={saving}
          />
        </div>
      </fieldset>

      {/* ── Card details ─────────────────────────────────────────────────── */}
      <fieldset className="space-y-4">
        <legend className="font-mono text-[11px] tracking-widest uppercase text-muted-foreground pb-1 border-b border-border w-full">
          Card details
        </legend>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="series" className="font-mono text-xs tracking-wider uppercase">Series</Label>
            <Input id="series" value={form.series} onChange={(e) => set("series", e.target.value)} placeholder="e.g. Scarlet & Violet" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="set_name" className="font-mono text-xs tracking-wider uppercase">Set name</Label>
            <Input id="set_name" value={form.set_name} onChange={(e) => set("set_name", e.target.value)} placeholder="e.g. Obsidian Flames" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edition" className="font-mono text-xs tracking-wider uppercase">Edition</Label>
            <Input id="edition" value={form.edition} onChange={(e) => set("edition", e.target.value)} placeholder="e.g. 1st Edition" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="grade" className="font-mono text-xs tracking-wider uppercase">Grade</Label>
            <Input id="grade" value={form.grade} onChange={(e) => set("grade", e.target.value)} placeholder="e.g. PSA 10" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="population" className="font-mono text-xs tracking-wider uppercase">Population</Label>
            <Input id="population" type="number" min="0" value={form.population} onChange={(e) => set("population", e.target.value)} placeholder="PSA pop report count" />
          </div>
        </div>
      </fieldset>

      {/* ── Stock & flags ─────────────────────────────────────────────────── */}
      <fieldset className="space-y-4">
        <legend className="font-mono text-[11px] tracking-widest uppercase text-muted-foreground pb-1 border-b border-border w-full">
          Stock &amp; flags
        </legend>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="stock" className="font-mono text-xs tracking-wider uppercase">Stock qty</Label>
            <Input id="stock" type="number" min="0" value={form.stock} onChange={(e) => set("stock", e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(
            [
              { key: "in_stock", label: "In stock" },
              { key: "featured", label: "Featured" },
              { key: "verified", label: "Verified" },
              { key: "is_new",   label: "New listing" },
            ] as { key: keyof FormState; label: string }[]
          ).map(({ key, label }) => (
            <label
              key={key}
              className={`
                flex items-center gap-2 px-3 py-2.5 border cursor-pointer
                font-mono text-xs tracking-wider uppercase select-none transition-colors
                ${form[key]
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:border-foreground/50"
                }
              `}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={form[key] as boolean}
                onChange={(e) => set(key, e.target.checked as FormState[typeof key])}
              />
              <span className={`w-3 h-3 border flex items-center justify-center shrink-0 ${form[key] ? "border-background bg-background" : "border-current"}`}>
                {form[key] && (
                  <svg viewBox="0 0 10 10" className="w-2 h-2 fill-foreground">
                    <path d="M1 5l3 3 5-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </span>
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* ── Actions ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={saving} className="rounded-none min-w-[120px]">
          {saving ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : initial ? "Save changes" : "Create product"}
        </Button>
        <Button type="button" variant="outline" className="rounded-none" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;
