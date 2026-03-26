import { motion } from "framer-motion";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  iconOnly?: boolean;
}

export function Logo({ className = "", showText = true, size = "md", iconOnly = false }: LogoProps) {
  const sizes = {
    sm: { container: "w-8 h-8", icon: "w-5 h-5", text: "text-sm" },
    md: { container: "w-10 h-10", icon: "w-6 h-6", text: "text-xl" },
    lg: { container: "w-16 h-16", icon: "w-10 h-10", text: "text-3xl" },
  };

  const currentSize = sizes[size];

  const logoIcon = (
    <motion.div
      whileHover={{ rotate: 10, scale: 1.05 }}
      transition={{ duration: 0.3 }}
      className={`${currentSize.container} rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20`}
    >
      <img 
        src="/logo.png" 
        alt="AreYouOkay Logo" 
        className={`${currentSize.icon} object-contain brightness-0 invert`} 
      />
    </motion.div>
  );

  if (iconOnly) return logoIcon;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {logoIcon}
      {showText && (
        <span className={`font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent ${currentSize.text}`}>
          r u good?
        </span>
      )}
    </div>
  );
}
