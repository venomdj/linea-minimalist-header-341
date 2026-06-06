// ─── EXAMPLE: How to wire useAdminNotifications into your App ───────────────
//
// Find your top-level admin component (App.tsx, AdminLayout.tsx, or similar)
// and add ONE import + ONE hook call.
//
// Everything else stays untouched.
// ─────────────────────────────────────────────────────────────────────────────

// BEFORE (your existing App.tsx — simplified):
// ──────────────────────────────────────────────
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// ① ADD this import
import { useAdminNotifications } from "@/hooks/useAdminNotifications";

// ② Optional: add the status badge import
import { PushNotificationStatus } from "@/components/PushNotificationStatus";

const queryClient = new QueryClient();

// ③ Create a small inner component so the hook runs inside the Router context
function AdminApp() {
  // ONE LINE — this is all you need
  useAdminNotifications();

  return (
    <>
      {/* Optional: show notification status somewhere in your admin header */}
      {/* <PushNotificationStatus className="ml-auto" /> */}

      <Routes>
        {/* your existing routes unchanged */}
        {/* <Route path="/" element={<Index />} /> */}
        {/* <Route path="/orders" element={<Orders />} /> */}
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AdminApp />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// That's it! The hook handles:
//   • OneSignal SDK load + init
//   • Permission prompt on first login
//   • Saving player_id to Supabase
//   • Realtime subscription on orders table
//   • Sending push via OneSignal REST API on new orders
// ─────────────────────────────────────────────────────────────────────────────
