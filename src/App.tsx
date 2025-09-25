// src/App.tsx
import { useEffect, useRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import Layout from "@/components/dashboard/Layout"; // ✅ Import Layout
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Departments from "./pages/Departments";
import Designations from "./pages/Designations";

const queryClient = new QueryClient();

// ----------------------
// Protected Route
// ----------------------
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/auth" replace />;
};

// ----------------------
// Force fresh-tab login
// ----------------------
const ForceFreshTab = () => {
  const { signOut } = useAuth();

  useEffect(() => {
    if (!sessionStorage.getItem("tabInitialized")) {
      signOut().catch(console.error);
      sessionStorage.setItem("tabInitialized", "true");
    }
  }, [signOut]);

  return null;
};

// ----------------------
// Inactivity Handler
// ----------------------
const InactivityHandler = ({ children }: { children: React.ReactNode }) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const logout = () => {
    signOut();
    navigate("/auth", { replace: true });
  };

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(logout, 5 * 60 * 1000); // 5 minutes
  };

  useEffect(() => {
    const activityEvents = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    const handleVisibilityChange = () => {
      if (document.hidden) resetTimer();
      else resetTimer();
    };

    activityEvents.forEach((e) => window.addEventListener(e, resetTimer));
    document.addEventListener("visibilitychange", handleVisibilityChange);

    resetTimer(); // start initially

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      activityEvents.forEach((e) => window.removeEventListener(e, resetTimer));
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return <>{children}</>;
};

// ----------------------
// App Routes
// ----------------------
const AppRoutes = () => (
  <>
    <ForceFreshTab />
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
      <Route path="/departments" element={<ProtectedRoute><Departments /></ProtectedRoute>} />
      <Route path="/designations" element={<ProtectedRoute><Designations /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  </>
);

// ----------------------
// Main App
// ----------------------
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <InactivityHandler>
            <Layout>
              <Navbar />
              <AppRoutes />
              <Footer />
            </Layout>
          </InactivityHandler>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
