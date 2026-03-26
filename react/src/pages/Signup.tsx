import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/api-config";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Mail, Lock, User, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect } from "react";

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const error = searchParams.get("error");
    if (error) {
      toast.error(error.replace(/_/g, " "));
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    if (errors[e.target.id]) {
      setErrors({ ...errors, [e.target.id]: "" });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Full name is required";

    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Valid email is required";

    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters";

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please correctly fill out all required fields");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/users/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Registration failed");
      }
      const user = await res.json();
      localStorage.setItem("user", JSON.stringify(user));

      toast.success("Account created successfully!");

      const searchParams = new URLSearchParams(window.location.search);
      const redirect = searchParams.get("redirect");

      if (user.subscription_status === "active") {
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

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[200%] h-[200%] -top-1/2 -left-1/2 animate-[spin_20s_linear_infinite] bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wNSkiLz48L3N2Zz4=')] opacity-30" />
      </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-blue-400/30 rounded-full"
            style={{
              width: Math.random() * 3 + 1,
              height: Math.random() * 3 + 1,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 5,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "linear",
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-4xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative z-10"
      >
        {/* Left Side: Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative">
          {/* Branding */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <motion.div
              whileHover={{ rotate: 10, scale: 1.1 }}
              transition={{ duration: 0.3 }}
              className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shadow-xl"
            >
              <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
            </motion.div>
            <span className="text-3xl font-extrabold text-white tracking-tight">
              r u good?
            </span>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Create Account</h1>
            <p className="text-gray-400 text-sm mt-2">Join us for daily peace of mind</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Field */}
            <div className="space-y-2">
              <div className="relative">
                <Input
                  id="name"
                  type="text"
                  placeholder="Full name"
                  value={formData.name}
                  onChange={handleChange}
                  className="bg-white/10 border border-white/20 h-14 rounded-xl text-white placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-blue-500 pl-12"
                />
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              {errors.name && <p className="text-xs text-red-400 mt-1 pl-2">{errors.name}</p>}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-white/10 border border-white/20 h-14 rounded-xl text-white placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-blue-500 pl-12"
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              {errors.email && <p className="text-xs text-red-400 mt-1 pl-2">{errors.email}</p>}
            </div>

            {/* Password and Confirm Password in a grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Password Field */}
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    className="bg-white/10 border border-white/20 h-14 rounded-xl text-white placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-blue-500 pl-12 pr-12"
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                {errors.password && <p className="text-xs text-red-400 mt-1 pl-2">{errors.password}</p>}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="bg-white/10 border border-white/20 h-14 rounded-xl text-white placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-blue-500 pl-12 pr-12"
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                {errors.confirmPassword && <p className="text-xs text-red-400 mt-1 pl-2">{errors.confirmPassword}</p>}
              </div>
            </div>

            {/* Show passwords toggle */}
            <div className="flex justify-end px-1">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[13px] font-medium text-blue-400 hover:text-blue-300 flex items-center gap-2 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showPassword ? "Hide passwords" : "Show passwords"}
              </button>
            </div>

            {errors.general && (
              <p className="text-sm font-medium text-red-400 mt-2 p-3 bg-red-500/10 rounded-xl text-center border border-red-500/20">
                {errors.general}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  CREATING ACCOUNT...
                </span>
              ) : (
                "CREATE ACCOUNT"
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
              Google
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-8">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-400 font-bold hover:text-blue-300 hover:underline transition-colors">
              Sign In
            </Link>
          </p>
        </div>

        {/* Right Side: AI Visual */}
        <div className="hidden md:flex flex-1 relative bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 overflow-hidden items-center justify-center p-12 text-center">
          {/* Animated neural network lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
            <defs>
              <linearGradient id="grad-signup" x1="0%" y1="0%" x2="100%" y2="100%">
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
                stroke="url(#grad-signup)"
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
              Join the AI Safety Network
            </h2>
            <p className="text-gray-300 leading-relaxed text-sm">
              Get started with intelligent check-ins, automated escalation, and peace of mind for you and your loved ones.
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