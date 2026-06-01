import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import AdminLogin from "./pages/admin/Login";   // adjust path as needed
import AdminDashboard from "./pages/admin/Dashboard"; // adjust path as needed
import AdminRoute from "./components/AdminRoute"; // auth guard

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Storefront routes — unchanged */}
        <Route path="/" element={<Index />} />
        {/* ... other storefront routes ... */}

        {/* Admin routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

createRoot(document.getElementById("root")!).render(<App />);
