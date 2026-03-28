import { useMemo, memo } from "react";
import { motion } from "framer-motion";

// Particle data is generated ONCE (outside render) so Math.random() never
// runs during re-renders, preventing Framer Motion animation restarts.
const PARTICLE_DATA = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  width: Math.random() * 3 + 1,
  height: Math.random() * 3 + 1,
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  duration: Math.random() * 8 + 6,
  delay: Math.random() * 4,
}));

/**
 * Shared background for all auth pages (Login, Signup, ForgotPassword, etc.)
 * Uses memo + stable particle data to prevent unnecessary re-renders.
 */
export const AuthBackground = memo(function AuthBackground() {
  return (
    <>
      {/* Single subtle gradient using CSS only - no JS animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute -top-1/4 -left-1/4 w-[60vw] h-[60vw] bg-blue-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 w-[60vw] h-[60vw] bg-purple-600/15 rounded-full blur-3xl" />
      </div>

      {/* Particles - 12 instead of 20, with stable data so framer-motion doesn't restart */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        {PARTICLE_DATA.map((p) => (
          <motion.div
            key={p.id}
            className="absolute bg-blue-400/25 rounded-full"
            style={{ width: p.width, height: p.height, left: p.left, top: p.top, willChange: "transform, opacity" }}
            animate={{ y: [0, -25, 0], opacity: [0, 0.4, 0] }}
            transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "linear" }}
          />
        ))}
      </div>
    </>
  );
});
