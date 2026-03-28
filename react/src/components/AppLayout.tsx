import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet, useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import { API_BASE_URL } from "@/lib/api-config";

export function AppLayout() {
  const navigate = useNavigate();
  const savedUser = localStorage.getItem("user");
  const user = savedUser ? JSON.parse(savedUser) : null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#080818] overflow-hidden relative">
        {/* Static gradient orbs - CSS only, no JS animation, no repaints */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/8 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-16 flex items-center justify-between px-6 sticky top-0 z-20 bg-[#080818]/80 backdrop-blur-md border-b border-white/10">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-xl" />
                <div className="h-5 w-px bg-white/20" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest hidden sm:block">
                  r u good?
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-px h-7 bg-white/20" />
                <button
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-3 p-1 pl-1 pr-3 rounded-2xl border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all group"
                >
                  <div className="w-8 h-8 rounded-xl bg-white/10 overflow-hidden">
                    {user?.profile_picture ? (
                      <img src={`${API_BASE_URL}${user.profile_picture}`} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-bold text-white leading-none hidden sm:block">{user?.name || "User"}</p>
                </button>
              </div>
            </header>

            <main className="flex-1 p-6 md:p-10 overflow-auto relative z-10">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}