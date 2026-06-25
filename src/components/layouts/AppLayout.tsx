import React, { useState } from "react"
import { NavLink, useNavigate, Outlet } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import { RootState } from "@/app/store"
import { clearCredentials } from "@/features/auth/slices/authSlice"
import { authService } from "@/features/auth/services/authService"
import { useToast } from "@/components/ui/toast"
import { Badge } from "@/components/ui/badge"
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  History, 
  LogOut, 
  User, 
  Menu, 
  X,
  CreditCard,
  AlertTriangle
} from "lucide-react"

export const AppLayout: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useSelector((state: RootState) => state.auth);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      dispatch(clearCredentials());
      toast({
        title: "Session ended",
        description: "You have been logged out successfully.",
        type: "success",
      });
      navigate("/login");
    }
  };

  const getRoleBadgeVariant = (roleName: string | undefined) => {
    if (roleName === "ADMIN") return "default";
    if (roleName === "FINANCE_MANAGER") return "success";
    return "warning";
  };

  const formatRoleName = (roleName: string | undefined) => {
    if (!roleName) return "";
    return roleName.replace("_", " ");
  };

  // Generate dynamic links based on user's role
  const navigationItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
      roles: ["ADMIN", "FINANCE_MANAGER", "FINANCE_ASSOCIATE"],
    },
    {
      name: "Disputes",
      roles: ["FINANCE_MANAGER", "FINANCE_ASSOCIATE"],
      icon: AlertTriangle,
      children: [
        { name: "Disputes Dashboard", path: "/disputes", roles: ["FINANCE_MANAGER", "FINANCE_ASSOCIATE"] },
        { name: "Open Disputes", path: "/disputes/open", roles: ["FINANCE_MANAGER", "FINANCE_ASSOCIATE"] },
        { name: "My Assigned Disputes", path: "/disputes/assigned", roles: ["FINANCE_ASSOCIATE"] },
        { name: "Escalated Disputes", path: "/disputes/escalated", roles: ["FINANCE_MANAGER"] },
        { name: "SLA Breaches", path: "/disputes/open?sla=breached", roles: ["FINANCE_MANAGER"] },
        { name: "Review Queue", path: "/disputes/review-queue", roles: ["FINANCE_MANAGER", "FINANCE_ASSOCIATE"] },
        { name: "Waiting Customer", path: "/disputes/waiting-customer", roles: ["FINANCE_MANAGER", "FINANCE_ASSOCIATE"] },
        { name: "Waiting Internal Team", path: "/disputes/waiting-internal", roles: ["FINANCE_MANAGER", "FINANCE_ASSOCIATE"] },
        { name: "Team Disputes", path: "/disputes/open?team=true", roles: ["FINANCE_MANAGER"] },
        { name: "Dispute Cases", path: "/disputes/cases", roles: ["FINANCE_MANAGER", "FINANCE_ASSOCIATE"] },
      ],
    },
    {
      name: "User Management",
      path: "/users",
      icon: Users,
      roles: ["ADMIN"],
    },
    {
      name: "Invoices",
      roles: ["FINANCE_ASSOCIATE"],
      icon: FileText,
      children: [
        { name: "Upload Invoices", path: "/invoice-upload", roles: ["FINANCE_ASSOCIATE"] },
        { name: "Invoice List", path: "/invoices", roles: ["FINANCE_ASSOCIATE"] },
      ],
    },
    {
      name: "Payments",
      roles: ["FINANCE_ASSOCIATE"],
      icon: CreditCard,
      children: [
        { name: "Upload Payments", path: "/payment-upload", roles: ["FINANCE_ASSOCIATE"] },
        { name: "Upload History", path: "/payment-upload-history", roles: ["FINANCE_ASSOCIATE"] },
        { name: "Matching Reviews", path: "/payment-reviews", roles: ["FINANCE_ASSOCIATE"] },
      ],
    },
    {
      name: "Collections",
      roles: ["FINANCE_MANAGER", "FINANCE_ASSOCIATE"],
      icon: History,
      children: [
        { name: "Collections Dashboard", path: "/collections", roles: ["FINANCE_MANAGER", "FINANCE_ASSOCIATE"] },
        { name: "Open Cases", path: "/collections/open", roles: ["FINANCE_MANAGER", "FINANCE_ASSOCIATE"] },
        { name: "My Assigned Cases", path: "/collections/assigned", roles: ["FINANCE_ASSOCIATE"] },
        { name: "Team Collections", path: "/collections/assigned", roles: ["FINANCE_MANAGER"] },
        { name: "Escalated Cases", path: "/collections/escalated", roles: ["FINANCE_MANAGER"] },
        { name: "Broken Promises", path: "/collections/broken-promises", roles: ["FINANCE_MANAGER", "FINANCE_ASSOCIATE"] },
        { name: "Reminder History", path: "/collections/reminders", roles: ["FINANCE_ASSOCIATE", "FINANCE_MANAGER"] },
      ],
    },
    {
      name: "Customers",
      path: "/customers",
      icon: Users,
      roles: ["FINANCE_ASSOCIATE", "FINANCE_MANAGER", "ADMIN"],
    },
  ];

  const visibleNavItems = navigationItems
    .filter((item) => user?.role && item.roles.includes(user.role))
    .map((item) => {
      if (item.children) {
        return {
          ...item,
          children: item.children.filter(
            (child) => !child.roles || (user?.role && child.roles.includes(user.role))
          ),
        };
      }
      return item;
    });

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950 font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col bg-slate-900 text-slate-100 border-r border-slate-800">
        <div className="flex h-16 items-center px-6 border-b border-slate-800 bg-slate-950">
          <span className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" /> Paisa Vasool
          </span>
        </div>
        <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto no-scrollbar">
          {visibleNavItems.map((item) => {
            if (item.children && item.children.length > 0) {
              return (
                <div key={item.name} className="space-y-1 pt-2">
                  <div className="flex items-center px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <item.icon className="mr-2.5 h-3.5 w-3.5 flex-shrink-0" />
                    {item.name}
                  </div>
                  <div className="space-y-1 pl-3.5">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.name}
                        to={child.path}
                        end={child.path === "/collections"}
                        className={({ isActive }) =>
                          `flex items-center px-4 py-2 text-xs font-semibold rounded-md transition-colors ${
                            isActive
                              ? "bg-slate-800 text-white"
                              : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
                          }`
                        }
                      >
                        <span className="mr-2.5 text-slate-500 font-bold">•</span>
                        {child.name}
                      </NavLink>
                    ))}
                  </div>
                </div>
              );
            }
            return (
              <NavLink
                key={item.name}
                to={item.path!}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 text-sm font-semibold rounded-lg transition-colors group ${
                    isActive
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                  }`
                }
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-3 mb-4 px-2">
            <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-200">
              <User className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">
                {user?.email}
              </p>
              <div className="mt-0.5">
                <Badge variant={getRoleBadgeVariant(user?.role)} className="text-[10px] py-0 px-1.5 uppercase font-bold tracking-wider">
                  {formatRoleName(user?.role)}
                </Badge>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-destructive hover:text-destructive-foreground transition-colors rounded-lg border border-slate-700 hover:border-transparent text-slate-300"
          >
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setIsMobileOpen(false)} />
          <aside className="relative flex w-64 max-w-xs flex-col bg-slate-900 text-slate-100 animate-in slide-in-from-left">
            <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800 bg-slate-950">
              <span className="text-lg font-bold text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" /> Paisa Vasool
              </span>
              <button onClick={() => setIsMobileOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto no-scrollbar">
              {visibleNavItems.map((item) => {
                if (item.children && item.children.length > 0) {
                  return (
                    <div key={item.name} className="space-y-1 pt-2">
                      <div className="flex items-center px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        <item.icon className="mr-2.5 h-3.5 w-3.5 flex-shrink-0" />
                        {item.name}
                      </div>
                      <div className="space-y-1 pl-3.5">
                        {item.children.map((child) => (
                          <NavLink
                            key={child.name}
                            to={child.path}
                            end={child.path === "/collections"}
                            onClick={() => setIsMobileOpen(false)}
                            className={({ isActive }) =>
                              `flex items-center px-4 py-2 text-xs font-semibold rounded-md transition-colors ${
                                isActive
                                  ? "bg-slate-800 text-white"
                                  : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
                              }`
                            }
                          >
                            <span className="mr-2.5 text-slate-500 font-bold">•</span>
                            {child.name}
                          </NavLink>
                        ))}
                      </div>
                    </div>
                  );
                }
                return (
                  <NavLink
                    key={item.name}
                    to={item.path!}
                    onClick={() => setIsMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center px-4 py-3 text-sm font-semibold rounded-lg transition-colors group ${
                        isActive
                          ? "bg-slate-800 text-white"
                          : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                      }`
                    }
                  >
                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </NavLink>
                );
              })}
            </nav>
            <div className="p-4 border-t border-slate-800 bg-slate-950">
              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center px-4 py-2.5 text-xs font-bold bg-slate-800 hover:bg-destructive text-slate-300 hover:text-destructive-foreground transition-colors rounded-lg border border-slate-700"
              >
                <LogOut className="mr-2 h-4 w-4" /> Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-16 items-center justify-between px-6 border-b border-border bg-white dark:bg-zinc-950 shadow-xs">
          <div className="flex items-center">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="text-muted-foreground hover:text-foreground md:hidden mr-4"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest hidden sm:block">
              Accounts Receivable Assistant
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-xs font-bold text-muted-foreground tracking-wider uppercase">Active Session</span>
              <span className="text-xs font-semibold text-foreground mt-0.5">{user?.email}</span>
            </div>
            <div className="h-6 w-px bg-border hidden md:block" />
            <Badge variant={getRoleBadgeVariant(user?.role)} className="uppercase font-bold text-[10px] tracking-widest py-0.5 px-2.5">
              {formatRoleName(user?.role)}
            </Badge>
          </div>
        </header>

        {/* Content Page Outlet */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-zinc-900/10 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
