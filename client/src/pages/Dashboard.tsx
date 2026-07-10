import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "wouter";
import {
  MessageSquare,
  ShoppingCart,
  CreditCard,
  Users,
  Smartphone,
  ArrowRight,
  TrendingUp,
  Package,
} from "lucide-react";

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
  delay,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  sub?: string;
  delay?: string;
}) {
  return (
    <div
      className={`rounded-2xl p-5 animate-in-stagger ${delay ?? ""}`}
      style={{
        background: "white",
        boxShadow:
          "6px 6px 14px hsla(220,35%,65%,0.18), -4px -4px 10px hsla(0,0%,100%,0.85)",
      }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "hsl(220,12%,55%)" }}>
            {label}
          </p>
          <p className="font-display font-bold text-3xl" style={{ color: "hsl(228,24%,18%)" }}>
            {value}
          </p>
          {sub && (
            <p className="text-xs" style={{ color: "hsl(152,65%,40%)" }}>
              {sub}
            </p>
          )}
        </div>
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: color + "18" }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({
  href,
  icon: Icon,
  label,
  description,
  color,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  description: string;
  color: string;
}) {
  return (
    <Link href={href}>
      <div
        className="rounded-2xl p-5 flex items-center gap-4 cursor-pointer transition-all hover:-translate-y-0.5"
        style={{
          background: "white",
          boxShadow:
            "4px 4px 10px hsla(220,35%,65%,0.15), -3px -3px 8px hsla(0,0%,100%,0.85)",
        }}
      >
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: color + "15" }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm" style={{ color: "hsl(228,24%,18%)" }}>
            {label}
          </p>
          <p className="text-xs mt-0.5 truncate" style={{ color: "hsl(220,12%,55%)" }}>
            {description}
          </p>
        </div>
        <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: "hsl(220,12%,65%)" }} />
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const metricsQuery = trpc.analytics.getMetrics.useQuery({ days: 30 });
  const accountsQuery = trpc.whatsapp.getAccounts.useQuery();

  const metrics = metricsQuery.data;
  const isConnected = accountsQuery.data?.some((a) => a.isActive);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="font-display font-bold text-2xl animate-in-stagger"
            style={{ color: "hsl(228,24%,18%)" }}
          >
            {greeting()}, {user?.name?.split(" ")[0] ?? "there"} 👋
          </h1>
          <p
            className="text-sm mt-1 animate-in-stagger delay-50"
            style={{ color: "hsl(220,12%,52%)" }}
          >
            Here's what's happening in your business today.
          </p>
        </div>

        {/* WhatsApp status pill */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium animate-in-stagger delay-100"
          style={
            isConnected
              ? { background: "hsl(152,65%,94%)", color: "hsl(152,65%,35%)" }
              : { background: "hsl(38,90%,94%)", color: "hsl(38,90%,35%)" }
          }
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{
              background: isConnected ? "hsl(152,65%,45%)" : "hsl(38,90%,55%)",
            }}
          />
          {isConnected ? "WhatsApp active" : "WhatsApp not linked"}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Messages"
          value={metrics?.totalMessages ?? "—"}
          icon={MessageSquare}
          color="hsl(258,84%,62%)"
          sub="Last 30 days"
          delay="delay-50"
        />
        <StatCard
          label="Orders"
          value={metrics?.totalOrders ?? "—"}
          icon={ShoppingCart}
          color="hsl(22,90%,62%)"
          sub="Last 30 days"
          delay="delay-100"
        />
        <StatCard
          label="Payments"
          value={metrics?.totalPayments ?? "—"}
          icon={CreditCard}
          color="hsl(152,65%,45%)"
          sub="Last 30 days"
          delay="delay-150"
        />
        <StatCard
          label="Contacts"
          value={metrics?.totalContacts ?? "—"}
          icon={Users}
          color="hsl(200,80%,55%)"
          sub="Last 30 days"
          delay="delay-200"
        />
      </div>

      {/* WhatsApp setup prompt */}
      {!isConnected && (
        <div
          className="rounded-2xl p-5 flex items-center gap-5 animate-in-stagger delay-200"
          style={{
            background: "linear-gradient(135deg, hsl(258,84%,97%), hsl(22,90%,97%))",
            border: "1px solid hsl(258,84%,88%)",
          }}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, hsl(258,84%,62%), hsl(22,90%,62%))" }}
          >
            <Smartphone className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold" style={{ color: "hsl(228,24%,18%)" }}>
              Connect your WhatsApp
            </p>
            <p className="text-sm mt-0.5" style={{ color: "hsl(220,12%,52%)" }}>
              Link your WhatsApp Business number to start automating customer conversations.
            </p>
          </div>
          <Link href="/whatsapp">
            <button
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, hsl(258,84%,62%), hsl(22,90%,62%))",
                boxShadow: "0 4px 12px hsla(258,84%,62%,0.30)",
              }}
            >
              Connect now
            </button>
          </Link>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h2
          className="font-display font-semibold text-base mb-3 animate-in-stagger delay-300"
          style={{ color: "hsl(228,24%,18%)" }}
        >
          Quick access
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in-stagger delay-300">
          <QuickActionCard
            href="/contacts"
            icon={Users}
            label="Manage Contacts"
            description="View and update your customer CRM"
            color="hsl(258,84%,62%)"
          />
          <QuickActionCard
            href="/orders"
            icon={ShoppingCart}
            label="View Orders"
            description="Track and manage customer orders"
            color="hsl(22,90%,62%)"
          />
          <QuickActionCard
            href="/products"
            icon={Package}
            label="Product Catalog"
            description="Manage your products and inventory"
            color="hsl(152,65%,45%)"
          />
          <QuickActionCard
            href="/knowledge-base"
            icon={TrendingUp}
            label="Knowledge Base"
            description="Train your AI assistant with your content"
            color="hsl(200,80%,55%)"
          />
        </div>
      </div>
    </div>
  );
}
