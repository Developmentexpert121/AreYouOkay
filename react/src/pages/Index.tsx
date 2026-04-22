import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight, Shield, Clock, HeartHandshake, PhoneCall,
  CheckCircle2, Star, Bell, Users, MessageSquare, AlertTriangle, Sparkles,
  Cpu, Network, Activity, Brain, Zap, Eye, BarChart3, Radar, Gauge,
  Facebook, Instagram, Linkedin, MapPin, Menu, X
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "@/lib/api-config";
import { toast } from "sonner";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

// Animated gradient background component
const AnimatedGradient = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute w-[200%] h-[200%] -top-1/2 -left-1/2 animate-[spin_20s_linear_infinite] bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20" />
    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wNSkiLz48L3N2Zz4=')] opacity-30" />
  </div>
);

// Floating particles effect
const Particles = () => {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 10 + 5,
    delay: Math.random() * 5,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute bg-blue-400/30 rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            willChange: "transform, opacity",
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};

// Glowing text effect component
const GlowText = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <motion.span
    className={`relative inline-block ${className}`}
    animate={{
      textShadow: [
        "0 0 0px rgba(59,130,246,0)",
        "0 0 10px rgba(59,130,246,0.5)",
        "0 0 0px rgba(59,130,246,0)",
      ],
    }}
    transition={{
      duration: 2,
      repeat: Infinity,
      repeatType: "reverse",
    }}
  >
    {children}
  </motion.span>
);

