import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Lock, CheckCircle2, Eye, EyeOff, ArrowLeft, ShieldCheck } from "lucide-react";
import { API_BASE_URL } from "@/lib/api-config";
import { motion } from "framer-motion";
import { AuthBackground } from "@/components/AuthBackground";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});

  useEffect(() => {
    if (!token) {
      toast.error("Invalid or missing reset link. Please request a new one.");
      navigate("/forgot-password");
    }
  }, [token, navigate]);

  const validate = () => {
    const errs: typeof errors = {};
    if (password.length < 8) errs.password = "Password must be at least 8 characters";
    if (password !== confirmPassword) errs.confirm = "Passwords do not match";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Reset failed. The link may have expired.");
      }

      setCompleted(true);
      toast.success("Password updated successfully!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Success state ──────────────────────────────────────────────
  if (completed) {
    return (
      <div className="min-h-screen bg-[#080818] flex items-center justify-center p-4 relative overflow-hidden">
        <AuthBackground />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-10 text-center relative z-10"
        >
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </motion.div>
          <h2 className="text-3xl font-extrabold text-white mb-3 tracking-tight">Password Updated!</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            Your password has been successfully reset. You can now sign in with your new password.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full h-14 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/25"
          >
            GO TO LOGIN
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Main reset form ────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#080818] flex items-center justify-center p-4 relative overflow-hidden">
      <AuthBackground />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 md:p-12 relative z-10"
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <motion.div whileHover={{ rotate: 10, scale: 1.1 }} transition={{ duration: 0.3 }}>
            <img src="/final logo.png" alt="Logo" className="w-20 h-20 object-contain" />
          </motion.div>
        </div>

        {/* Icon + header */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-blue-500/25"
          >
            <ShieldCheck className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Set New Password</h1>
          {email && (
            <p className="text-gray-400 text-sm mt-2">
              Resetting password for <span className="text-blue-400 font-semibold">{email}</span>
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* New Password */}
          <div className="space-y-1">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="New Password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors({ ...errors, password: "" }); }}
                className="bg-white/10 border border-white/20 h-14 rounded-xl text-white placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-blue-500 pl-12 pr-12"
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
            {errors.password && <p className="text-xs text-red-400 pl-2">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setErrors({ ...errors, confirm: "" }); }}
                className="bg-white/10 border border-white/20 h-14 rounded-xl text-white placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-blue-500 pl-12"
              />
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            {errors.confirm && <p className="text-xs text-red-400 pl-2">{errors.confirm}</p>}
          </div>

          {/* Password strength hint */}
          {password.length > 0 && (
            <div className="flex gap-1 px-1">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    password.length >= (i + 1) * 3
                      ? password.length >= 12 ? "bg-emerald-500" : password.length >= 8 ? "bg-blue-500" : "bg-yellow-500"
                      : "bg-white/10"
                  }`}
                />
              ))}
              <span className="text-xs text-gray-500 ml-2 self-center">
                {password.length < 8 ? "Weak" : password.length < 12 ? "Good" : "Strong"}
              </span>
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
                UPDATING...
              </span>
            ) : (
              "RESET PASSWORD"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/forgot-password" className="inline-flex items-center text-gray-500 hover:text-gray-300 text-sm transition-colors gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Request a new reset link
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
