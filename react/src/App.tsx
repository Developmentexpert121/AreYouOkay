import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import CheckinHistory from "./pages/CheckinHistory";
import Subscription from "./pages/Subscription";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AuthCallback from "./pages/AuthCallback";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, requireAdmin, requireUser }: { children: React.ReactNode, requireAdmin?: boolean, requireUser?: boolean }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = user.email === "developmentexpert121@gmail.com";
  const isSubscribed = user.subscription_status === "active";

  // Admin bypass
  if (isAdmin) {
    if (requireUser) return <Navigate to="/admin" replace />;
    return <>{children}</>;
  }

  // Subscription check for regular users
  const isOnSubscriptionPage = window.location.pathname === "/subscription";
  if (!isSubscribed && !isOnSubscriptionPage) {
    return <Navigate to="/subscription" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }
  
  if (user) {
    const isAdmin = user.email === "developmentexpert121@gmail.com";
    const isSubscribed = user.subscription_status === "active";

    if (isAdmin) return <Navigate to="/admin" replace />;
    if (isSubscribed) return <Navigate to="/dashboard" replace />;
    return <Navigate to="/subscription" replace />;
  }
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
            <Route path="/signup" element={<AuthRoute><Signup /></AuthRoute>} />
            <Route path="/forgot-password" element={<AuthRoute><ForgotPassword /></AuthRoute>} />
            <Route path="/reset-password" element={<AuthRoute><ResetPassword /></AuthRoute>} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<ProtectedRoute requireUser><Dashboard /></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute requireUser><CheckinHistory /></ProtectedRoute>} />
              <Route path="/subscription" element={<ProtectedRoute requireUser><Subscription /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
