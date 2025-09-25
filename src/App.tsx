import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/ui/Navbar";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Departments from "./pages/Departments";
import Designations from "./pages/Designations";
import ViewEmployees from "./pages/ViewEmployees";

const queryClient = new QueryClient();

// ----------------------
// Force Auth Route Wrapper
// ----------------------
const ForceAuthRoute = ({ children }: { children: JSX.Element }) => {
  const { loading } = useAuth();

  if (loading) return null; // Wait for Supabase session check

  // Always redirect to /auth on fresh load
  return <Navigate to="/auth" replace />;
};

// ----------------------
// App Routes
// ----------------------
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />

      {/* Protected routes: always redirect to /auth initially */}
      <Route path="/dashboard" element={<ForceAuthRoute><Dashboard /></ForceAuthRoute>} />
      <Route path="/employees" element={<ForceAuthRoute><Employees /></ForceAuthRoute>} />
      <Route path="/departments" element={<ForceAuthRoute><Departments /></ForceAuthRoute>} />
      <Route path="/designations" element={<ForceAuthRoute><Designations /></ForceAuthRoute>} />
      <Route path="/view-employees" element={<ForceAuthRoute><ViewEmployees /></ForceAuthRoute>} />

      {/* Catch-all → redirect to /auth */}
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  );
};

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
          <Navbar /> {/* Navbar only shows on management routes */}
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
