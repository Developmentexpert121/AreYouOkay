import { useState, useEffect } from "react";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Users, UserCheck, AlertTriangle, Eye, ArrowLeft,
  CheckCircle2, XCircle, Bell, ShieldAlert, Brain, Trash2, PauseCircle, PlayCircle, PhoneCall
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api-config";

const API = API_BASE_URL;

type AlertLog = {
  id: number;
  user_id: number;
  checkin_id: number | null;
  alert_type: string;
  contact_name: string | null;
  contact_phone: string | null;
  message_body: string | null;
  sent_at: string;
  success: boolean;
};

const ALERT_LABELS: Record<string, { label: string; color: string }> = {
  reminder: { label: "Reminder to User", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  emergency_no: { label: "Emergency (NO reply)", color: "text-red-400 bg-red-500/10 border-red-500/20" },
  emergency_missed: { label: "Emergency (Missed)", color: "text-red-500 bg-red-500/20 border-red-500/30" },
  voice_call: { label: "Voice Call to User", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  emergency_voice: { label: "Emergency SMS (Pressed 2)", color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
  emergency_voice_call: { label: "Voice Call to Contact", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  emergency_contact_acknowledged: { label: "Contact Acknowledged", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  false_alarm_resolution: { label: "False Alarm — Resolved", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
};

export default function Admin() {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userHistory, setUserHistory] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<AlertLog[]>([]);
  const [missedCheckins, setMissedCheckins] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"users" | "alerts" | "missed">("users");
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    Promise.all([
      fetch(`${API}/users/admin/all`).then(r => r.json()).catch(() => []),
      fetch(`${API}/users/admin/alerts`).then(r => r.json()).catch(() => []),
    ]).then(([usersData, alertsData]) => {
      setUsers(usersData || []);
      setAlerts(alertsData || []);
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (selectedUser?.id) {
      fetch(`${API}/users/${selectedUser.id}/checkins`)
        .then(r => r.json())
        .then(data => {
          const mapped = (data || []).map((c: any) => ({
            date: new Date(c.scheduled_for).toLocaleDateString(),
            time: new Date(c.scheduled_for).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            status: c.status,
            reminder_sent: c.reminder_sent,
          }));
          setUserHistory(mapped);
          setMissedCheckins(mapped.filter((c: any) =>
            ["missed", "voice_called", "emergency_called", "emergency_acknowledged"].includes(c.status)
          ));
        });
    }
  }, [selectedUser]);

  const handleSuspend = async (user: any) => {
    const action = user.status === "active" ? "suspend" : "unsuspend";
    if (!window.confirm(`Are you sure you want to ${action} ${user.name}?`)) return;
    try {
      const res = await fetch(`${API}/users/${user.id}/suspend`, { method: "PUT" });
      if (!res.ok) throw new Error("Failed");
      toast.success(`User ${action}ed successfully`);
      fetchData();
    } catch {
      toast.error(`Failed to ${action} user`);
    }
  };

  const handleDelete = async (user: any) => {
    if (!window.confirm(`Permanently delete ${user.name}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API}/users/${user.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("User deleted successfully");
      if (selectedUser?.id === user.id) setSelectedUser(null);
      fetchData();
    } catch {
      toast.error("Failed to delete user");
    }
  };

  // User-specific alerts
  const userAlerts = selectedUser
    ? alerts.filter(a => a.user_id === selectedUser.id)
    : [];

  if (selectedUser) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 relative z-10 w-full pt-8 px-4 md:px-6 pb-16">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <Button variant="ghost" className="gap-2 text-gray-400 hover:text-white hover:bg-white/10" onClick={() => setSelectedUser(null)}>
            <ArrowLeft className="w-4 h-4" /> Back to users
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-32 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10 mb-6">
            <h2 className="text-3xl font-bold text-white">{selectedUser.name}</h2>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                className={`gap-2 font-bold border ${selectedUser.status === "active" ? "text-amber-400 border-amber-500/30 hover:bg-amber-500/10" : "text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"}`}
                onClick={() => handleSuspend(selectedUser)}
              >
                {selectedUser.status === "active" ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                {selectedUser.status === "active" ? "Suspend" : "Unsuspend"}
              </Button>
              <Button size="sm" variant="ghost" className="gap-2 text-red-400 border border-red-500/30 hover:bg-red-500/10 font-bold" onClick={() => handleDelete(selectedUser)}>
                <Trash2 className="w-4 h-4" /> Delete User
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm relative z-10">
            <div className="bg-white/5 p-4 rounded-xl border border-white/10"><span className="block text-gray-400 mb-1">Phone:</span> <span className="font-semibold text-white text-base">{selectedUser.phone}</span></div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10"><span className="block text-gray-400 mb-1">Timezone:</span> <span className="font-semibold text-white text-base">{selectedUser.timezone}</span></div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10"><span className="block text-gray-400 mb-1">Check-ins:</span> <span className="font-semibold text-white text-base">{selectedUser.checkins}</span></div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10"><span className="block text-gray-400 mb-1">Missed:</span> <span className="font-semibold text-white text-base">{selectedUser.missed}</span></div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Check-in History */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
            <div className="p-6 border-b border-white/10 bg-white/5 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-white text-lg">Check-in History</h3>
            </div>
            <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto">
              {userHistory.length === 0 && <div className="p-8 text-center text-gray-500">No check-in history yet.</div>}
              {userHistory.map((h, i) => (
                <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    {h.status === "completed" ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : h.status === "reminded" ? (
                      <Bell className="w-5 h-5 text-amber-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                    <div>
                      <span className="font-medium text-white">{h.date}</span>
                      <span className="ml-2 text-xs capitalize px-2 py-0.5 rounded-full bg-white/10 text-gray-300">{h.status}</span>
                    </div>
                  </div>
                  <span className="text-gray-400 text-sm">{h.time}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Alerts Sent to Contact */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
            <div className="p-6 border-b border-white/10 bg-white/5 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              <h3 className="font-bold text-white text-lg">Alerts Sent to Contact</h3>
            </div>
            <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto">
              {userAlerts.length === 0 && <div className="p-8 text-center text-gray-500">No alerts triggered for this user.</div>}
              {userAlerts.map((a) => {
                const meta = ALERT_LABELS[a.alert_type] ?? { label: a.alert_type, color: "text-gray-400 bg-white/10 border-white/10" };
                return (
                  <div key={a.id} className="px-6 py-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${meta.color}`}>{meta.label}</span>
                      <span className={`text-xs font-medium ${a.success ? "text-emerald-400" : "text-red-400"}`}>
                        {a.success ? "✓ Sent" : "✗ Failed"}
                      </span>
                    </div>
                    {a.contact_name && (
                      <p className="text-sm text-gray-300 mt-1">
                        To: <span className="font-medium text-white">{a.contact_name}</span>
                        {a.contact_phone && <span className="text-gray-500 ml-1">({a.contact_phone})</span>}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">{new Date(a.sent_at).toLocaleString()}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 relative z-10 w-full pt-8 px-4 md:px-6 pb-16">
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            r u good?<span className="text-white">.admin</span>
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2 text-white">System Command</h1>
        <p className="text-lg text-gray-400">Manage users and monitor overall system activity.</p>
      </motion.header>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard title="Total Users" value={users.length} icon={Users} variant="default" />
        <StatCard title="Active Users" value={users.filter(u => u.status === "active").length} icon={UserCheck} variant="success" />
        <StatCard title="Total Missed" value={users.reduce((s, u) => s + u.missed, 0)} icon={AlertTriangle} variant="warning" />
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10">
        <button
          onClick={() => setActiveTab("users")}
          className={`px-5 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${activeTab === "users" ? "border-blue-500 text-blue-400" : "border-transparent text-gray-500 hover:text-gray-300"}`}
        >
          <Users className="w-4 h-4 inline mr-2" />Users
        </button>
        <button
          onClick={() => setActiveTab("missed")}
          className={`px-5 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${activeTab === "missed" ? "border-amber-500 text-amber-400" : "border-transparent text-gray-500 hover:text-gray-300"}`}
        >
          <PhoneCall className="w-4 h-4 inline mr-2" />
          Missed Check-ins
          {users.reduce((s, u) => s + u.missed, 0) > 0 && (
            <span className="ml-2 text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">{users.reduce((s, u) => s + u.missed, 0)}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("alerts")}
          className={`px-5 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${activeTab === "alerts" ? "border-red-500 text-red-500" : "border-transparent text-gray-500 hover:text-gray-300"}`}
        >
          <ShieldAlert className="w-4 h-4 inline mr-2" />
          Alerts Sent to Contacts
          {alerts.length > 0 && (
            <span className="ml-2 text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">{alerts.length}</span>
          )}
        </button>
      </div>

      {/* Users Table */}
      {activeTab === "users" && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
          <div className="absolute top-0 left-0 p-32 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="overflow-x-auto relative z-10">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-8 py-5">Name</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-8 py-5">Phone</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-8 py-5 hidden sm:table-cell">Timezone</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-8 py-5">Status</th>
                  <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-8 py-5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((user, i) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.04 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-8 py-5 text-sm font-medium text-white">{user.name}</td>
                    <td className="px-8 py-5 text-sm text-gray-400">{user.phone}</td>
                    <td className="px-8 py-5 text-sm text-gray-400 hidden sm:table-cell">{user.timezone}</td>
                    <td className="px-8 py-5">
                      <StatusBadge status={user.status === "active" ? "success" : "danger"}>
                        {user.status === "active" ? "Active" : "Inactive"}
                      </StatusBadge>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" className="gap-1 text-gray-400 hover:text-blue-400 hover:bg-white/5" onClick={() => setSelectedUser(user)}>
                          <Eye className="w-4 h-4" /> View
                        </Button>
                        <Button variant="ghost" size="sm" className={`gap-1 ${user.status === "active" ? "text-amber-400 hover:bg-amber-500/10" : "text-emerald-400 hover:bg-emerald-500/10"}`} onClick={() => handleSuspend(user)}>
                          {user.status === "active" ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                          {user.status === "active" ? "Suspend" : "Activate"}
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-1 text-red-400 hover:bg-red-500/10" onClick={() => handleDelete(user)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && <div className="py-16 text-center text-gray-500 text-lg">No users found.</div>}
          </div>
        </motion.div>
      )}

      {/* Missed Check-ins Tab */}
      {activeTab === "missed" && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
          <div className="overflow-x-auto relative z-10">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">User</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Phone</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Missed Count</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Sub Status</th>
                  <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.filter(u => u.missed > 0).map((user, i) => (
                  <motion.tr key={user.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-white">{user.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{user.phone}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-red-400">{user.missed} missed</span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={user.status === "active" ? "success" : "danger"}>
                        {user.status === "active" ? "Active" : "Inactive"}
                      </StatusBadge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" className="gap-1 text-gray-400 hover:text-blue-400 hover:bg-white/5" onClick={() => setSelectedUser(user)}>
                        <Eye className="w-4 h-4" /> View History
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {users.filter(u => u.missed > 0).length === 0 && <div className="py-16 text-center text-gray-500 text-lg">No missed check-ins recorded.</div>}
          </div>
        </motion.div>
      )}

      {/* Global Alerts Table */}
      {activeTab === "alerts" && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
          <div className="absolute top-0 right-0 p-32 bg-gradient-to-r from-red-500/5 to-purple-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="overflow-x-auto relative z-10">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Type</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">User</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Contact</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Sent At</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {alerts.map((a, i) => {
                  const meta = ALERT_LABELS[a.alert_type] ?? { label: a.alert_type, color: "text-gray-400 bg-white/10 border-white/10" };
                  const user = users.find(u => u.id === a.user_id);
                  return (
                    <motion.tr key={a.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${meta.color}`}>{meta.label}</span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-white">{user?.name ?? `User #${a.user_id}`}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {a.contact_name && <span className="font-medium text-gray-300">{a.contact_name}</span>}
                        {a.contact_phone && <span className="text-gray-500 ml-1 text-xs">({a.contact_phone})</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(a.sent_at).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${a.success ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"}`}>
                          {a.success ? "✓ Sent" : "✗ Failed"}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
            {alerts.length === 0 && <div className="py-16 text-center text-gray-500 text-lg">No alerts have been sent yet.</div>}
          </div>
        </motion.div>
      )}
    </div>
  );
}
