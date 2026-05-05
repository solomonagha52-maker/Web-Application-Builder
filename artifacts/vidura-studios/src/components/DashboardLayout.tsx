import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  BookOpen,
  Settings as SettingsIcon,
  Search,
  Clock,
  Bell,
  Menu,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import logoPath from "@assets/logo_1777977950187.png";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth, getInitials } from "@/contexts/AuthContext";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();
  const [currentTime, setCurrentTime] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { profile, user } = useAuth();

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "User";
  const initials = getInitials(displayName);
  const role = profile?.role || "Course Director";

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "My Projects", href: "/dashboard", icon: FolderOpen },
    { label: "Script Generator", href: "/script-generator", icon: FileText },
    { label: "Course Tree", href: "/course-structure", icon: BookOpen },
    { label: "Settings", href: "/settings", icon: SettingsIcon },
  ];

  const Sidebar = ({ onNavClick }: { onNavClick?: () => void }) => (
    <>
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
        <Link href="/" onClick={onNavClick}>
          <img src={logoPath} alt="Vidura Studios" className="h-8 object-contain" />
        </Link>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            location === item.href ||
            (item.href === "/course-structure" && location === "/course-structure") ||
            (item.href === "/script-generator" && location === "/script-generator") ||
            (item.href === "/settings" && location === "/settings");
          const exactActive = item.href === location;
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onNavClick}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors duration-200",
                exactActive || (item.href === "/dashboard" && (location === "/dashboard" || location === "/") && item.label === "Dashboard")
                  ? "bg-black/5 text-[#004D40] border-l-4 border-[#004D40]"
                  : isActive && item.href !== "/dashboard"
                  ? "bg-black/5 text-[#004D40] border-l-4 border-[#004D40]"
                  : "text-sidebar-foreground hover:bg-black/5"
              )}
              data-testid={`nav-item-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-[#004D40] text-white text-sm font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-foreground truncate">{displayName}</span>
            <span className="text-xs text-muted-foreground truncate">{role}</span>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar — Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-[#F0F4F4] fixed h-full border-r border-sidebar-border z-20">
        <Sidebar />
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar — Mobile */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 w-64 bg-[#F0F4F4] transform transition-transform duration-300 ease-in-out z-50 flex flex-col md:hidden border-r border-sidebar-border",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar onNavClick={() => setMobileMenuOpen(false)} />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col md:ml-64 min-h-screen">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-border flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden p-2 text-foreground hover:bg-accent rounded-md"
              onClick={() => setMobileMenuOpen(true)}
              data-testid="btn-mobile-menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="relative hidden sm:block w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search projects…"
                className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-[#004D40]"
                data-testid="input-search"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {currentTime}
            </div>
            <button className="text-muted-foreground hover:text-foreground relative" data-testid="btn-notifications">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-[#CCAC00] rounded-full" />
            </button>
            <Link href="/settings">
              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarFallback className="bg-[#004D40] text-white text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-background p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
