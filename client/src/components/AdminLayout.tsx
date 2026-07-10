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
  ChevronRight,
  MessageSquare,
  BarChart3,
  Radio,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useLocation as useWouterLocation } from "wouter";

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

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location, navigate] = useWouterLocation();
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
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? "ME";

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="h-18 flex items-center px-5 pt-5 pb-3">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105"
            style={{
              background: "linear-gradient(135deg, hsl(258,84%,62%), hsl(22,90%,62%))",
            }}
          >
            <img
              src="/logo-icon.png"
              alt=""
              className="w-5 h-5"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
                (e.target as HTMLImageElement).parentElement!.innerHTML =
                  '<span class="text-white font-bold text-sm">W</span>';
              }}
            />
          </div>
          <span
            className="font-display font-bold text-lg tracking-tight"
            style={{ color: "hsl(228,24%,18%)" }}
          >
            WaAssist
          </span>
        </Link>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto custom-scrollbar space-y-4">
        {navSections.map((section) => (
          <div key={section.label}>
            <div
              className="px-3 mb-1.5 text-xs font-semibold uppercase tracking-widest"
              style={{ color: "hsl(220,12%,65%)" }}
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
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 relative group"
                    style={
                      isActive
                        ? {
                            background: "linear-gradient(135deg, hsl(258,84%,96%), hsl(22,90%,96%))",
                            borderLeft: "4px solid hsl(258,84%,62%)",
                            paddingLeft: "8px",
                          }
                        : {
                            color: "hsl(220,12%,52%)",
                          }
                    }
                  >
                    <Icon
                      className="w-4 h-4 flex-shrink-0 transition-colors"
                      style={{
                        color: isActive ? "hsl(258,84%,62%)" : undefined,
                      }}
                    />
                    <span
                      className="text-sm font-medium"
                      style={{
                        color: isActive ? "hsl(258,84%,52%)" : "hsl(228,24%,35%)",
                      }}
                    >
                      {item.label}
                    </span>
                    {isActive && (
                      <ChevronRight
                        className="w-3 h-3 ml-auto"
                        style={{ color: "hsl(258,84%,62%)" }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t" style={{ borderColor: "hsl(220,20%,91%)" }}>
        <div
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{ background: "hsl(220,28%,96%)" }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, hsl(258,84%,62%), hsl(22,90%,62%))",
            }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-semibold truncate"
              style={{ color: "hsl(228,24%,18%)" }}
            >
              {user?.name ?? "My Account"}
            </p>
            <p
              className="text-xs truncate"
              style={{ color: "hsl(220,12%,55%)" }}
            >
              {user?.email ?? user?.role}
            </p>
          </div>
          <button
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-red-50"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" style={{ color: "hsl(0,65%,60%)" }} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "hsl(220,28%,96%)" }}
    >
      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex flex-col w-64 m-4 mr-0 rounded-3xl flex-shrink-0"
        style={{
          background: "white",
          boxShadow:
            "6px 6px 14px hsla(220,35%,65%,0.22), -4px -4px 10px hsla(0,0%,100%,0.85)",
        }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <div
        className="md:hidden fixed top-3 left-3 right-3 h-14 rounded-2xl z-50 flex items-center justify-between px-4"
        style={{
          background: "white",
          boxShadow: "6px 6px 14px hsla(220,35%,65%,0.22), -4px -4px 10px hsla(0,0%,100%,0.85)",
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, hsl(258,84%,62%), hsl(22,90%,62%))" }}
          >
            <span className="text-white font-bold text-sm">W</span>
          </div>
          <span className="font-display font-bold" style={{ color: "hsl(228,24%,18%)" }}>
            WaAssist
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "hsl(220,28%,96%)" }}
        >
          <Menu className="w-5 h-5" style={{ color: "hsl(228,24%,35%)" }} />
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[60] flex">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            className="relative w-72 h-full flex flex-col"
            style={{
              background: "white",
              boxShadow: "4px 0 24px hsla(220,35%,65%,0.25)",
            }}
          >
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "hsl(220,28%,96%)" }}
              >
                <X className="w-4 h-4" style={{ color: "hsl(228,24%,35%)" }} />
              </button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative pt-20 md:pt-0">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          <div className="max-w-6xl mx-auto w-full">{children}</div>
        </div>
      </main>
    </div>
  );
}
