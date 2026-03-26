import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Clock, AlertTriangle, ArrowRight, ShieldCheck, Siren, MapPin, Phone, User as UserIcon, Save, Loader2, Brain, Sparkles } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api-config";

const timezones = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "Europe/London", "Europe/Paris", "Asia/Tokyo", "Asia/Dubai", "Australia/Sydney"
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const [profileForm, setProfileForm] = useState({
    phone_number: "",
    timezone: "UTC",
    check_in_time: "09:00",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_name_2: "",
    emergency_contact_phone_2: ""
  });

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (!savedUser) {
      navigate("/login");
      return;
    }
    const usr = JSON.parse(savedUser);
    setUser(usr);
    setProfileForm({
      phone_number: usr.phone_number || "",
      timezone: usr.timezone || "UTC",
      check_in_time: usr.check_in_time || "09:00",
      emergency_contact_name: usr.emergency_contact_name || "",
      emergency_contact_phone: usr.emergency_contact_phone || "",
      emergency_contact_name_2: usr.emergency_contact_name_2 || "",
      emergency_contact_phone_2: usr.emergency_contact_phone_2 || ""
    });

    // Check for Stripe session success
    const query = new URLSearchParams(window.location.search);
    const sessionId = query.get("session_id");
    if (sessionId) {
      fetch(`${API_BASE_URL}/stripe/verify-session?session_id=${sessionId}`)
        .then(res => res.json())
        .then(data => {
          if (data.status === "success" && data.user) {
            localStorage.setItem("user", JSON.stringify(data.user));
            setUser(data.user);
            toast.success("Subscribed successfully! Welcome to Pro.");
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        })
        .catch(err => console.error("Session verification failed", err));
    }

    fetch(`${API_BASE_URL}/users/${usr.id}/checkins`)
      .then(res => res.json())
      .then(data => {
        setCheckins(data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [navigate]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm)
      });
      if (!res.ok) throw new Error("Failed to update profile");
      const updatedUser = await res.json();
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const isProfileIncomplete = !user?.phone_number || !user?.emergency_contact_name || !user?.emergency_contact_phone;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayCheckin = checkins.find(c => c.scheduled_for?.startsWith(todayStr));
  const checkedInToday = todayCheckin?.status === "completed";

  const recentActivity = checkins.slice(0, 5).map(c => {
    const dateObj = new Date(c.scheduled_for);
    return {
      date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: c.status
    };
  });

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
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

      <div className="relative z-10 max-w-6xl mx-auto space-y-12 pb-12 pt-8 px-4 md:px-6">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  AreYouOkay<span className="text-white"></span>
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                Welcome back, <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{user?.name?.split(" ")[0]}</span>
              </h1>
              <p className="text-gray-400 text-lg mt-2">
                {isProfileIncomplete ? "Please complete your profile to enable all features." : "Everything looks good. You're doing great!"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                <span className="text-sm font-bold text-blue-400">System Secure</span>
              </div>
            </div>
          </div>
        </motion.header>

        <AnimatePresence>
          {isProfileIncomplete && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-400 shadow-lg">
                    <UserIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Complete Your Profile</h2>
                    <p className="text-sm text-gray-400">We need a few more details to set up your check-ins.</p>
                  </div>
                </div>

                <form onSubmit={handleProfileSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Your Phone</label>
                    <div className="relative">
                      <Input
                        placeholder="+1 (555) 000-0000"
                        value={profileForm.phone_number}
                        onChange={(e) => setProfileForm({ ...profileForm, phone_number: e.target.value })}
                        className="h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400 rounded-xl pl-10 font-medium focus-visible:ring-1 focus-visible:ring-blue-500"
                      />
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Time Zone</label>
                    <Select value={profileForm.timezone} onValueChange={(v) => setProfileForm({ ...profileForm, timezone: v })}>
                      <SelectTrigger className="h-12 bg-white/10 border-white/20 text-white rounded-xl font-medium">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent className="bg-black/90 backdrop-blur-xl border-white/10 text-white">
                        {timezones.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Check-in Time</label>
                    <div className="relative">
                      <Input
                        type="time"
                        value={profileForm.check_in_time}
                        onChange={(e) => setProfileForm({ ...profileForm, check_in_time: e.target.value })}
                        className="h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400 rounded-xl pl-10 font-medium focus-visible:ring-1 focus-visible:ring-blue-500"
                      />
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Emergency contact name</label>
                    <div className="relative">
                      <Input
                        placeholder="Name"
                        value={profileForm.emergency_contact_name}
                        onChange={(e) => setProfileForm({ ...profileForm, emergency_contact_name: e.target.value })}
                        className="h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400 rounded-xl pl-10 font-medium focus-visible:ring-1 focus-visible:ring-blue-500"
                      />
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Emergency contact phone</label>
                    <div className="relative">
                      <Input
                        placeholder="Phone"
                        value={profileForm.emergency_contact_phone}
                        onChange={(e) => setProfileForm({ ...profileForm, emergency_contact_phone: e.target.value })}
                        className="h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400 rounded-xl pl-10 font-medium focus-visible:ring-1 focus-visible:ring-blue-500"
                      />
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Contact 2 Name (Opt)</label>
                    <Input placeholder="Secondary Name" value={profileForm.emergency_contact_name_2} onChange={(e) => setProfileForm({ ...profileForm, emergency_contact_name_2: e.target.value })} className="h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400 rounded-xl px-4 font-medium" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Contact 2 Phone (Opt)</label>
                    <Input placeholder="Secondary Phone" value={profileForm.emergency_contact_phone_2} onChange={(e) => setProfileForm({ ...profileForm, emergency_contact_phone_2: e.target.value })} className="h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400 rounded-xl px-4 font-medium" />
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl gap-2 shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all disabled:opacity-50" disabled={updatingProfile}>
                      {updatingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Details
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero Action Card */}
        {!isProfileIncomplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`relative overflow-hidden p-8 rounded-2xl border ${checkedInToday
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-blue-500/10 border-blue-500/30'
              } backdrop-blur-sm`}
          >
            <div className="absolute top-0 right-0 p-32 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-110 ${checkedInToday
                  ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  }`}>
                  {checkedInToday ? <CheckCircle2 className="w-8 h-8" /> : <Clock className="w-8 h-8" />}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {checkedInToday ? "You're all set for today!" : "Check-in Required"}
                  </h2>
                  <p className="text-gray-400 mt-1">
                    {checkedInToday
                      ? "Next check-in scheduled for tomorrow morning."
                      : `Please confirm your wellness. Next scheduled: ${user?.check_in_time || "Morning"}`}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Activity List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
          >
            <div className="p-8 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div>
                <h3 className="text-xl font-bold text-white">Recent History</h3>
                <p className="text-sm text-gray-400">Your activity trail</p>
              </div>
              <Button variant="ghost" className="text-blue-400 font-bold hover:text-blue-300 hover:bg-white/10" onClick={() => navigate("/history")}>
                View Full Log
              </Button>
            </div>
            <div className="divide-y divide-white/10">
              {recentActivity.length > 0 ? recentActivity.map((activity, i) => (
                <div
                  key={i}
                  className="px-8 py-6 flex items-center justify-between hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activity.status === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/20 text-rose-400'
                      }`}>
                      {activity.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-white">{activity.date}</p>
                      <p className="text-xs text-gray-400">{activity.time}</p>
                    </div>
                  </div>
                  <StatusBadge status={activity.status === "completed" ? "success" : "danger"}>
                    {activity.status === "completed" ? "Completed" : "Missed"}
                  </StatusBadge>
                </div>
              )) : (
                <div className="p-12 text-center text-gray-400">No recent activity found.</div>
              )}
            </div>
          </motion.div>

          {/* Emergency Contacts Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 flex flex-col gap-6"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-rose-500/20 rounded-2xl flex items-center justify-center text-rose-400 shadow-lg">
                <Siren className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Escalation</h3>
                <p className="text-sm text-gray-400">Emergency contact</p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              {user?.emergency_contact_name ? (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white">{user.emergency_contact_name}</p>
                    <p className="text-xs text-gray-400">{user.emergency_contact_phone}</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" title="Verified" />
                </div>
              ) : (
                <div className="p-12 text-center text-gray-400 bg-white/5 rounded-2xl border border-dashed border-white/10">
                  No contact set
                </div>
              )}
            </div>

            <Button
              variant="outline"
              className="w-full h-12 rounded-xl border-white/20 bg-white/5 text-white font-bold hover:bg-white/10 transition-all mt-auto"
              onClick={() => navigate("/profile")}
            >
              Manage Contacts
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}