import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/api-config";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Eye, EyeOff, Mail, Lock, Sparkles, AlertTriangle, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { AuthBackground } from "@/components/AuthBackground";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);

  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const error = searchParams.get("error");
    if (error) {
      toast.error(error.replace(/_/g, " "));
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Valid email is required";

    if (!password) newErrors.password = "Password is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const data = await res.json();
        // Handle email not verified (403)
        if (res.status === 403 && data.detail === "email_not_verified") {
          setEmailNotVerified(true);
          setLoading(false);
          return;
        }
        throw new Error(data.detail || "Login failed");
      }
      const user = await res.json();
      localStorage.setItem("user", JSON.stringify(user));

      toast.success("Successfully logged in!");

      const searchParams = new URLSearchParams(window.location.search);
      const redirect = searchParams.get("redirect");

      if (user.email === "admin@gmail.com") {
        navigate("/admin");
      } else if (user.subscription_status === "active") {
        if (redirect === "checkout") {
          navigate("/subscription?checkout=true");
        } else {
          navigate("/dashboard");
        }
      } else {
        navigate("/subscription");
      }
    } catch (err: any) {
      setErrors({ general: err.message });
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      toast.error("Please enter your email address first.");
      return;
    }
    setResendingVerification(true);
    try {
      await fetch(`${API_BASE_URL}/users/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      toast.success("Verification code sent! Check your inbox.");
      navigate(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch {
      toast.error("Failed to resend. Please try again.");
    } finally {
      setResendingVerification(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080818] flex items-center justify-center p-4 relative overflow-hidden">
      <AuthBackground />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-4xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative z-10"
      >
        {/* Left Side: Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative">
          {/* Branding */}
          <div className="flex flex-col items-center gap-6 mb-8 text-center w-full">
            <motion.div
              whileHover={{ rotate: 10, scale: 1.1 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-center p-0"
            >
              <img src="/final logo.png" alt="Logo" className="w-20 h-20 object-contain" />
            </motion.div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Welcome back</h1>
            <p className="text-gray-400 text-sm mt-2">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="Email address"
                  value={email}
                  className="bg-white/10 border border-white/20 h-14 rounded-xl text-white placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-blue-500 pl-12"
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: "" });
                  }}
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              {errors.email && <p className="text-xs text-red-400 mt-1 pl-2">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  className="bg-white/10 border border-white/20 h-14 rounded-xl text-white placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-blue-500 pl-12 pr-12"
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: "" });
                  }}
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400 mt-1 pl-2">{errors.password}</p>}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 pt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="w-5 h-5 rounded border border-white/30 bg-white/5 group-hover:border-blue-400 flex items-center justify-center transition-colors">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 opacity-0 group-hover:opacity-100" />
                </div>
                <span className="text-[13px] font-medium text-gray-400 group-hover:text-white transition-colors">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-[13px] font-medium text-blue-400 hover:text-blue-300 hover:underline transition-colors">
                Forgot password?
              </Link>
            </div>

            {errors.general && (
              <p className="text-sm font-medium text-red-400 mt-2 p-3 bg-red-500/10 rounded-xl text-center border border-red-500/20">
                {errors.general}
              </p>
            )}

            {/* Email not verified banner */}
            {emailNotVerified && (
              <div className="mt-2 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                  <p className="text-sm font-semibold text-yellow-400">Email not verified</p>
                </div>
                <p className="text-xs text-yellow-300/70 mb-3">
                  Please verify your email before logging in. Check your inbox or resend the code.
                </p>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendingVerification}
                  className="w-full h-10 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 text-yellow-300 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RotateCcw className={`w-4 h-4 ${resendingVerification ? "animate-spin" : ""}`} />
                  {resendingVerification ? "Sending..." : "Resend Verification Email"}
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  SIGNING IN...
                </span>
              ) : (
                "SIGN IN"
              )}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-black/40 backdrop-blur-md px-2 text-gray-400">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => window.location.href = `${API_BASE_URL}/users/login/google`}
              className="w-full h-14 bg-white hover:bg-gray-100 text-gray-900 font-bold rounded-xl transition-all duration-200 shadow-lg flex items-center justify-center gap-3"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Login with Google
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-8">
            Don't have an account?{" "}
            <Link to="/signup" className="text-blue-400 font-bold hover:text-blue-300 hover:underline transition-colors">
              Create one
            </Link>
          </p>
        </div>

        {/* Right Side: Visual */}
        <div className="hidden md:flex flex-1 relative bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 overflow-hidden items-center justify-center p-12 text-center">
          {/* Animated neural network lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
            <defs>
              <linearGradient id="grad-login" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
            {Array.from({ length: 15 }).map((_, i) => (
              <motion.line
                key={i}
                x1={`${Math.random() * 100}%`}
                y1={`${Math.random() * 100}%`}
                x2={`${Math.random() * 100}%`}
                y2={`${Math.random() * 100}%`}
                stroke="url(#grad-login)"
                strokeWidth="0.5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.5 }}
                transition={{ duration: 2, delay: i * 0.1, repeat: Infinity, repeatType: "reverse" }}
              />
            ))}
          </svg>

          <div className="relative z-10 max-w-sm">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/20"
            >
              <Sparkles className="w-10 h-10 text-white" />
            </motion.div>
            <h2 className="text-3xl font-extrabold text-white mb-4 tracking-tight">
              Safety Check-In
            </h2>
            <p className="text-gray-300 leading-relaxed text-sm">
              Automated SMS check-ins with smart escalation. Stay connected with the people who matter most — gracefully and securely.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse delay-200" />
              <div className="w-2 h-2 rounded-full bg-pink-400 animate-pulse delay-400" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}