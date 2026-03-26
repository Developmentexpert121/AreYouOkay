import { useState, useEffect } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Loader2, History, Filter, Calendar, Search, RotateCcw } from "lucide-react";
import { API_BASE_URL } from "@/lib/api-config";

function getStatusBadge(status: string) {
  switch (status) {
    case "YES":
      return <StatusBadge status="success">Confirmed</StatusBadge>;
    case "NO":
      return <StatusBadge status="warning">Rejected</StatusBadge>;
    case "Missed":
      return <StatusBadge status="danger">Time Elapsed</StatusBadge>;
    default:
      return <StatusBadge status="neutral">{status}</StatusBadge>;
  }
}

export default function CheckinHistory() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const savedUser = localStorage.getItem("user");
        if (!savedUser) return;
        const user = JSON.parse(savedUser);

        const res = await fetch(`${API_BASE_URL}/users/${user.id}/checkins`);
        if (res.ok) {
          const data = await res.json();
          const formatted = data.map((item: any) => {
            const dateObj = new Date(item.scheduled_for);
            return {
              id: item.id,
              date: dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
              rawDate: dateObj.toISOString().split('T')[0],
              time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: item.status === "completed" ? "YES" : item.status === "missed" ? "Missed" : "NO"
            };
          });
          setHistoryData(formatted);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const filtered = historyData.filter((item) => {
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    if (dateFrom && item.rawDate < dateFrom) return false;
    if (dateTo && item.rawDate > dateTo) return false;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-16 pt-8 px-4 md:px-6 relative z-10 w-full">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <History className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            r u g o o d?<span className="text-white"></span>
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
          Safety History
        </h1>
        <p className="text-gray-400 text-lg mt-2">Review and analyze your historical check-in data and safety logs.</p>
      </motion.header>

      <div className="space-y-8">
        {/* Filters Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-32 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-gray-400 border border-white/20">
              <Filter className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Advanced Filters</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end relative z-10">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Start Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-11 pl-10 bg-white/10 border-white/20 text-white rounded-xl focus:ring-1 focus:ring-blue-500 focus-visible:ring-offset-0 focus:border-blue-500 shadow-sm"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">End Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-11 pl-10 bg-white/10 border-white/20 text-white rounded-xl focus:ring-1 focus:ring-blue-500 focus-visible:ring-offset-0 focus:border-blue-500 shadow-sm"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Status Type</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-11 bg-white/10 border-white/20 text-white rounded-xl focus:ring-1 focus:ring-blue-500 focus-visible:ring-offset-0 focus:border-blue-500 shadow-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border border-white/10 text-white rounded-xl shadow-2xl backdrop-blur-xl">
                  <SelectItem value="all" className="focus:bg-white/10 focus:text-white">All Check-ins</SelectItem>
                  <SelectItem value="YES" className="focus:bg-white/10 focus:text-white">Confirmed</SelectItem>
                  <SelectItem value="NO" className="focus:bg-white/10 focus:text-white">Rejected</SelectItem>
                  <SelectItem value="Missed" className="focus:bg-white/10 focus:text-white">Missed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              disabled={!statusFilter && !dateFrom && !dateTo}
              className="h-11 border-white/20 bg-transparent hover:bg-white/10 text-gray-300 rounded-xl font-bold text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              onClick={() => { setStatusFilter("all"); setDateFrom(""); setDateTo(""); }}
            >
              <RotateCcw className="w-4 h-4 mr-2" /> Reset
            </Button>
          </div>
        </motion.div>

        {/* Data Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
        >
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center text-gray-400 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500/50" />
              <p className="font-bold text-sm uppercase tracking-widest">Synchronizing records...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center">
              <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-gray-500 shadow-inner">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">No Records Found</h3>
              <p className="text-gray-500 font-medium max-w-xs mx-auto mb-6">We couldn't find any check-ins matching your selected filters.</p>
              <Button
                variant="link"
                className="text-blue-400 font-bold uppercase tracking-widest hover:text-blue-300"
                onClick={() => { setStatusFilter("all"); setDateFrom(""); setDateTo(""); }}
              >
                Clear all filters
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-10 py-5">Date</th>
                    <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-10 py-5 text-center">Safety Status</th>
                    <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-10 py-5">Recorded Time</th>
                    <th className="text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest px-10 py-5">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-transparent">
                  {filtered.map((row, i) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + (i * 0.03) }}
                      className="hover:bg-white/5 transition-colors group"
                    >
                      <td className="px-10 py-6 text-sm text-white font-bold">{row.date}</td>
                      <td className="px-10 py-6 text-center">
                        <div className="inline-flex">
                          {getStatusBadge(row.status)}
                        </div>
                      </td>
                      <td className="px-10 py-6 text-sm text-gray-400 font-medium">{row.time}</td>
                      <td className="px-10 py-6 text-right">
                        <button className="p-2.5 rounded-xl hover:bg-white/10 hover:shadow-md text-gray-500 hover:text-blue-400 transition-all border border-transparent hover:border-white/10">
                          <Search className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
