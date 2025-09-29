// src/App.tsx
import { useEffect, useRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { LoginProvider, useLogin } from "@/contexts/LoginContext"; // updated
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

// ✅ Import pages
import Index from "./pages/Index";
import Login from "./pages/Login"; // renamed page
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Departments from "./pages/Departments";
import Designations from "./pages/Designations";

// ✅ Import the hook
import { useFormNavigation } from "@/hooks/useFormNavigation";

const queryClient = new QueryClient();

// ----------------------
// Protected Route
// ----------------------
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useLogin(); // updated
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
};

// ----------------------
// Force fresh-tab login
// ----------------------
const ForceFreshTab = () => {
  const { logout } = useLogin(); // updated

  useEffect(() => {
    if (!sessionStorage.getItem("tabInitialized")) {
      logout().catch(console.error);
      sessionStorage.setItem("tabInitialized", "true");
    }
  }, [logout]);

  return null;
};

// ----------------------
// Inactivity Handler
// ----------------------
const InactivityHandler = ({ children }: { children: React.ReactNode }) => {
  const { logout } = useLogin(); // updated
  const navigate = useNavigate();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const logout = () => {
    logOut();
    navigate("/login", { replace: true });
  };

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(logout, 5 * 60 * 1000); // 5 minutes
  };

  useEffect(() => {
    const activityEvents = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    const handleVisibilityChange = () => resetTimer();

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
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
      <Route path="/departments" element={<ProtectedRoute><Departments /></ProtectedRoute>} />
      <Route path="/designations" element={<ProtectedRoute><Designations /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  </>
);

// ----------------------
// Main App
// ----------------------
const App = () => {
  // ✅ Enable global form navigation
  useFormNavigation();

  return (
    <QueryClientProvider client={queryClient}>
      <LoginProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <InactivityHandler>
              <Navbar />
              <AppRoutes />
              <Footer />
            </InactivityHandler>
          </BrowserRouter>
        </TooltipProvider>
      </LoginProvider>
    </QueryClientProvider>
  );
};

export default App;
