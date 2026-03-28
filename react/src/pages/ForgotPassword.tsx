import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Mail, ArrowLeft, CheckCircle2, Sparkles, AlertTriangle } from "lucide-react";
import { API_BASE_URL } from "@/lib/api-config";
import { motion } from "framer-motion";
import { AuthBackground } from "@/components/AuthBackground";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error("Please enter your email"); return; }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Request failed");
      }
      setSubmitted(true);
      toast.success("Reset link sent!");
    } catch (err: any) {
      if (err.message === "email_not_verified") {
        setError("your email is not verified");
        toast.error("your email is not verified");
      } else if (err.message === "email_not_registered") {
        setError("your email is not registered");
        toast.error("your email is not registered");
      } else {
        toast.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Success state ──────────────────────────────────────────────
  if (submitted) {
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
          <h2 className="text-3xl font-extrabold text-white mb-3 tracking-tight">Check your inbox</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-2">
            We've sent a password reset link to
          </p>
          <p className="text-blue-400 font-semibold text-sm mb-8 break-all">{email}</p>
          <p className="text-gray-500 text-xs mb-6">Didn't receive it? Check your spam folder or try again.</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setSubmitted(false)}
              className="w-full h-12 bg-white/5 border border-white/10 text-gray-300 font-semibold rounded-xl hover:bg-white/10 transition-colors text-sm"
            >
              Try another email
            </button>
            <Link to="/login">
              <button className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20">
                Back to Login
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Main form ──────────────────────────────────────────────────
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

        {/* Back link */}
        <Link
          to="/login"
          className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-6 group text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Login
        </Link>

        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Forgot Password?</h1>
        <p className="text-gray-400 text-sm mb-8">
          Enter your registered email and we'll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/10 border border-white/20 h-14 rounded-xl text-white placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-blue-500 pl-12"
            />
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400 text-sm font-medium"
            >
              <AlertTriangle className="w-5 h-5 shrink-0" />
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                SENDING...
              </span>
            ) : (
              "SEND RESET LINK"
            )}
          </button>
        </form>

        <div className="mt-8 flex justify-center">
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
            <Sparkles className="w-4 h-4 text-blue-400 opacity-40" />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}