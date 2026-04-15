import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useLocation, BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
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
import VerifyEmail from "./pages/VerifyEmail";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, requireAdmin }: { children: React.ReactNode, requireAdmin?: boolean }) => {
  const location = useLocation();
  const savedUser = localStorage.getItem("user");
  let user = null;
  try {
    user = savedUser ? JSON.parse(savedUser) : null;
  } catch (e) {
    console.error("Failed to parse user from localStorage", e);
    localStorage.removeItem("user");
  }
  
  const isAdmin = user?.email === "admin@gmail.com";
  const isSubscribed = user?.subscription_status === "active";
  const userOnlyPaths = ["/dashboard", "/history", "/subscription", "/profile"];
  const adminOnlyPaths = ["/admin"];

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Admin access control
  if (isAdmin) {
    if (userOnlyPaths.includes(location.pathname)) {
      return <Navigate to="/admin" replace />;
    }
    return <>{children}</>;
  }

  // Regular user access control
  if (adminOnlyPaths.includes(location.pathname)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Subscription check for regular users
  const isOnSubscriptionPage = location.pathname === "/subscription";
  if (!isSubscribed && !isOnSubscriptionPage) {
    return <Navigate to="/subscription" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const savedUser = localStorage.getItem("user");
  let user = null;
  try {
    user = savedUser ? JSON.parse(savedUser) : null;
  } catch (e) {
    user = null;
  }
  
  const isAdmin = user?.email === "admin@gmail.com";
  const isSubscribed = user?.subscription_status === "active";

  if (user) {
    if (isAdmin) return <Navigate to="/admin" replace />;
    if (isSubscribed) return <Navigate to="/dashboard" replace />;
    return <Navigate to="/subscription" replace />;
  }
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
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
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/history" element={<CheckinHistory />} />
            <Route path="/subscription" element={<Subscription />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
