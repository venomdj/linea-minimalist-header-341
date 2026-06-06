// src/components/PushNotificationStatus.tsx
// Optional admin UI badge showing whether push notifications are active.
// Place in your admin header or settings panel.

import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { getOneSignalPlayerId, isPushPermissionGranted } from "@/lib/onesignal";
import { cn } from "@/lib/utils";

type Status = "loading" | "active" | "inactive" | "denied";

export function PushNotificationStatus({ className }: { className?: string }) {
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    async function check() {
      // Check browser permission first (synchronous)
      const permission = Notification.permission;

      if (permission === "denied") {
        setStatus("denied");
        return;
      }

      if (permission !== "granted") {
        setStatus("inactive");
        return;
      }

      // Check if we have an active OneSignal subscription
      try {
        const id = await getOneSignalPlayerId();
        setStatus(id ? "active" : "inactive");
      } catch {
        setStatus("inactive");
      }
    }

    check();
  }, []);

  const configs: Record<Status, { icon: React.ReactNode; label: string; color: string }> = {
    loading: {
      icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
      label: "Checking…",
      color: "text-muted-foreground",
    },
    active: {
      icon: <Bell className="h-3.5 w-3.5" />,
      label: "Push notifications on",
      color: "text-emerald-600 dark:text-emerald-400",
    },
    inactive: {
      icon: <BellOff className="h-3.5 w-3.5" />,
      label: "Push notifications off",
      color: "text-amber-500",
    },
    denied: {
      icon: <BellOff className="h-3.5 w-3.5" />,
      label: "Notifications blocked",
      color: "text-destructive",
    },
  };

  const { icon, label, color } = configs[status];

  return (
    <div className={cn("flex items-center gap-1.5 text-xs font-medium", color, className)}>
      {icon}
      <span>{label}</span>
      {status === "denied" && (
        <a
          href="chrome://settings/content/notifications"
          className="underline underline-offset-2 hover:opacity-80"
          title="Open browser notification settings"
        >
          Fix
        </a>
      )}
    </div>
  );
}
