import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProducts, type DbProduct } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProductForm from "@/components/admin/ProductForm";
import AdminOrders from '../components/order/AdminOrders';
import AdminNotifications from '@/components/admin/AdminNotifications';
import { useAdminNotificationsCount } from '@/hooks/useAdminNotificationsCount';
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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { LogOut, Plus, Pencil, Trash2, Package, Search, ClipboardList, Bell } from "lucide-react";

const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const Admin = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { rows, loading, reload } = useProducts();
  const [editing, setEditing] = useState<DbProduct | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<DbProduct | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [q, setQ] = useState("");
  
  // Tab control state: Defaults to managing products
  const [activeTab, setActiveTab] = useState<"products" | "orders" | "notifications">("products");
  const unreadCount = useAdminNotificationsCount();


  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("products").delete().eq("id", toDelete.id);
      if (error) throw error;
      toast.success("Product deleted");
      setToDelete(null);
      reload();
    } catch (err: any) {
      toast.error(err.message ?? "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = rows.filter((r) =>
    !q ? true : `${r.title} ${r.category ?? ""} ${r.series ?? ""}`.toLowerCase().includes(q.toLowerCase()),
  );

  const showingForm = creating || editing;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Package size={20} />
            <div>
              <h1 className="font-display text-lg tracking-tight">MYTHICAL VAULT · ADMIN</h1>
              <p className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">{user?.email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={signOut} className="rounded-none">
            <LogOut size={14} /> Sign out
          </Button>
        </div>
      </header>

      {/* Admin Sub-Navigation Menu */}
      <div className="border-b border-border bg-muted/10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex gap-4">
          <button
            onClick={() => setActiveTab("products")}
            className={`py-3 px-2 font-mono text-xs tracking-wider uppercase border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "products"
                ? "border-primary text-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Package size={14} /> Products
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`py-3 px-2 font-mono text-xs tracking-wider uppercase border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "orders"
                ? "border-primary text-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <ClipboardList size={14} /> Orders
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* VIEW 1: ORDERS DASHBOARD */}
        {activeTab === "orders" && <AdminOrders />}

        {/* VIEW 2: PRODUCTS DASHBOARD */}
        {activeTab === "products" && (
          showingForm ? (
            <section className="border border-border bg-surface-1 p-6">
              <h2 className="font-display text-xl mb-6">{editing ? "Edit product" : "New product"}</h2>
              <ProductForm
                initial={editing}
                onDone={() => {
                  setCreating(false);
                  setEditing(null);
                  reload();
                }}
                onCancel={() => {
                  setCreating(false);
                  setEditing(null);
                }}
              />
            </section>
          ) : (
            <>
              <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="relative md:w-80">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search products"
                    className="pl-9"
                  />
                </div>
                <Button onClick={() => setCreating(true)} className="rounded-none">
                  <Plus size={14} /> New product
                </Button>
              </section>

              <section>
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="border border-dashed border-border p-12 text-center text-muted-foreground">
                    <Package className="mx-auto mb-3" />
                    <p>No products yet. Create your first product to get started.</p>
                  </div>
                ) : (
                  <div className="border border-border overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/30 text-left">
                        <tr>
                          <th className="p-3 font-mono text-[11px] tracking-wider uppercase">Image</th>
                          <th className="p-3 font-mono text-[11px] tracking-wider uppercase">Title</th>
                          <th className="p-3 font-mono text-[11px] tracking-wider uppercase">Category</th>
                          <th className="p-3 font-mono text-[11px] tracking-wider uppercase">Price</th>
                          <th className="p-3 font-mono text-[11px] tracking-wider uppercase">Stock</th>
                          <th className="p-3 font-mono text-[11px] tracking-wider uppercase">Featured</th>
                          <th className="p-3 font-mono text-[11px] tracking-wider uppercase text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((r) => (
                          <tr key={r.id} className="border-t border-border">
                            <td className="p-3">
                              {r.image_url ? (
                                <img src={r.image_url} alt="" className="h-12 w-12 object-cover border border-border" />
                              ) : (
                                <div className="h-12 w-12 bg-muted/30 border border-border" />
                              )}
                            </td>
                            <td className="p-3 font-medium">{r.title}</td>
                            <td className="p-3 text-muted-foreground">{r.category ?? "—"}</td>
                            <td className="p-3 tabular-nums">{inr(Number(r.price))}</td>
                            <td className="p-3 tabular-nums">{r.stock}</td>
                            <td className="p-3">{r.featured ? "Yes" : "—"}</td>
                            <td className="p-3 text-right space-x-2 whitespace-nowrap">
                              <Button size="sm" variant="outline" className="rounded-none" onClick={() => setEditing(r)}>
                                <Pencil size={12} /> Edit
                              </Button>
                              <Button size="sm" variant="outline" className="rounded-none text-destructive hover:text-destructive" onClick={() => setToDelete(r)}>
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
            </>
          )
        )}
      </main>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="text-foreground font-medium">{toDelete?.title}</span>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleting} className="bg-destructive hover:bg-destructive/90">
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin;
