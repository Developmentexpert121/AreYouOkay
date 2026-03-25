import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { User, Shield, Upload, Trash2, Camera, Globe, Clock, Phone, Heart, Loader2, Brain } from "lucide-react";
import { API_BASE_URL } from "@/lib/api-config";
import { useRef } from "react";

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone_number: "",
    timezone: "",
    check_in_time: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_name_2: "",
    emergency_contact_phone_2: "",
    reminder_delay_minutes: 30,
    escalation_delay_minutes: 60,
  });

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      setFormData({
        name: parsed.name || "",
        phone_number: parsed.phone_number || "",
        timezone: parsed.timezone || "UTC",
        check_in_time: parsed.check_in_time || "09:00",
        emergency_contact_name: parsed.emergency_contact_name || "",
        emergency_contact_phone: parsed.emergency_contact_phone || "",
        emergency_contact_name_2: parsed.emergency_contact_name_2 || "",
        emergency_contact_phone_2: parsed.emergency_contact_phone_2 || "",
        reminder_delay_minutes: parsed.reminder_delay_minutes ?? 30,
        escalation_delay_minutes: parsed.escalation_delay_minutes ?? 60,
      });
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to update profile");
      }

      const updatedUser = await res.json();
      const mergedUser = { ...user, ...updatedUser };
      localStorage.setItem("user", JSON.stringify(mergedUser));
      setUser(mergedUser);

      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    const data = new FormData();
    data.append("file", file);

    try {
      const res = await fetch(`${API_BASE_URL}/users/${user.id}/avatar`, {
        method: "POST",
        body: data,
      });

      if (!res.ok) throw new Error("Failed to upload avatar");

      const updatedUser = await res.json();
      const mergedUser = { ...user, ...updatedUser };
      localStorage.setItem("user", JSON.stringify(mergedUser));
      setUser(mergedUser);
      toast.success("Profile picture updated!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAvatarRemove = async () => {
    setUploadingAvatar(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users/${user.id}/avatar`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to remove avatar");

      const updatedUser = await res.json();
      const mergedUser = { ...user, ...updatedUser };
      localStorage.setItem("user", JSON.stringify(mergedUser));
      setUser(mergedUser);
      toast.success("Profile picture removed!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (!user) return null;

  const isAdmin = user.email === "developmentexpert121@gmail.com";

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-16 pt-8 px-4 md:px-6 relative z-10 w-full">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            {isAdmin ? <Shield className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-white" />}
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            AreYouOkay<span className="text-white"></span>
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
          Profile Settings
        </h1>
        <p className="text-gray-400 text-lg mt-2">Maintain your safety settings and contact information here.</p>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 text-center rounded-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-32 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

            <div className="relative inline-block group z-10">
              <div className="w-32 h-32 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-4xl font-bold text-gray-400 overflow-hidden ring-4 ring-white/10 shadow-xl border border-white/20">
                {user.profile_picture ? (
                  <img src={`${API_BASE_URL}${user.profile_picture}`} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  user.name.charAt(0)
                )}
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-6 right-0 w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform border-4 border-black"
              >
                <Camera className="w-5 h-5" />
              </button>
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleAvatarUpload} />
            </div>

            <h3 className="text-2xl font-bold text-white tracking-tight relative z-10">{user.name}</h3>
            <p className="text-blue-400 font-bold text-sm uppercase tracking-wider mt-1 relative z-10">{isAdmin ? "Administrator" : "Member"}</p>

            <div className="mt-8 pt-8 border-t border-white/10 space-y-4 text-left relative z-10">
              <div className="flex items-center gap-3 text-gray-400">
                <Globe className="w-5 h-5 text-blue-400" />
                <span className="text-sm font-medium">{formData.timezone}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <Clock className="w-5 h-5 text-purple-400" />
                <span className="text-sm font-medium">Checks at {formData.check_in_time}</span>
              </div>
            </div>

            {user.profile_picture && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAvatarRemove}
                className="mt-6 text-rose-400 hover:text-white hover:bg-rose-500/20 font-bold relative z-10 w-full rounded-xl"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Remove Photo
              </Button>
            )}
          </motion.div>

          <div className="bg-white/5 backdrop-blur-sm p-6 border border-white/10 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-16 bg-blue-500/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
            <div className="flex gap-4 items-center relative z-10">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 shadow-sm">
                <Shield className="w-5 h-5" />
              </div>
              <p className="text-sm text-white font-bold">Encrypted & Private</p>
            </div>
            <p className="text-xs text-gray-400 mt-3 leading-relaxed relative z-10">Your contact data is never shared with third parties. It is strictly used for emergency escalation only.</p>
          </div>
        </div>

        {/* Forms Section */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-2xl shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 p-32 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl -ml-16 -mt-16 pointer-events-none" />
            <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 shadow-sm border border-blue-500/20">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-wide">Personal Details</h3>
                    <p className="text-sm text-gray-400">Update your basic information</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-gray-400 font-bold text-xs uppercase tracking-wider">Full Display Name</label>
                    <Input id="name" value={formData.name} onChange={handleChange} className="h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-blue-500 rounded-xl" required />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-gray-400 font-bold text-xs uppercase tracking-wider">Email Address</label>
                    <Input id="email" type="email" value={user.email} disabled className="h-12 bg-white/5 border-white/10 text-gray-500 cursor-not-allowed rounded-xl" />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="phone_number" className="text-gray-400 font-bold text-xs uppercase tracking-wider">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input id="phone_number" value={formData.phone_number} onChange={handleChange} className="h-12 pl-11 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-blue-500 rounded-xl" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="timezone" className="text-gray-400 font-bold text-xs uppercase tracking-wider">Timezone</label>
                    <select id="timezone" value={formData.timezone} onChange={handleChange} className="flex h-12 w-full rounded-xl border border-white/20 bg-black/50 px-3 py-2 text-sm text-white focus:border-blue-500 focus:ring-blue-500/20 focus-visible:outline-none ring-offset-background disabled:cursor-not-allowed disabled:opacity-50">
                      {["UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "Europe/London", "Europe/Paris", "Asia/Tokyo", "Asia/Dubai", "Australia/Sydney"].map(tz => (
                        <option key={tz} value={tz} className="bg-black text-white">{tz}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label htmlFor="check_in_time" className="text-gray-400 font-bold text-xs uppercase tracking-wider">Scheduled Check-in Window</label>
                    <div className="relative max-w-xs">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input id="check_in_time" type="time" value={formData.check_in_time} onChange={handleChange} className="h-12 pl-11 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-blue-500 rounded-xl" required />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">We will ping you daily at this time for a status update.</p>
                  </div>



                </div>
              </div>

              {!isAdmin && (
                <div className="space-y-6 pt-8 border-t border-white/10">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 bg-rose-500/20 rounded-xl flex items-center justify-center text-rose-400 shadow-sm border border-rose-500/20">
                      <Heart className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white tracking-wide">Emergency Support</h3>
                      <p className="text-sm text-gray-400">Escalation contacts if you miss a check-in</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="emergency_contact_name" className="text-gray-400 font-bold text-xs uppercase tracking-wider">Primary Contact Name</label>
                      <Input id="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleChange} className="h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-blue-500 rounded-xl" required />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="emergency_contact_phone" className="text-gray-400 font-bold text-xs uppercase tracking-wider">Contact Direct Line</label>
                      <Input id="emergency_contact_phone" value={formData.emergency_contact_phone} onChange={handleChange} placeholder="+1234567890" className="h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-blue-500 rounded-xl" required />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                    <div className="space-y-2">
                      <label htmlFor="emergency_contact_name_2" className="text-gray-400 font-bold text-xs uppercase tracking-wider">Second Contact Name (Optional)</label>
                      <Input id="emergency_contact_name_2" value={formData.emergency_contact_name_2} onChange={handleChange} className="h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-blue-500 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="emergency_contact_phone_2" className="text-gray-400 font-bold text-xs uppercase tracking-wider">Second Contact Line</label>
                      <Input id="emergency_contact_phone_2" value={formData.emergency_contact_phone_2} onChange={handleChange} placeholder="+1234567890" className="h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-blue-500 rounded-xl" />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-6 flex justify-end border-t border-white/10">
                <Button type="submit" disabled={loading} className="h-14 px-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/25 disabled:opacity-50">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                  {loading ? "Optimizing..." : "Save Settings"}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
