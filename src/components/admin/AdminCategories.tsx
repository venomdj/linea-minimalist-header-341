import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCategories } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Category } from "@/hooks/useCategories";

const AdminCategories = () => {
  const { categories, loading, reload } = useCategories();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [toDelete, setToDelete] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    icon_name: "",
    color_hex: "#000000",
    display_order: 0,
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      icon_name: "",
      color_hex: "#000000",
      display_order: 0,
      is_active: true,
    });
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (category: Category) => {
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      icon_name: category.icon_name || "",
      color_hex: category.color_hex,
      display_order: category.display_order,
      is_active: category.is_active,
    });
    setEditing(category);
    setShowForm(true);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      slug: !editing ? generateSlug(name) : prev.slug,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast.error("Name and slug are required");
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase
          .from("categories")
          .update(formData)
          .eq("id", editing.id);
        if (error) throw error;
        toast.success("Category updated");
      } else {
        const { error } = await supabase.from("categories").insert(formData);
        if (error) throw error;
        toast.success("Category created");
      }
      resetForm();
      reload();
    } catch (err: any) {
      toast.error(err.message ?? "Operation failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("categories").delete().eq("id", toDelete.id);
      if (error) throw error;
      toast.success("Category deleted");
      setToDelete(null);
      reload();
    } catch (err: any) {
      toast.error(err.message ?? "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async (category: Category) => {
    try {
      const { error } = await supabase
        .from("categories")
        .update({ is_active: !category.is_active })
        .eq("id", category.id);
      if (error) throw error;
      toast.success(category.is_active ? "Category hidden" : "Category shown");
      reload();
    } catch (err: any) {
      toast.error(err.message ?? "Operation failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl mb-1">Category Management</h2>
          <p className="text-sm text-muted-foreground">Manage product categories for filtering</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="rounded-none">
          <Plus size={14} /> New Category
        </Button>
      </div>

      {showForm && (
        <section className="border border-border bg-surface-1 p-6 rounded-sm">
          <h3 className="font-display text-lg mb-4">{editing ? "Edit category" : "New category"}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category Name *</Label>
                <Input
                  value={formData.name}
                  onChange={handleNameChange}
                  placeholder="e.g. Pokémon"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Slug *</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g. pokemon"
                  required
                />
                <p className="text-[11px] text-muted-foreground">URL-friendly identifier (auto-generated)</p>
              </div>
              <div className="space-y-2">
                <Label>Display Order</Label>
                <Input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Color Hex</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={formData.color_hex}
                    onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })}
                    className="w-20 h-10 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={formData.color_hex}
                    onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })}
                    placeholder="#000000"
                  />
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this category"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Icon Name (Optional)</Label>
                <Input
                  value={formData.icon_name}
                  onChange={(e) => setFormData({ ...formData, icon_name: e.target.value })}
                  placeholder="e.g. Zap, Heart, Package"
                />
                <p className="text-[11px] text-muted-foreground">Lucide icon name</p>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <span>Active (visible to customers)</span>
                </Label>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving} className="rounded-none">
                {saving && <Loader2 className="animate-spin" size={14} />}
                {editing ? "Save changes" : "Create category"}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm} className="rounded-none">
                Cancel
              </Button>
            </div>
          </form>
        </section>
      )}

      <section>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="border border-dashed border-border p-12 text-center text-muted-foreground">
            <p>No categories yet. Create your first category to get started.</p>
          </div>
        ) : (
          <div className="border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-left">
                <tr>
                  <th className="p-3 font-mono text-[11px] tracking-wider uppercase">Name</th>
                  <th className="p-3 font-mono text-[11px] tracking-wider uppercase">Slug</th>
                  <th className="p-3 font-mono text-[11px] tracking-wider uppercase">Order</th>
                  <th className="p-3 font-mono text-[11px] tracking-wider uppercase">Status</th>
                  <th className="p-3 font-mono text-[11px] tracking-wider uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id} className="border-t border-border">
                    <td className="p-3 font-medium">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: category.color_hex }}
                        />
                        {category.name}
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground font-mono text-xs">{category.slug}</td>
                    <td className="p-3 tabular-nums">{category.display_order}</td>
                    <td className="p-3">
                      {category.is_active ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono tracking-wider uppercase text-verified">
                          <CheckCircle size={12} /> Active
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono tracking-wider uppercase text-muted-foreground">Inactive</span>
                      )}
                    </td>
                    <td className="p-3 text-right space-x-2 whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleActive(category)}
                        className="rounded-none"
                        title={category.is_active ? "Hide" : "Show"}
                      >
                        {category.is_active ? (
                          <Eye size={12} />
                        ) : (
                          <EyeOff size={12} />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-none"
                        onClick={() => handleEdit(category)}
                      >
                        <Pencil size={12} /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-none text-destructive hover:text-destructive"
                        onClick={() => setToDelete(category)}
                      >
                        <Trash2 size={12} /> Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="text-foreground font-medium">{toDelete?.name}</span>. Products in this category will not be deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminCategories;
