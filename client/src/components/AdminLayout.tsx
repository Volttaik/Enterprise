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
  Plus,
  Wifi,
  WifiOff,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const GREEN = "hsl(142,72%,40%)";
const GREEN_BG = "hsl(142,55%,93%)";
const BORDER = "hsl(0,0%,88%)";

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
      { label: "WhatsApp Setup", icon: Smartphone, href: "/whatsapp" },
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

  const accountsQuery = trpc.whatsapp.getAccounts.useQuery();
  const accounts = accountsQuery.data ?? [];

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
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b flex-shrink-0" style={{ borderColor: BORDER }}>
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: GREEN }}
          >
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-[15px] tracking-tight" style={{ color: "hsl(215,25%,13%)" }}>
            WaAssist
          </span>
        </Link>
      </div>

      {/* Scrollable nav area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* ── Connected Assistants ────────────────────────────────── */}
        <div className="px-3 pt-3 pb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "hsl(215,15%,58%)" }}>
              Connected Assistants
            </span>
            <Link href="/whatsapp">
              <button
                className="w-5 h-5 rounded flex items-center justify-center hover:bg-gray-100 transition-colors"
                title="Add assistant"
              >
                <Plus style={{ width: 12, height: 12, color: "hsl(215,15%,52%)" }} />
              </button>
            </Link>
          </div>

          {accounts.length === 0 ? (
            <Link href="/whatsapp">
              <div
                className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg border border-dashed cursor-pointer hover:border-green-400 transition-colors"
                style={{ borderColor: "hsl(0,0%,82%)" }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: GREEN_BG }}
                >
                  <Plus style={{ width: 13, height: 13, color: GREEN }} />
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: "hsl(215,25%,30%)" }}>Connect WhatsApp</p>
                  <p className="text-[10px]" style={{ color: "hsl(215,15%,55%)" }}>Link your first number</p>
                </div>
              </div>
            </Link>
          ) : (
            <div className="space-y-1">
              {accounts.map((acc) => (
                <Link key={acc.id} href="/whatsapp">
                  <div
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors border"
                    style={{ borderColor: acc.isActive ? "hsl(142,50%,80%)" : BORDER, background: acc.isActive ? GREEN_BG : "white" }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: acc.isActive ? GREEN : "hsl(0,0%,92%)" }}
                    >
                      {acc.isActive
                        ? <Wifi style={{ width: 14, height: 14, color: "white" }} />
                        : <WifiOff style={{ width: 14, height: 14, color: "hsl(215,15%,52%)" }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: "hsl(215,25%,15%)" }}>
                        {acc.accountName || "WhatsApp"}
                      </p>
                      <p className="text-[10px] truncate" style={{ color: "hsl(215,15%,52%)" }}>
                        {acc.phoneNumber?.startsWith("pending")
                          ? "Not paired yet"
                          : `+${acc.phoneNumber}`}
                      </p>
                    </div>
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: acc.isActive ? GREEN : "hsl(0,0%,78%)" }}
                    />
                  </div>
                </Link>
              ))}

              <Link href="/whatsapp">
                <button
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors hover:bg-gray-50"
                  style={{ color: GREEN }}
                >
                  <Plus style={{ width: 11, height: 11 }} />
                  Add another
                </button>
              </Link>
            </div>
          )}
        </div>

        <div className="h-px mx-3 mb-2" style={{ background: BORDER }} />

        {/* ── Navigation ───────────────────────────────────────────── */}
        <nav className="px-2 pb-2">
          {navSections.map((section) => (
            <div key={section.label} className="mb-3">
              <div
                className="px-2.5 mb-1 text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "hsl(215,15%,58%)" }}
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
                      className="flex items-center gap-3 px-2.5 py-2 rounded-md transition-all duration-100"
                      style={
                        isActive
                          ? { background: GREEN_BG, borderLeft: `3px solid ${GREEN}`, paddingLeft: "7px" }
                          : {}
                      }
                    >
                      <Icon
                        style={{ width: 15, height: 15, flexShrink: 0, color: isActive ? GREEN : "hsl(215,15%,50%)" }}
                      />
                      <span
                        className="text-[13px] font-medium"
                        style={{ color: isActive ? GREEN : "hsl(215,20%,30%)" }}
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
      </div>

      {/* User footer */}
      <div className="p-3 border-t flex-shrink-0" style={{ borderColor: BORDER }}>
        <div className="flex items-center gap-2.5 p-2 rounded-lg" style={{ background: "hsl(0,0%,96%)" }}>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
            style={{ background: GREEN }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold truncate" style={{ color: "hsl(215,25%,13%)" }}>
              {user?.name ?? "My Account"}
            </p>
            <p className="text-[11px] truncate" style={{ color: "hsl(215,15%,52%)" }}>
              {user?.email}
            </p>
          </div>
          <button
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="w-7 h-7 rounded-md flex items-center justify-center transition-all hover:bg-red-50"
            title="Sign out"
          >
            <LogOut style={{ width: 14, height: 14, color: "hsl(0,65%,52%)" }} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "hsl(0,0%,95%)" }}>
      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex flex-col w-60 flex-shrink-0 border-r"
        style={{ background: "white", borderColor: BORDER, contain: "layout" }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile top header */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 h-12 z-50 flex items-center justify-between px-4 border-b"
        style={{ background: "white", borderColor: BORDER }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: GREEN }}>
            <MessageSquare className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-display font-bold text-[15px]" style={{ color: "hsl(215,25%,13%)" }}>
            WaAssist
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="w-8 h-8 rounded-md flex items-center justify-center border"
          style={{ borderColor: BORDER }}
        >
          <Menu className="w-4 h-4" style={{ color: "hsl(215,20%,30%)" }} />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[60] flex">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileMenuOpen(false)} />
          <div
            className="relative w-64 h-full flex flex-col border-r"
            style={{ background: "white", borderColor: BORDER }}
          >
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-3 right-3 w-7 h-7 rounded-md flex items-center justify-center border z-10"
              style={{ borderColor: BORDER }}
            >
              <X className="w-3.5 h-3.5" style={{ color: "hsl(215,20%,30%)" }} />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <div
          className="flex-1 overflow-y-auto custom-scrollbar pt-12 pb-16 md:pt-0 md:pb-0 p-4 md:p-6"
          style={{ scrollbarGutter: "stable" }}
        >

          <div className="max-w-5xl mx-auto w-full">{children}</div>
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t"
        style={{ background: "white", borderColor: BORDER }}
      >
        {bottomNav.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-1 transition-colors relative"
              style={{ color: isActive ? GREEN : "hsl(215,15%,52%)" }}
            >
              <Icon style={{ width: 18, height: 18 }} />
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
              {isActive && (
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full"
                  style={{ background: GREEN }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
