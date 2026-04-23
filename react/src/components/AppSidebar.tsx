import {
  LayoutDashboard,
  History,
  CreditCard,
  Shield,
  LogOut,
  Lock,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import React, { useMemo, useCallback } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Check-in History", url: "/history", icon: History },
  { title: "Subscription", url: "/subscription", icon: CreditCard },
];

const adminItems = [
  { title: "Admin Panel", url: "/admin", icon: Shield },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();

  // Re-read user data from localStorage whenever the path changes to keep status synced
  const user = useMemo(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  }, [location.pathname]);

  const isAdmin = user?.email === "admin@gmail.com";
  const isSubscribed = user?.subscription_status === "active";

  const handleLogout = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    localStorage.removeItem("user");
    navigate("/login");
  }, [navigate]);

  const isActiveRoute = useCallback((url: string) => {
    return location.pathname === url;
  }, [location.pathname]);

  return (
    <Sidebar
      collapsible="offcanvas"
      className="border-r border-white/5 bg-[#030712]/80 backdrop-blur-2xl"
    >
      <SidebarContent className="px-3">
        {/* Logo Section */}
        <div className="flex items-center gap-3 px-4 py-8 mb-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="relative"
          >
            <div className="absolute -inset-2 bg-blue-500/20 blur-xl rounded-full" />
            <img
              src="/final logo.png"
              alt="Logo"
              className="w-12 h-12 object-contain relative z-10"
            />
          </motion.div>
          <div className="flex flex-col relative z-10">
            <span className="text-white font-black text-xl tracking-tighter leading-none">r u good?</span>
            <span className="text-[10px] text-blue-400/80 font-bold uppercase tracking-[0.2em] mt-1">AI Safety</span>
          </div>
        </div>

        <div className="space-y-6">
          {!isAdmin && (
            <SidebarGroup className="p-0">
              <SidebarGroupLabel className="px-4 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-4 opacity-70">
                Main Menu
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <TooltipProvider>
                  <SidebarMenu className="gap-2">
                    {mainItems.map((item) => {
                      const isRestricted = !isSubscribed && !isAdmin && (item.url === "/dashboard" || item.url === "/history");
                      const isActive = isActiveRoute(item.url);

                      // Subscription tab is always accessible
                      const isSubscriptionTab = item.url === "/subscription";
                      const showLockStyle = isRestricted && !isActive;

                      return (
                        <SidebarMenuItem key={item.title}>
                          {isRestricted && !isSubscriptionTab ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="w-full">
                                  <SidebarMenuButton
                                    asChild
                                    className="h-12 rounded-xl px-0 relative group"
                                  >
                                    <NavLink
                                      to="#"
                                      end
                                      className={`flex w-full items-center gap-4 px-4 py-3 rounded-xl transition-all relative overflow-hidden cursor-not-allowed ${showLockStyle
                                          ? "bg-white/5 text-gray-400 border border-white/10"
                                          : ""
                                        }`}
                                      onClick={(e) => e.preventDefault()}
                                    >
                                      <>
                                        <item.icon className={`h-5 w-5 relative z-10 ${showLockStyle ? "text-gray-500" : "text-gray-400"}`} />
                                        <span className={`flex-1 relative z-10 font-bold tracking-wide ${showLockStyle ? "text-gray-500" : "text-gray-300"}`}>
                                          {item.title}
                                        </span>
                                        <Lock className="h-3.5 w-3.5 relative z-10 text-yellow-500/70" />
                                      </>
                                    </NavLink>
                                  </SidebarMenuButton>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent
                                side="top"
                                sideOffset={8}
                                className="bg-[#0f0f1e]/95 backdrop-blur-xl border border-blue-500/20 text-white font-medium px-4 py-2 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                              >
                                <div className="flex items-center gap-2">
                                  <Lock className="h-3 w-3 text-yellow-400" />
                                  <span>Please purchase a plan to access this feature.</span>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <SidebarMenuButton
                              asChild
                              className="h-12 rounded-xl px-0 relative group"
                            >
                              <NavLink
                                to={item.url}
                                end
                                className="flex w-full items-center h-full"
                              >
                                {({ isActive }) => (
                                  <div className={`flex w-full items-center gap-4 px-4 py-3 rounded-xl transition-all relative overflow-hidden h-full ${isActive
                                      ? "bg-gradient-to-r from-blue-600/20 to-transparent text-white border-l-2 border-blue-500 shadow-lg"
                                      : "text-gray-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10"
                                    }`}>
                                    {isActive && (
                                      <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-transparent to-transparent"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.2 }}
                                      />
                                    )}
                                    <item.icon className={`h-5 w-5 relative z-10 transition-all duration-200 ${isActive ? "text-blue-400" : "text-gray-400 group-hover:text-gray-200"}`} />
                                    <span className={`flex-1 relative z-10 font-bold tracking-wide transition-all duration-200 ${isActive ? "text-white" : "text-gray-300 group-hover:text-white"}`}>
                                      {item.title}
                                    </span>
                                    {isActive && (
                                      <motion.div
                                        layoutId="activeIndicator"
                                        className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-blue-500 rounded-full"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ duration: 0.2 }}
                                      />
                                    )}
                                  </div>
                                )}
                              </NavLink>
                            </SidebarMenuButton>
                          )}
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </TooltipProvider>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {isAdmin && (
            <SidebarGroup className="p-0">
              <SidebarGroupLabel className="px-4 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-4 opacity-70">
                Administrator
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-2">
                  {adminItems.map((item) => {
                    const isActive = isActiveRoute(item.url);

                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          className="h-12 rounded-xl px-0 relative group"
                        >
                          <NavLink
                            to={item.url}
                            end
                            className={`flex w-full items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden ${isActive
                                ? "bg-gradient-to-r from-purple-600/20 to-transparent text-white border-l-2 border-purple-500 shadow-lg"
                                : "text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent hover:border-white/10"
                              }`}
                          >
                            <>
                              {isActive && (
                                <motion.div
                                  layoutId="activeTabAdmin"
                                  className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-transparent"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ duration: 0.2 }}
                                />
                              )}
                              <item.icon className={`h-5 w-5 relative z-10 transition-all duration-200 ${isActive ? "text-purple-400" : "group-hover:text-purple-400/70"}`} />
                              <span className="flex-1 relative z-10 tracking-tight font-semibold">{item.title}</span>
                              {isActive && (
                                <motion.div
                                  layoutId="activeIndicatorAdmin"
                                  className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-purple-500 rounded-full"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ duration: 0.2 }}
                                />
                              )}
                            </>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </div>
      </SidebarContent>

      <SidebarFooter className="p-6 border-t border-white/5 bg-black/20">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="h-12 rounded-xl px-4 hover:bg-rose-500/5 hover:text-rose-400 group transition-all duration-300 border border-transparent hover:border-rose-500/20"
            >
              <a
                href="#"
                onClick={handleLogout}
                className="flex items-center gap-4 font-semibold text-gray-400 group-hover:text-rose-400"
              >
                <LogOut className="h-5 w-5 flex-shrink-0 transition-transform group-hover:-translate-x-1" />
                <span className="tracking-tight">Sign Out</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}