export default function Index() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const heroRef = useRef<HTMLElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 100, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 100, damping: 30 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        mouseX.set((e.clientX - rect.left) / rect.width);
        mouseY.set((e.clientY - rect.top) / rect.height);
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  const savedUser = localStorage.getItem("user");
  const user = savedUser ? JSON.parse(savedUser) : null;
  const isAdmin = user?.email === "developmentexpert121@gmail.com";
  const isSubscribed = user?.subscription_status === "active";

  const handleCheckout = async (plan: 'monthly' | 'annual' = 'monthly') => {
    if (!user) {
      navigate("/login?redirect=checkout");
      return;
    }

    if (isAdmin) {
      navigate("/admin");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/stripe/create-checkout-session?user_id=${user.id}&plan=${plan}&origin=${encodeURIComponent(window.location.origin)}`, {
        method: "POST"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to start checkout");
      window.location.href = data.url;
    } catch (err: any) {
      toast.error(err.message || "Failed to navigate to checkout.");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* ── NAV (Glassmorphic) ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 10, scale: 1.1 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-center"
            >
              <img src="/final logo.png" alt="Logo" className="w-20 h-20 object-contain" />
            </motion.div>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
            <a href="#features" className="hover:text-blue-400 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-blue-400 transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-blue-400 transition-colors">Pricing</a>
            <a href="#safety-insights" className="hover:text-blue-400 transition-colors">Safety Insights</a>
          </div>
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Link to="/dashboard" className="text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white px-5 py-2.5 rounded-full hover:shadow-lg hover:shadow-blue-500/30 transition-all">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold text-gray-300 hover:text-white transition-colors px-4 py-2">
                  Log in
                </Link>
                <Link to="/signup" className="text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white px-5 py-2.5 rounded-full hover:shadow-lg hover:shadow-blue-500/30 transition-all">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black/90 backdrop-blur-xl border-t border-white/10 px-6 py-6 flex flex-col gap-6"
          >
            <a href="#features" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium text-gray-300 hover:text-blue-400 transition-colors">Features</a>
            <a href="#how-it-works" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium text-gray-300 hover:text-blue-400 transition-colors">How it works</a>
            <a href="#pricing" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium text-gray-300 hover:text-blue-400 transition-colors">Pricing</a>
            <a href="#safety-insights" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium text-gray-300 hover:text-blue-400 transition-colors">Safety Insights</a>
            <div className="flex flex-col gap-4 pt-4 border-t border-white/10">
              {user ? (
                <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className="text-center font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white px-5 py-3 rounded-xl">
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" onClick={() => setIsMenuOpen(false)} className="text-center font-semibold text-gray-300 hover:text-white px-4 py-3 border border-white/10 rounded-xl">
                    Log in
                  </Link>
                  <Link to="/signup" onClick={() => setIsMenuOpen(false)} className="text-center font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white px-5 py-3 rounded-xl">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </nav>

      {/* ── HERO (AI Neural Network Theme) ── */}
      <section ref={heroRef} className="pt-20 bg-black relative overflow-hidden">
        <AnimatedGradient />
        <Particles />

        {/* Dynamic mouse-following glow */}
        <motion.div
          className="absolute w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-3xl pointer-events-none"
          style={{
            x: useTransform(springX, [0, 1], ["-50%", "-30%"]),
            y: useTransform(springY, [0, 1], ["-50%", "-30%"]),
          }}
        />

        {/* Neural network lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
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
              stroke="url(#grad)"
              strokeWidth="0.5"
              style={{ willChange: "transform, opacity" }}
              animate={{ opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: 3 + Math.random() * 2, delay: i * 0.2, repeat: Infinity }}
            />
          ))}
        </svg>

        <div className="w-full max-w-7xl mx-auto px-8 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-12 items-center relative z-10">
          {/* LEFT — Text & CTAs */}
          <div className="flex flex-col items-center lg:items-start gap-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="w-4 h-4 text-blue-400" />
              </motion.div>
              <span className="text-white text-[11px] font-bold tracking-widest uppercase">
                r u good? <span className="text-blue-400">Safety Engine v2.0</span>
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-4xl sm:text-5xl md:text-7xl font-extrabold leading-tight text-center lg:text-left"
            >
              Your{" "}
              <GlowText className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Safety
              </GlowText>
              <br />
              Check-In
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-gray-400 text-lg leading-relaxed max-w-md text-center lg:text-left"
            >
              Feel safer now. If something happened to you today… how long would it take for someone to notice?
              With RU Good… Within hours.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              {user ? (
                <Link
                  to="/dashboard"
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold px-7 py-3.5 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all text-sm"
                >
                  Go to Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/signup"
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold px-7 py-3.5 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all text-sm"
                  >
                    Get Protected <ArrowRight className="w-4 h-4" />
                  </Link>
                </>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex items-center gap-3 pt-2"
            >
              <div className="flex -space-x-2">
                {[11, 12, 13, 14].map((i) => (
                  <img
                    key={i}
                    src={`https://i.pravatar.cc/40?img=${i}`}
                    alt="user"
                    className="w-9 h-9 rounded-full border-2 border-black/40 object-cover"
                  />
                ))}
              </div>
              <p className="text-gray-500 text-sm">
                <span className="text-white font-bold">1,000+</span> families protected daily
              </p>
            </motion.div>
          </div>

          {/* RIGHT — Enhanced Phone Mockup with AI Scanning */}
          <div className="relative flex justify-center items-center py-10">
            {/* Floating AI Cards */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="hidden xl:block absolute -left-2 sm:-left-4 top-8 bg-black/60 backdrop-blur-xl rounded-3xl p-4 shadow-2xl max-w-[140px] sm:max-w-[180px] z-10 border border-white/10"
            >
              <div className="flex items-center gap-2 mb-1">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-8 h-8 bg-emerald-500/20 rounded-xl flex items-center justify-center"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </motion.div>
                <div>
                  <p className="text-[10px] text-gray-400 font-medium">Safety Analysis</p>
                  <p className="text-xs font-bold text-white">Mum is Okay</p>
                </div>
              </div>
              <p className="text-[10px] text-gray-400">Intent: Positive (98.7%)</p>
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="hidden xl:block absolute -right-2 sm:-right-4 bottom-12 bg-black/60 backdrop-blur-xl rounded-3xl p-4 shadow-2xl max-w-[150px] sm:max-w-[190px] z-10 border border-white/10"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 bg-amber-500/20 rounded-xl flex items-center justify-center">
                  <Bell className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-xs font-bold text-white">Reminder Sent</p>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                No response in 30 min — Safety Engine dispatched reminder automatically.
              </p>
            </motion.div>

            {/* Phone with AI Scan Ring */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.4, duration: 1, ease: "easeOut" }}
              className="relative z-20 w-[180px] sm:w-[240px] md:w-[270px]"
            >
              <div className="relative">
                <motion.div
                  className="absolute inset-0 rounded-[3rem] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 blur-xl opacity-50"
                  animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <div className="relative bg-black rounded-[3rem] p-3 shadow-[0_40px_80px_rgba(0,0,0,0.5)] border border-white/10">
                  <div className="bg-gradient-to-br from-gray-900 to-black rounded-[2.4rem] overflow-hidden h-[480px] flex flex-col">
                    <div className="flex justify-between items-center px-5 pt-4 pb-2">
                      <span className="text-white text-xs font-semibold">9:41</span>
                      <div className="w-16 h-5 bg-black rounded-full mx-auto" />
                      <div className="flex gap-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-white/60" />
                        <div className="w-2.5 h-2.5 rounded-full bg-white/60" />
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-center flex-1 px-5 pb-6 text-center">
                      <motion.div
                        whileHover={{ rotate: 10, scale: 1.1 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center justify-center mb-4"
                      >
                        <img src="/final logo.png" alt="Logo" className="w-20 h-20 object-contain" />
                      </motion.div>
                      <p className="text-gray-400 text-[10px] font-semibold tracking-widest uppercase mb-1">
                        r u good?
                      </p>
                      <h3 className="text-white text-xl font-bold leading-tight mb-1">
                        Safety Check-In
                      </h3>
                      <p className="text-gray-400 text-xs mb-6">
                        Are you safe today?<br />
                        Reply to let us know.
                      </p>
                      <div className="w-full space-y-2 text-left relative">
                        {/* AI Scan Line */}
                        <motion.div
                          animate={{ top: ["0%", "100%", "0%"] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                          className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 shadow-[0_0_8px_rgba(96,165,250,0.8)] z-10 rounded-full"
                        />
                        <div className="bg-white/10 backdrop-blur rounded-2xl rounded-tl-none px-3 py-2 text-white text-[11px] max-w-[85%] border border-white/10">
                          Good morning! Are you okay today? Reply{" "}
                          <span className="font-bold text-blue-400">YES</span> or{" "}
                          <span className="font-bold text-purple-400">NO</span> 💙
                        </div>
                        <div className="flex justify-end relative">
                          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl rounded-tr-none px-3 py-2 text-white text-[11px] max-w-[55%] font-bold relative z-0">
                            YES ✓
                          </div>
                          {/* AI Analysis Tooltip */}
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 1.5 }}
                            className="absolute -bottom-6 right-2 bg-black/80 backdrop-blur border border-blue-500/30 rounded-full px-2 py-0.5 flex items-center gap-1 z-20 shadow-xl"
                          >
                            <Sparkles className="w-2.5 h-2.5 text-blue-400" />
                            <span className="text-[9px] text-blue-300 font-medium tracking-wide">
                              Positive Sentiment
                            </span>
                          </motion.div>
                        </div>
                      </div>
                    </div>
                    <div className="px-5 pb-5">
                      <div className="bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-white text-center text-xs font-semibold py-2.5 rounded-2xl border border-white/10">
                        Check-in Complete •  Logged
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── STATS (Glowing Cards) ── */}
      <section className="bg-black py-16 border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "99.9%", label: "Uptime Reliability", icon: Gauge },
            { value: "24/7", label: "Safety Monitoring", icon: Radar },
            { value: "15k+", label: "Check-ins Sent", icon: Activity },
            { value: "< 1min", label: "Alert Response", icon: Zap },
          ].map((s, i) => (
            <motion.div
              key={i}
              {...fadeUp}
              transition={{ delay: i * 0.1 }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
                <s.icon className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <p className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {s.value}
                </p>
                <p className="text-gray-400 text-sm font-medium mt-1">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── AI CAPABILITIES (Neon Cards) ── */}
      <section className="py-24 bg-black relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.1),transparent_50%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4 shadow-sm"
            >
              <Cpu className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 text-[11px] font-bold tracking-widest uppercase">
                Powered by Advanced Safety Engine
              </span>
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              Intelligence that{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                understands context.
              </span>
            </h2>
            <p className="text-gray-400 mt-4 text-lg max-w-2xl mx-auto">
              Our proprietary Safety engine  doesn't just send automated texts — it analyzes responses, detects nuanced emergencies, and routes alerts with zero latency.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Activity,
                title: "Sentiment & Tone Analysis",
                desc: "We instantly analyze incoming replies. If a loved one responds with 'I don't feel well' instead of just 'NO', the system immediately flags the check-in for emergency escalation.",
                gradient: "from-blue-500/20 to-cyan-500/20",
              },
              {
                icon: Network,
                title: "Smart Escalation Routing",
                desc: "Emergency contacts are prioritized automatically based on time of day, timezone, and historical response rates to ensure help is always reached.",
                gradient: "from-purple-500/20 to-pink-500/20",
              },
              {
                icon: Eye,
                title: "Predictive Anomaly Detection",
                desc: "By learning daily routines, our Safety Engine can detect unusual patterns in response times and proactively notify you before a missed check-in even occurs.",
                gradient: "from-green-500/20 to-emerald-500/20",
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                {...fadeUp}
                transition={{ delay: i * 0.1 }}
                className="group relative"
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg">
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS (Glass Cards) ── */}
      <section id="how-it-works" className="py-24 bg-black">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-bold tracking-widest text-blue-400 uppercase">
              How it works
            </span>
            <h2 className="text-4xl font-extrabold text-white mt-3">
              Simple. Reliable. <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Safety-Focused.</span>
            </h2>
            <p className="text-gray-400 mt-3 text-lg">
              Three steps to peace of mind for you and your family.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: MessageSquare,
                title: "Daily SMS Sent",
                desc: "Every day at your chosen time, we send a simple check-in message to the user's phone number — no app needed.",
                gradient: "from-blue-500 to-cyan-500",
              },
              {
                icon: CheckCircle2,
                title: "User Replies YES or NO",
                desc: "Just reply YES to confirm safety. If the user replies NO, your emergency contact is immediately notified.",
                gradient: "from-purple-500 to-pink-500",
              },
              {
                icon: AlertTriangle,
                title: "Smart Escalation",
                desc: "No reply? We send a reminder. Still no response? Emergency contact is alerted. All automatic — all configurable.",
                gradient: "from-orange-500 to-red-500",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                {...fadeUp}
                transition={{ delay: i * 0.15 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/0 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-white/5 backdrop-blur-sm p-10 rounded-2xl border border-white/10 hover:border-white/20 transition-all">
                  <div className={`w-14 h-14 bg-gradient-to-r ${item.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>
                    <item.icon className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-xs font-bold tracking-widest text-blue-400">
                    0{i + 1}
                  </span>
                  <h3 className="text-xl font-bold text-white mt-2 mb-3">{item.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES (Glowing Cards) ── */}
      <section id="features" className="py-24 bg-black/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-bold tracking-widest text-blue-400 uppercase">
              Features
            </span>
            <h2 className="text-4xl font-extrabold text-white mt-3">
              Everything you need to stay safe
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Clock, title: "Custom Check-in Time", desc: "Set any daily time in your local timezone. We handle everything from there.", gradient: "from-blue-500/20 to-cyan-500/20" },
              { icon: Shield, title: "Emergency Contacts", desc: "Assign a trusted person who is alerted instantly if you miss your check-in.", gradient: "from-purple-500/20 to-pink-500/20" },
              { icon: Bell, title: "Two-Step Escalation", desc: "Automatic reminder SMS first, then emergency contact alert — configurable delays.", gradient: "from-amber-500/20 to-orange-500/20" },
              { icon: PhoneCall, title: "Multi-Timezone Support", desc: "Works for users across the globe — each gets their check-in at the right local time.", gradient: "from-emerald-500/20 to-teal-500/20" },
              { icon: Users, title: "Admin Dashboard", desc: "Full visibility into all users, check-in history, missed check-ins, and alerts sent.", gradient: "from-rose-500/20 to-red-500/20" },
              { icon: MessageSquare, title: "Simple SMS Reply", desc: "No app to download. Just reply YES or NO. Couldn't be easier for any user.", gradient: "from-indigo-500/20 to-blue-500/20" },
            ].map((f, i) => (
              <motion.div
                key={i}
                {...fadeUp}
                transition={{ delay: i * 0.08 }}
                className="group relative"
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${f.gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className="relative bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:border-white/20 transition-all">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg">
                    <f.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI INSIGHTS SECTION (New) ── */}
      <section id="safety-insights" className="py-24 bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.1),transparent_70%)]" />
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4"
          >
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 text-[11px] font-bold tracking-widest uppercase">
              Real-time Safety Insights
            </span>
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
            Understand your loved ones'{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              well-being
            </span>
          </h2>
          <div className="grid md:grid-cols-2 gap-8 mt-12">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10"
            >
              <Radar className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Anomaly Detection</h3>
              <p className="text-gray-400">
                Our Safety Engine learns daily patterns and alerts you when something's off — before it becomes an emergency.
              </p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10"
            >
              <Brain className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Sentiment Analysis</h3>
              <p className="text-gray-400">
                We analyze response tones to detect stress, anxiety, or urgency — providing deeper insights.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── PRICING (Glowing Card) ── */}
      <section id="pricing" className="py-24 bg-gradient-to-br from-black via-blue-950 to-black">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <span className="text-xs font-bold tracking-widest text-blue-400 uppercase">
            Pricing
          </span>
          <h2 className="text-4xl font-extrabold text-white mt-3 mb-4">
            Simple plans. Total peace of mind.
          </h2>
          <p className="text-gray-400 text-lg mb-12">
            Choose the protective plan that fits you best.
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Monthly Plan */}
            <motion.div
              {...fadeUp}
              transition={{ delay: 0.2 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative h-full bg-black/80 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-white/10 flex flex-col">
                <p className="text-gray-400 font-semibold text-sm mb-2">
                  Monthly Protection
                </p>
                <div className="flex items-end justify-center gap-1 mb-1">
                  <span className="text-5xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    $6.99
                  </span>
                  <span className="text-gray-400 mb-2">/month</span>
                </div>
                <p className="text-gray-500 text-sm mb-8">
                  Per user. Cancel anytime.
                </p>

                <ul className="text-left space-y-3 mb-8 flex-1">
                  {[
                    "Daily automated safety check-ins",
                    "No app required - simple SMS",
                    "Instant emergency contact routing",
                    "Sentiment & safety analysis",
                    "24/7 automated monitoring",
                  ].map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleCheckout('monthly')}
                  disabled={isSubscribed && !isAdmin}
                  className={`block w-full text-center font-bold py-3.5 rounded-2xl transition-all ${isSubscribed && !isAdmin
                    ? "bg-white/10 text-gray-400 cursor-not-allowed border border-white/20"
                    : "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-xl hover:shadow-blue-500/30 cursor-pointer"
                    }`}
                >
                  {isAdmin ? "Manage Dashboard" : isSubscribed ? "Plan Active" : "Get Monthly Plan"}
                </button>
              </div>
            </motion.div>

            {/* Annual Plan */}
            <motion.div
              {...fadeUp}
              transition={{ delay: 0.3 }}
              className="relative group scale-105 z-10"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl blur-xl opacity-70 group-hover:opacity-100 transition-opacity" />
              <div className="relative h-full bg-black/90 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border-2 border-blue-500/50 flex flex-col">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                  Best Deal Ever
                </div>
                <p className="text-gray-300 font-bold text-sm mb-2 mt-2">
                  Annual Protection
                </p>
                <div className="flex items-end justify-center gap-1 mb-1">
                  <span className="text-6xl font-extrabold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                    $50
                  </span>
                  <span className="text-gray-400 mb-2">/year</span>
                </div>
                <p className="text-blue-400 text-xs font-bold mb-8 uppercase tracking-wider">
                  Save 40% vs monthly
                </p>

                <ul className="text-left space-y-3 mb-8 flex-1">
                  {[
                    "Everything in Monthly Plan",
                    "Priority emergency alerts",
                    "Guaranteed price protection",
                    "Unlimited timezone changes",
                    "Premium family support link",
                  ].map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-white">
                      <Star className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleCheckout('annual')}
                  disabled={isSubscribed && !isAdmin}
                  className={`block w-full text-center font-bold py-4 rounded-2xl transition-all ${isSubscribed && !isAdmin
                    ? "bg-white/10 text-gray-400 cursor-not-allowed border border-white/20"
                    : "bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] hover:scale-[1.02] cursor-pointer"
                    }`}
                >
                  {isAdmin ? "Manage Dashboard" : isSubscribed ? "Plan Active" : "Get Best Deal"}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── PREMIUM FOOTER ── */}
      <footer className="relative bg-[#050505] pt-24 pb-12 overflow-hidden border-t border-white/5">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-[400px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-32 mb-20">
            {/* Column 1: Brand & Identity */}
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center rotate-3">
                  <img src="/final logo.png" alt="Logo" className="w-20 h-20 object-contain" />
                </div>
              </div>

              <p className="text-gray-400 text-lg leading-relaxed max-w-md font-medium">
                Redefining personal safety through <span className="text-white">intelligent automation</span>.
                Keep your loved ones informed, always.
              </p>

              <div className="flex flex-col gap-5">
                <a
                  href="https://maps.google.com/?q=1982+Providence+Parkway,+Suite+251+Mt.+Juliet,+TN+37122"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-4 text-gray-400 hover:text-white transition-all group w-fit"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-500/10 group-hover:border-blue-500/50 transition-all">
                    <MapPin className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Headquarters</span>
                    <span className="text-sm font-semibold">1982 Providence Parkway, Mt. Juliet, TN</span>
                  </div>
                </a>

                <div className="flex gap-4 pt-2">
                  {[
                    { icon: Facebook, href: "https://www.facebook.com/MichellePriceJohnson", color: "hover:bg-blue-600/20 hover:text-blue-500" },
                    { icon: Linkedin, href: "https://www.linkedin.com/in/michellepricejohnson/", color: "hover:bg-blue-400/20 hover:text-blue-400" },
                    { icon: Instagram, href: "https://www.instagram.com/michellepricejohnson/", color: "hover:bg-pink-600/20 hover:text-pink-500" }
                  ].map((s, i) => (
                    <motion.a
                      key={i}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ y: -5, scale: 1.05 }}
                      className={`w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 transition-all ${s.color} shadow-sm backdrop-blur-md`}
                    >
                      <s.icon className="w-6 h-6" />
                    </motion.a>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 2: Success Lab & Quote */}
            <div className="space-y-10">
              <div className="space-y-8">
                <h4 className="text-white font-bold text-sm uppercase tracking-[0.2em] opacity-50">Business Vertical</h4>
                <div className="space-y-6">
                  <div className="group">
                    <h5 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-500" /> Success Lab
                    </h5>
                    <div className="flex flex-col gap-4">
                      <a href="https://successlabmj.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-2 group/link">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40 group-hover/link:bg-blue-400 transition-colors" />
                        successlabmj.com
                      </a>
                      <a href="https://michellepricejohnson.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-2 group/link">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40 group-hover/link:bg-blue-400 transition-colors" />
                        michellepricejohnson.com
                      </a>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
                    <a href="mailto:mpj@successlabhq.com" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-blue-500/10 transition-colors">
                        <MessageSquare className="w-4 h-4 text-blue-400" />
                      </div>
                      <span className="text-sm font-medium">mpj@successlabhq.com</span>
                    </a>
                    <a href="tel:6154366176" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-blue-500/10 transition-colors">
                        <PhoneCall className="w-4 h-4 text-blue-400" />
                      </div>
                      <span className="text-sm font-medium">615-436-6176 x 3</span>
                    </a>
                  </div>
                </div>
              </div>


            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <p className="text-gray-600 text-xs font-semibold tracking-wider">
                © 2026 R U GOOD?. ALL RIGHTS RESERVED.
              </p>
              <div className="hidden md:block w-[1px] h-4 bg-white/10" />
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Network Secure</span>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
                Crafted by <span className="text-gray-400">Michelle Price-Johnson</span>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
