import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet, useNavigate } from "react-router-dom";
import { Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { API_BASE_URL } from "@/lib/api-config";

export function AppLayout() {
  const navigate = useNavigate();
  const savedUser = localStorage.getItem("user");
  const user = savedUser ? JSON.parse(savedUser) : null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-black overflow-hidden relative">
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

        <div className="relative z-10 flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-20 flex items-center justify-between px-8 sticky top-0 z-20 bg-black/40 backdrop-blur-xl border-b border-white/10">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-xl" />
                <div className="h-6 w-px bg-white/20" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest hidden sm:block">
                  AreYouOkay
                </p>
              </div>

              <div className="flex items-center gap-4">
                {/* Optional notification bell */}
                {/* <Button variant="ghost" size="icon" className="w-11 h-11 text-gray-400 hover:text-white relative hover:bg-white/10 rounded-2xl transition-all">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-3 right-3 w-2 h-2 bg-blue-500 border-2 border-black rounded-full shadow-sm shadow-blue-500/20" />
                </Button> */}

                <div className="w-px h-8 bg-white/20 mx-1" />

                <button
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-3 p-1 pl-1 pr-3 rounded-2xl border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all group"
                >
                  <div className="w-9 h-9 rounded-xl bg-white/10 overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                    {user?.profile_picture ? (
                      <img src={`${API_BASE_URL}${user.profile_picture}`} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 bg-white/5">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-bold text-white leading-none">{user?.name || "User"}</p>
                  </div>
                </button>
              </div>
            </header>

            <main className="flex-1 p-8 md:p-12 overflow-auto custom-scrollbar relative z-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <Outlet />
              </motion.div>
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}