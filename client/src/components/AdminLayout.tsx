import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  DollarSign,
  Settings,
  FileText,
  Smartphone,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Overview", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Contacts", icon: Users, href: "/contacts" },
  { label: "Orders", icon: ShoppingCart, href: "/orders" },
  { label: "Payments", icon: DollarSign, href: "/payments" },
  { label: "Products", icon: FileText, href: "/products" },
  { label: "Knowledge Base", icon: FileText, href: "/knowledge-base" },
  { label: "WhatsApp Setup", icon: Smartphone, href: "/whatsapp" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden text-foreground selection:bg-accent/30">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 m-4 mr-0 rounded-3xl bg-card shadow-soft-lg">
        <div className="h-16 flex items-center px-6">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-accent shadow-soft flex items-center justify-center text-accent-foreground font-bold">
              AI
            </div>
            <span className="font-display font-semibold text-lg tracking-tight">Assistant</span>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Command Center
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-accent text-accent-foreground font-medium shadow-soft"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-accent-foreground" : "text-muted-foreground"}`} />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-muted/60">
            <div className="w-9 h-9 rounded-full bg-background shadow-soft flex items-center justify-center text-xs font-medium">
              ME
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium leading-none">Solo Operator</span>
              <span className="text-xs text-muted-foreground mt-1">Admin</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header & Nav */}
      <div className="md:hidden fixed top-3 left-3 right-3 h-16 rounded-2xl bg-card shadow-soft-lg z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center text-accent-foreground font-bold">
            AI
          </div>
          <span className="font-display font-semibold tracking-tight">Assistant</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)}>
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[60] bg-background flex flex-col">
          <div className="h-16 flex items-center justify-between px-4 shadow-soft bg-card">
            <span className="font-display font-semibold tracking-tight">Menu</span>
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    isActive
                      ? "bg-accent text-accent-foreground font-medium shadow-soft"
                      : "text-muted-foreground active:bg-muted"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative pt-20 md:pt-0">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
