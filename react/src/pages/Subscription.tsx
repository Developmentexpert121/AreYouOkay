import { useState, useEffect } from "react";
import { Check, CreditCard, ShieldCheck, Zap, Star, Crown, Loader2, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { StatusBadge } from "@/components/StatusBadge";
import { API_BASE_URL } from "@/lib/api-config";
import { motion } from "framer-motion";

const features = [
  "Unlimited automated check-ins",
  "Instant SMS & Email escalation",
  "Multi-contact emergency routing",
  "Detailed daily AI activity logs",
  "Priority 24/7 technical support",
];

export default function Subscription() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const isSubscribed = user?.subscription_status === "active";

  const handleSubscribe = async () => {
    if (!user) {
      toast.error("Please login first");
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/stripe/create-checkout-session?user_id=${user.id}`, {
        method: "POST"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to start checkout");
      window.location.href = data.url;
    } catch (err: any) {
      toast.error(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && !isSubscribed) {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get("checkout") === "true") {
        window.history.replaceState({}, document.title, window.location.pathname);
        handleSubscribe();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isSubscribed]);


  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel your subscription? You will lose access to all Pro features immediately.")) return;
    setCancelling(true);
    try {
      const res = await fetch(`${API_BASE_URL}/stripe/cancel-subscription?user_id=${user.id}`, {
        method: "POST"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to cancel subscription");
      const updatedUser = { ...user, subscription_status: "inactive", stripe_subscription_id: null };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      toast.success("Subscription cancelled successfully.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-16 pt-8 px-4 md:px-6 relative z-10 w-full">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            AreYouOkay<span className="text-white"></span>
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
          Billing & Plans
        </h1>
        <p className="text-gray-400 text-lg mt-2">Manage your subscription and premium safety features.</p>
      </motion.header>

      {isSubscribed ? (
        // ==========================================
        // ACTIVE SUBSCRIPTION VIEW
        // ==========================================
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-xl border border-blue-500/30 rounded-3xl p-8 md:p-12 relative overflow-hidden group shadow-[0_0_40px_rgba(59,130,246,0.15)]"
        >
          {/* Animated Glow */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-blue-500/20 via-purple-500/10 to-transparent rounded-full blur-3xl -mr-40 -mt-40 pointer-events-none" />

          <div className="flex flex-col lg:flex-row gap-12 relative z-10 items-center justify-between">
            <div className="flex-1 space-y-6 w-full">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-widest border border-blue-500/30 shadow-sm shadow-blue-500/20">
                <Crown className="w-3.5 h-3.5" /> Premium Plan Active
              </div>

              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-white">
                You're fully protected.
              </h2>

              <p className="text-gray-400 text-lg leading-relaxed max-w-xl">
                Your automated safety engine is active. You have access to unlimited check-ins, instant voice call escalation, and multi-contact routing.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-8 border-t border-white/10">
                {features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/30">
                      <Check className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full lg:w-80 flex flex-col justify-center gap-6 p-8 bg-black/60 rounded-[2rem] border border-white/10 backdrop-blur-md shadow-2xl">
              <div className="flex items-center gap-4 border-b border-white/10 pb-6 mb-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Status</p>
                  <p className="text-lg font-bold text-emerald-400 leading-none">active</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Next Billing</span>
                  <span className="font-bold text-white">Auto-renews</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Amount</span>
                  <span className="font-bold text-white">$200.00 / mo</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full h-12 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-300 font-bold gap-2 transition-all mt-4"
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {cancelling ? "Processing..." : "Cancel Subscription"}
              </Button>
            </div>
          </div>
        </motion.div>

      ) : (

        // ==========================================
        // UPGRADE / PRICING VIEW
        // ==========================================
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* Current Basic Plan Overview */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4">
                <StatusBadge status="warning">Basic Plan</StatusBadge>
              </div>

              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 mt-2">Your Account</p>
              <h3 className="text-2xl font-bold text-white mb-6">Current Status</h3>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm bg-white/10 text-gray-400 border border-white/20">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-tighter">Active Plan</p>
                    <p className="text-sm font-bold text-white">Free Basic Plan</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-blue-500/10 rounded-2xl border border-blue-500/20 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-500/20 rounded-full blur-xl pointer-events-none" />
                <div className="flex gap-3 items-center mb-3 relative z-10">
                  <ShieldCheck className="w-5 h-5 text-blue-400" />
                  <p className="text-sm font-bold text-blue-400">Limited Coverage</p>
                </div>
                <p className="text-xs text-blue-300/70 leading-relaxed relative z-10">
                  You are currently unmonitored. Upgrade to Pro for full-scale AI emergency escalation and scheduled check-ins.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Pro Plan Card */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-8 md:p-12 relative overflow-hidden group shadow-[0_0_30px_rgba(59,130,246,0.15)] hover:border-blue-500/50 transition-all duration-300"
            >
              <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-[100px] group-hover:bg-blue-500/30 transition-colors pointer-events-none" />

              <div className="flex flex-col md:flex-row justify-between gap-12 relative z-10">
                <div className="flex-1 space-y-8">
                  <div>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold uppercase tracking-widest mb-6 border border-blue-500/30 shadow-sm">
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" /> Recommended Pro Plan
                    </div>
                    <h2 className="text-5xl font-extrabold tracking-tighter text-white">
                      <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">$200</span>
                      <span className="text-xl font-medium text-gray-400">/mo</span>
                    </h2>
                    <p className="text-gray-400 font-medium mt-4 leading-relaxed max-w-sm">
                      Complete peace of mind for you and your loved ones with our advanced automated AI safety engine.
                    </p>
                  </div>

                  <ul className="space-y-4">
                    {features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-4 text-sm font-medium text-gray-300">
                        <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/30 shadow-sm">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="w-full md:w-80 flex flex-col justify-center gap-6 p-8 bg-black/60 rounded-[2rem] border border-white/10 backdrop-blur-md shadow-2xl">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl mx-auto flex items-center justify-center border border-white/10 mb-4 shadow-inner">
                      <CreditCard className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Secure Checkout</p>
                    <p className="text-xs text-gray-400 font-medium">Encrypted by Stripe API</p>
                  </div>

                  <Button
                    className="h-14 w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-200 shadow-[0_0_20px_rgba(59,130,246,0.4)] disabled:opacity-50 text-lg gap-3 group-hover:shadow-[0_0_30px_rgba(59,130,246,0.6)]"
                    onClick={handleSubscribe}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                    Upgrade to Pro
                  </Button>

                  <p className="text-[10px] text-center text-gray-500 font-bold leading-relaxed px-4">
                    Cancel anytime with one click in your dashboard.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}
