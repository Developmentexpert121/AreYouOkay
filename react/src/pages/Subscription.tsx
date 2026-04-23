import { useState, useEffect } from "react";
import { Check, CreditCard, ShieldCheck, Zap, Star, Crown, Loader2, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { StatusBadge } from "@/components/StatusBadge";
import { API_BASE_URL } from "@/lib/api-config";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const features = [
  "Unlimited automated check-ins",
  "Instant SMS & Email escalation",
  "Multi-contact emergency routing",
  "Detailed daily AI activity logs",
  "Priority 24/7 technical support",
];

export default function Subscription() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<'monthly' | 'annual' | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const isSubscribed = user?.subscription_status === "active";

  const handleSubscribe = async (plan: 'monthly' | 'annual' = 'monthly') => {
    if (!user) {
      toast.error("Please login first");
      navigate("/login");
      return;
    }

    const yearlyLink = "https://buy.stripe.com/5kQfZh1LD2HAc3G8fN7Zu01";
    const monthlyLink = "https://buy.stripe.com/cNicN58a14PI6Jm2Vt7Zu00";
    const targetLink = plan === 'annual' ? yearlyLink : monthlyLink;

    setLoading(plan);
    // Append client_reference_id so our webhook can attribute the payment to the user
    const finalUrl = `${targetLink}?client_reference_id=${user.id}&prefilled_email=${encodeURIComponent(user.email)}`;
    window.location.href = finalUrl;
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const sessionId = searchParams.get("session_id");

    if (sessionId) {
      const verifySession = async () => {
        setLoading('monthly');
        try {
          const res = await fetch(`${API_BASE_URL}/stripe/verify-session?session_id=${sessionId}`);
          const data = await res.json();
          if (data.status === "success") {
            const updatedUser = { ...user, ...data.user };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setUser(updatedUser);
            toast.success("Subscription activated! Redirecting to dashboard...");
            setTimeout(() => navigate("/dashboard"), 1500);
          } else {
            toast.error("Payment verification pending or failed.");
          }
        } catch (err) {
          console.error("Verification error:", err);
          toast.error("Failed to verify subscription status.");
        } finally {
          setLoading(null);
          // Clear query params
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      };

      if (user) {
        verifySession();
      }
    } else if (user && !isSubscribed) {
      if (searchParams.get("checkout") === "true") {
        window.history.replaceState({}, document.title, window.location.pathname);
        handleSubscribe();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isSubscribed]);


  const handleCancel = async () => {
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
            r u good?<span className="text-white"></span>
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
          style={{ willChange: "transform, opacity" }}
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
                  <span className="font-bold text-white">
                    {user?.plan_type === 'annual' ? '$50 / yr' : '$6.99 / mo'}
                  </span>
                </div>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-12 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-300 font-bold gap-2 transition-all mt-4"
                    disabled={cancelling}
                  >
                    {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {cancelling ? "Processing..." : "Cancel Subscription"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-[#0f0f1e]/95 backdrop-blur-xl border border-white/10 text-white rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl font-bold tracking-tight">Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-400 text-base">
                      You will lose access to all Pro features immediately. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="mt-6 gap-3">
                    <AlertDialogCancel className="h-12 rounded-xl bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white transition-all">
                      Keep Subscription
                    </AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleCancel}
                      className="h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all shadow-lg shadow-red-600/20"
                    >
                      Yes, Cancel Subscription
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </motion.div>

      ) : (

        // ==========================================
        // UPGRADE / PRICING VIEW
        // ==========================================
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch">
          {/* Monthly Plan Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-white/20 transition-all flex flex-col"
            style={{ willChange: "transform, opacity" }}
          >
            <div className="space-y-6 flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-gray-400 text-[10px] font-bold uppercase tracking-widest border border-white/10">
                Monthly Plan
              </div>
              <div>
                <h2 className="text-4xl font-extrabold text-white">
                  $6.99<span className="text-sm font-medium text-gray-500">/mo</span>
                </h2>
                <p className="text-gray-400 text-sm mt-2 font-medium">Standard protection for daily safety.</p>
              </div>

              <ul className="space-y-3">
                {features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm font-medium text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/20">
                      <Check className="w-3 h-3" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <Button
              className="mt-8 h-12 w-full bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all border border-white/10"
              onClick={() => handleSubscribe('monthly')}
              disabled={loading !== null}
            >
              {loading === 'monthly' ? <Loader2 className="w-4 h-4 animate-spin" /> : "Choose Monthly"}
            </Button>
          </motion.div>

          {/* Annual Plan Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur-xl border border-blue-500/40 rounded-3xl p-8 relative overflow-hidden group hover:border-blue-500/60 transition-all flex flex-col shadow-[0_0_50px_rgba(59,130,246,0.1)]"
            style={{ willChange: "transform, opacity" }}
          >
            <div className="absolute top-0 right-0 p-6">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                Best Deal Ever
              </div>
            </div>

            <div className="space-y-6 flex-1 pt-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold uppercase tracking-widest border border-blue-500/30">
                Annual Plan
              </div>
              <div>
                <h2 className="text-5xl font-extrabold text-white">
                  $50<span className="text-sm font-medium text-gray-500">/yr</span>
                </h2>
                <p className="text-blue-400 text-sm mt-2 font-bold uppercase tracking-wide">Save 40% annually</p>
              </div>

              <ul className="space-y-3">
                {[
                  "Everything in Monthly Plan",
                  "Priority emergency alerts",
                  "Guaranteed price protection",
                  "Unlimited timezone changes",
                  "Premium safety support link",
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm font-medium text-white">
                    <div className="w-5 h-5 rounded-full bg-blue-500/30 flex items-center justify-center text-blue-300 shrink-0 border border-blue-500/40 shadow-sm">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <Button
              className="mt-8 h-14 w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] scale-[1.02]"
              onClick={() => handleSubscribe('annual')}
              disabled={loading !== null}
            >
              {loading === 'annual' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Crown className="w-5 h-5 mr-2" />}
              Get Annual Plan
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
