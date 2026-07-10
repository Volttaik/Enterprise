import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  CreditCard,
  Package,
  BookOpen,
  Smartphone,
  Settings,
  Menu,
  X,
  LogOut,
  MessageSquare,
  BarChart3,
  Radio,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const GREEN = "hsl(142,72%,40%)";
const GREEN_BG = "hsl(142,55%,93%)";

const navSections = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
      { label: "Analytics", icon: BarChart3, href: "/analytics" },
    ],
  },
  {
    label: "Communication",
    items: [
      { label: "WhatsApp", icon: Smartphone, href: "/whatsapp" },
      { label: "Contacts", icon: Users, href: "/contacts" },
      { label: "Campaigns", icon: Radio, href: "/campaigns" },
    ],
  },
  {
    label: "Commerce",
    items: [
      { label: "Products", icon: Package, href: "/products" },
      { label: "Orders", icon: ShoppingCart, href: "/orders" },
      { label: "Payments", icon: CreditCard, href: "/payments" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { label: "Knowledge Base", icon: BookOpen, href: "/knowledge-base" },
      { label: "Settings", icon: Settings, href: "/settings" },
    ],
  },
];

// Bottom nav shows only top 5 most-used pages
const bottomNav = [
  { label: "Home", icon: LayoutDashboard, href: "/dashboard" },
  { label: "WhatsApp", icon: Smartphone, href: "/whatsapp" },
  { label: "Contacts", icon: Users, href: "/contacts" },
  { label: "Orders", icon: ShoppingCart, href: "/orders" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, refetch } = useAuth();

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await refetch();
      navigate("/login");
    },
    onError: () => toast.error("Failed to sign out"),
  });

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? "ME";

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-3.5 border-b" style={{ borderColor: "hsl(0,0%,90%)" }}>
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: GREEN }}
          >
            <MessageSquare className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-display font-bold text-sm tracking-tight" style={{ color: "hsl(215,25%,15%)" }}>
            WaAssist
          </span>
        </Link>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 px-2 py-2 overflow-y-auto custom-scrollbar">
        {navSections.map((section) => (
          <div key={section.label} className="mb-3">
            <div
              className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: "hsl(215,15%,60%)" }}
            >
              {section.label}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-all duration-100 group"
                    style={
                      isActive
                        ? {
                            background: GREEN_BG,
                            borderLeft: `3px solid ${GREEN}`,
                            paddingLeft: "7px",
                          }
                        : {}
                    }
                  >
                    <Icon
                      className="w-3.5 h-3.5 flex-shrink-0"
                      style={{ color: isActive ? GREEN : "hsl(215,15%,52%)" }}
                    />
                    <span
                      className="text-xs font-medium"
                      style={{ color: isActive ? GREEN : "hsl(215,20%,32%)" }}
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="p-2 border-t" style={{ borderColor: "hsl(0,0%,90%)" }}>
        <div className="flex items-center gap-2.5 p-2 rounded-md" style={{ background: "hsl(0,0%,96%)" }}>
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
            style={{ background: GREEN }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: "hsl(215,25%,15%)" }}>
              {user?.name ?? "My Account"}
            </p>
            <p className="text-[10px] truncate" style={{ color: "hsl(215,15%,52%)" }}>
              {user?.email ?? user?.role}
            </p>
          </div>
          <button
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="w-7 h-7 rounded-md flex items-center justify-center transition-all hover:bg-red-50"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" style={{ color: "hsl(0,65%,55%)" }} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "hsl(0,0%,96%)" }}>
      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex flex-col w-56 flex-shrink-0 border-r"
        style={{ background: "white", borderColor: "hsl(0,0%,88%)" }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile: top header bar */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 h-12 z-50 flex items-center justify-between px-3 border-b"
        style={{ background: "white", borderColor: "hsl(0,0%,88%)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: GREEN }}
          >
            <MessageSquare className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-display font-bold text-sm" style={{ color: "hsl(215,25%,15%)" }}>
            WaAssist
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="w-8 h-8 rounded-md flex items-center justify-center border"
          style={{ borderColor: "hsl(0,0%,88%)" }}
        >
          <Menu className="w-4 h-4" style={{ color: "hsl(215,20%,32%)" }} />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[60] flex">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            className="relative w-60 h-full flex flex-col border-r"
            style={{ background: "white", borderColor: "hsl(0,0%,88%)" }}
          >
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-3 right-3 w-7 h-7 rounded-md flex items-center justify-center border"
              style={{ borderColor: "hsl(0,0%,88%)" }}
            >
              <X className="w-3.5 h-3.5" style={{ color: "hsl(215,20%,32%)" }} />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Content area — on mobile: top padding for header, bottom padding for bottom nav */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pt-12 pb-16 md:pt-0 md:pb-0 p-3 md:p-5">
          <div className="max-w-5xl mx-auto w-full">{children}</div>
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t"
        style={{ background: "white", borderColor: "hsl(0,0%,88%)" }}
      >
        {bottomNav.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors"
              style={{ color: isActive ? GREEN : "hsl(215,15%,52%)" }}
            >
              <Icon className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
              <span className="text-[9px] font-medium leading-none">{item.label}</span>
              {isActive && (
                <div className="absolute bottom-0 w-8 h-0.5 rounded-t-full" style={{ background: GREEN }} />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
