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
import { useEffect, useState } from "react";

const queryClient = new QueryClient();

// ----------------------
// Protected Route
// ----------------------
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();
  if (loading) return null; // optional: show spinner here
  return user ? children : <Navigate to="/auth" replace />;
};

// ----------------------
// Force fresh-tab login
// ----------------------
// ----------------------
// Force fresh-tab login
// ----------------------
const ForceFreshTab = () => {
  const { signOut } = useAuth();

  useEffect(() => {
    if (!sessionStorage.getItem("tabInitialized")) {
      // Use signOut method instead of setUser
      signOut().catch(console.error);
      sessionStorage.setItem("tabInitialized", "true");
    }
  }, [signOut]);

  return null; // no UI needed
};


// ----------------------
// App Routes
// ----------------------
const AppRoutes = () => {
  return (
    <>
      <ForceFreshTab /> {/* runs once per tab */}
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
        <Route path="/departments" element={<ProtectedRoute><Departments /></ProtectedRoute>} />
        <Route path="/designations" element={<ProtectedRoute><Designations /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </>
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
          <Navbar />
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
