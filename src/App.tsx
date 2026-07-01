import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import Index from "./pages/Index";
import Category from "./pages/Category";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import NotFound from "./pages/NotFound";
import TrackOrder from './pages/TrackOrder';
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import AdminProtectedRoute from "./components/admin/ProtectedRoute";
import UserProtectedRoute from "./components/ProtectedRoute"; // ← NEW
import { useAdminNotifications } from "./hooks/useAdminNotifications";

// Account pages
import Dashboard from "./pages/account/Dashboard";
import Profile from "./pages/account/Profile";
import MyOrders from "./pages/account/MyOrders";
import OrderDetail from "./pages/account/OrderDetail";
import AccountSettings from "./pages/account/AccountSettings";
import Addresses from "./pages/account/Addresses";


const queryClient = new QueryClient();

function AppRoutes() {
  useAdminNotifications();

  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* OAuth callback */}
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Index />} />
        <Route path="/category/:category" element={<Category />} />
        <Route path="/product/:productId" element={<ProductDetail />} />
        <Route path="/track-order" element={<TrackOrder />} />
        <Route path="/about/our-story" element={<NotFound />} />
        <Route path="/about/size-guide" element={<NotFound />} />
        <Route path="/about/customer-care" element={<NotFound />} />
        <Route path="/about/store-locator" element={<NotFound />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />

        {/* ── Checkout — auth gated ── */}
        <Route
          path="/checkout"
          element={
            <UserProtectedRoute>
              <Checkout />
            </UserProtectedRoute>
          }
        />

        {/* ── My Account — auth gated ── */}
        <Route path="/account" element={<UserProtectedRoute><Dashboard /></UserProtectedRoute>} />
        <Route path="/account/profile" element={<UserProtectedRoute><Profile /></UserProtectedRoute>} />
        <Route path="/account/orders" element={<UserProtectedRoute><MyOrders /></UserProtectedRoute>} />
        <Route path="/account/orders/:orderId" element={<UserProtectedRoute><OrderDetail /></UserProtectedRoute>} />
        <Route path="/account/settings" element={<UserProtectedRoute><AccountSettings /></UserProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminProtectedRoute><Admin /></AdminProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <CartProvider>
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <AppRoutes />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
