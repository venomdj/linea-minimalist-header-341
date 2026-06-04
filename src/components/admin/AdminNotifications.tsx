import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Check, CheckCheck, Package, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string | null;
  order_id: string | null;
  metadata: Record<string, any>;
  read: boolean;
  read_at: string | null;
  created_at: string;
};

const formatRelative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

const inr = (n: number | string | undefined) =>
  n == null
    ? "—"
    : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n));

const AdminNotifications = () => {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("unread");

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      toast.error("Could not load notifications");
      setItems([]);
    } else {
      setItems((data ?? []) as Notification[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("notifications-admin")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const n = payload.new as Notification;
          setItems((prev) => (prev.find((x) => x.id === n.id) ? prev : [n, ...prev]));
          toast.success(n.title, { description: n.message ?? undefined });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications" },
        (payload) => {
          const n = payload.new as Notification;
          setItems((prev) => prev.map((x) => (x.id === n.id ? n : x)));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const markRead = async (id: string) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, read: true } : x)));
    const { error } = await supabase
      .from("notifications")
      .update({ read: true, read_at: new Date().toISOString() })
      .eq("id", id);
    if (error) toast.error("Could not mark as read");
  };

  const markAllRead = async () => {
    const unread = items.filter((x) => !x.read);
    if (unread.length === 0) return;
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    const { error } = await supabase
      .from("notifications")
      .update({ read: true, read_at: new Date().toISOString() })
      .in("id", unread.map((x) => x.id));
    if (error) toast.error("Could not mark all read");
    else toast.success(`${unread.length} marked as read`);
  };

  const visible = items.filter((x) => (filter === "unread" ? !x.read : true));
  const unreadCount = items.filter((x) => !x.read).length;

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-mono flex items-center justify-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-xl tracking-tight truncate">Notifications</h2>
            <p className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
              Realtime · {items.length} total · {unreadCount} unread
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex border border-border">
            <button
              onClick={() => setFilter("unread")}
              className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider ${filter === "unread" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
            >
              Unread
            </button>
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider border-l border-border ${filter === "all" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
            >
              All
            </button>
          </div>
          <Button variant="outline" className="rounded-none" onClick={markAllRead} disabled={unreadCount === 0}>
            <CheckCheck size={14} /> <span className="hidden sm:inline">Mark all read</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="border border-dashed border-border p-12 text-center text-muted-foreground">
          <Bell className="mx-auto mb-3 opacity-50" />
          <p className="text-sm">
            {filter === "unread" ? "All caught up — no unread notifications." : "No notifications yet."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {visible.map((n) => {
            const meta = n.metadata ?? {};
            return (
              <li
                key={n.id}
                className={`group border border-border bg-surface-1 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 transition-all animate-fade-in ${
                  !n.read ? "border-l-2 border-l-primary" : "opacity-70"
                }`}
              >
                <div className="shrink-0 w-9 h-9 rounded-full bg-muted/40 border border-border flex items-center justify-center">
                  <Package size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-medium text-sm text-foreground truncate">{n.title}</p>
                    <span className="text-[10px] font-mono tracking-wider text-muted-foreground whitespace-nowrap">
                      {formatRelative(n.created_at)}
                    </span>
                  </div>
                  {n.message && <p className="text-xs text-muted-foreground mt-1">{n.message}</p>}
                  {meta.order_number && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-[11px] font-mono">
                      <div>
                        <span className="text-muted-foreground block">Order</span>
                        <span className="text-foreground tracking-wider truncate block">{meta.order_number}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Customer</span>
                        <span className="text-foreground truncate block">{meta.customer_name ?? "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Amount</span>
                        <span className="text-foreground tabular-nums block">{inr(meta.total_amount)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Status</span>
                        <span className="text-foreground capitalize block">{meta.status ?? "pending"}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex sm:flex-col items-stretch gap-2 sm:w-32">
                  {n.order_id && (
                    <Button asChild size="sm" variant="outline" className="rounded-none flex-1">
                      <Link to={`/account/orders/${n.order_id}`}>
                        <ExternalLink size={12} /> View
                      </Link>
                    </Button>
                  )}
                  {!n.read && (
                    <Button size="sm" className="rounded-none flex-1" onClick={() => markRead(n.id)}>
                      <Check size={12} /> Read
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default AdminNotifications;
