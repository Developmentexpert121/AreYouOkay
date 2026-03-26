import {
  LayoutDashboard,
  History,
  CreditCard,
  Shield,
  LogOut,
  CheckCircle2,
  Brain,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
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
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isAdmin = user?.email === "developmentexpert121@gmail.com";
  const isSubscribed = user?.subscription_status === "active";


  const isActive = (path: string) => location.pathname === path;

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
    navigate("/login");
  };

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-white/10 bg-black/40 backdrop-blur-xl"
    >
      <SidebarContent>
        <div className="p-6 flex items-center gap-3">
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20"
          >
            <Brain className="w-6 h-6 text-white" />
          </motion.div>
          {!collapsed && (
            <span className="font-bold text-white text-lg tracking-tight">
              r u good?
            </span>
          )}
        </div>

        <div className="px-3 py-2">
          {!isAdmin && (
            <SidebarGroup>
              <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                Main Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1">
                  {mainItems.map((item) => {
                    const isRestricted = !isSubscribed && !isAdmin && (item.url === "/dashboard" || item.url === "/history");
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive(item.url)}
                          disabled={isRestricted}
                          className={`h-11 rounded-xl px-4 transition-all ${isRestricted 
                            ? "opacity-50 grayscale pointer-events-none cursor-not-allowed" 
                            : "hover:bg-white/10 hover:text-white"
                          } ${isActive(item.url)
                            ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.3)]"
                            : "text-gray-300"
                          }`}
                        >
                          <NavLink
                            to={isRestricted ? "#" : item.url}
                            end
                            className="flex w-full items-center gap-3 font-medium"
                            activeClassName="!bg-gradient-to-r !from-blue-500/20 !to-purple-500/20 !text-white !border !border-blue-500/30"
                          >
                            <item.icon
                              className={`h-5 w-5 ${isActive(item.url)
                                ? "text-blue-400"
                                : "text-gray-400 group-hover:text-white"
                                }`}
                            />
                            {!collapsed && <span>{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {isAdmin && (
            <SidebarGroup>
              <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                Central Control
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1">
                  {adminItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.url)}
                        className={`h-11 rounded-xl px-4 transition-all hover:bg-white/10 hover:text-white ${isActive(item.url)
                          ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.3)]"
                          : "text-gray-300"
                          }`}
                      >
                        <NavLink
                          to={item.url}
                          end
                          className="flex w-full items-center gap-3 font-medium"
                          activeClassName="!bg-gradient-to-r !from-blue-500/20 !to-purple-500/20 !text-white !border !border-blue-500/30"
                        >
                          <item.icon
                            className={`h-5 w-5 ${isActive(item.url)
                              ? "text-blue-400"
                              : "text-gray-400 group-hover:text-white"
                              }`}
                          />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </div>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-white/10">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="h-11 rounded-xl px-4 hover:bg-rose-500/20 hover:text-rose-400 group transition-colors text-gray-300"
            >
              <a
                href="#"
                onClick={handleLogout}
                className="flex items-center gap-3 font-medium"
              >
                <LogOut className="h-5 w-5 text-gray-400 group-hover:text-rose-400 transition-colors" />
                {!collapsed && <span>Sign Out</span>}
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}