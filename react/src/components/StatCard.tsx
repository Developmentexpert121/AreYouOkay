import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  variant?: "default" | "success" | "warning" | "danger";
}

const variantStyles = {
  default: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  danger: "bg-red-500/10 text-red-400 border-red-500/20",
};

export function StatCard({ title, value, icon: Icon, description, variant = "default" }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] transition-all duration-300 hover:border-white/20 hover:-translate-y-1 shadow-lg shadow-black/20"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-gray-400 font-semibold tracking-wide uppercase">{title}</p>
          <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
          {description && (
            <p className="text-xs text-gray-500 font-medium">{description}</p>
          )}
        </div>
        <div className={`p-4 rounded-2xl border transition-transform duration-300 hover:scale-110 hover:rotate-3 ${variantStyles[variant]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
}
