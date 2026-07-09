import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useLocation, useRoute } from "wouter";
import {
  Menu,
  X,
  LayoutDashboard,
  MessageSquare,
  Users,
  ShoppingCart,
  DollarSign,
  Settings,
  LogOut,
  FileText,
  Zap,
  BarChart3,
  Smartphone,
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Live Chat", icon: MessageSquare, href: "/chat" },
  { label: "Contacts", icon: Users, href: "/contacts" },
  { label: "Orders", icon: ShoppingCart, href: "/orders" },
  { label: "Payments", icon: DollarSign, href: "/payments" },
  { label: "Products", icon: FileText, href: "/products" },
  { label: "Knowledge Base", icon: FileText, href: "/knowledge-base" },
  { label: "Campaigns", icon: Zap, href: "/campaigns" },
  { label: "Analytics", icon: BarChart3, href: "/analytics" },
  { label: "WhatsApp", icon: Smartphone, href: "/whatsapp" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-gradient-to-b from-violet-900 via-indigo-900 to-blue-900 text-white transition-all duration-300 hidden md:flex flex-col border-r border-cyan-500/20`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-cyan-500/20">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-3 ${!sidebarOpen && "justify-center w-full"}`}>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-400 to-cyan-400 flex items-center justify-center font-bold text-indigo-900">
                AI
              </div>
              {sidebarOpen && <span className="font-bold text-lg">WhatsApp AI</span>}
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className={`w-full flex items-center gap-3 px-6 py-3 transition-all ${
                  isActive
                    ? "bg-cyan-500/20 border-r-2 border-cyan-400 text-cyan-300"
                    : "text-gray-300 hover:bg-white/5"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User Profile & Logout */}
        <div className="border-t border-cyan-500/20 p-4 space-y-3">
          {sidebarOpen && (
            <div className="px-2 py-2 bg-white/5 rounded-lg">
              <p className="text-xs text-gray-400">Logged in as</p>
              <p className="text-sm font-medium truncate">{user?.name || "Admin"}</p>
            </div>
          )}
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full gap-2 justify-center"
            size="sm"
          >
            <LogOut className="w-4 h-4" />
            {sidebarOpen && "Logout"}
          </Button>
        </div>

        {/* Toggle Button */}
        <div className="p-4 border-t border-cyan-500/20">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full justify-center"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild className="md:hidden">
          <Button variant="ghost" size="icon" className="absolute top-4 left-4 z-50">
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 bg-gradient-to-b from-violet-900 via-indigo-900 to-blue-900 text-white p-0">
          <div className="space-y-4 py-6">
            <div className="px-6 py-2">
              <h2 className="text-lg font-bold">WhatsApp AI</h2>
            </div>
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                return (
                  <button
                    key={item.href}
                    onClick={() => navigate(item.href)}
                    className={`w-full flex items-center gap-3 px-6 py-3 transition-all ${
                      isActive ? "bg-cyan-500/20 text-cyan-300" : "text-gray-300 hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-card border-b border-border h-16 flex items-center px-6 justify-between">
          <h1 className="text-xl font-semibold text-gradient hidden md:block">Enterprise AI WhatsApp Assistant</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">{user?.email}</div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-gradient-bg">
          <div className="p-6 md:p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
