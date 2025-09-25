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
// Protected Route Wrapper
// ----------------------
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();

  if (loading) return null; // optionally, a loading spinner

  return user ? children : <Navigate to="/auth" replace />;
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

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees"
        element={
          <ProtectedRoute>
            <Employees />
          </ProtectedRoute>
        }
      />
      <Route
        path="/departments"
        element={
          <ProtectedRoute>
            <Departments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/designations"
        element={
          <ProtectedRoute>
            <Designations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/view-employees"
        element={
          <ProtectedRoute>
            <ViewEmployees />
          </ProtectedRoute>
        }
      />

      {/* Catch-all → always redirect to /auth */}
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
          <Navbar /> {/* Navbar now only shows on management routes */}
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
