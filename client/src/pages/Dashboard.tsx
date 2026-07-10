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
  Package,
  BookOpen,
  TrendingUp,
} from "lucide-react";

const GREEN = "hsl(142,72%,40%)";
const BORDER = "hsl(0,0%,86%)";

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
      className={`rounded-xl border p-4 animate-in-stagger card-shadow ${delay ?? ""}`}
      style={{ background: "white", borderColor: BORDER }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "hsl(215,15%,50%)" }}>
            {label}
          </p>
          <p className="font-display font-bold text-2xl mt-1" style={{ color: "hsl(215,25%,13%)" }}>
            {value}
          </p>
          {sub && (
            <p className="text-xs mt-0.5" style={{ color: "hsl(215,15%,58%)" }}>
              {sub}
            </p>
          )}
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: color + "18" }}
        >
          <Icon style={{ width: 18, height: 18, color }} />
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
        className="rounded-xl border p-3.5 flex items-center gap-3.5 cursor-pointer card-shadow-hover"
        style={{ background: "white", borderColor: BORDER }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: color + "15" }}
        >
          <Icon style={{ width: 17, height: 17, color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm" style={{ color: "hsl(215,25%,13%)" }}>
            {label}
          </p>
          <p className="text-xs mt-0.5 truncate" style={{ color: "hsl(215,15%,52%)" }}>
            {description}
          </p>
        </div>
        <ArrowRight style={{ width: 15, height: 15, flexShrink: 0, color: "hsl(215,15%,62%)" }} />
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
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-lg animate-in-stagger" style={{ color: "hsl(215,25%,13%)" }}>
            {greeting()}, {user?.name?.split(" ")[0] ?? "there"} 👋
          </h1>
          <p className="text-sm mt-0.5 animate-in-stagger delay-50" style={{ color: "hsl(215,15%,50%)" }}>
            Your business at a glance — last 30 days
          </p>
        </div>

        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold animate-in-stagger delay-100 flex-shrink-0"
          style={
            isConnected
              ? { background: "hsl(142,55%,93%)", color: GREEN, borderColor: "hsl(142,50%,78%)" }
              : { background: "hsl(38,90%,94%)", color: "hsl(30,80%,36%)", borderColor: "hsl(38,80%,80%)" }
          }
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: isConnected ? GREEN : "hsl(38,80%,52%)" }}
          />
          {isConnected ? "WhatsApp active" : "Not connected"}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Messages"  value={metrics?.totalMessages ?? "—"} icon={MessageSquare} color={GREEN}               sub="Last 30 days" delay="delay-50" />
        <StatCard label="Contacts"  value={metrics?.totalContacts ?? "—"} icon={Users}         color="hsl(200,80%,46%)"    sub="Last 30 days" delay="delay-100" />
        <StatCard label="Orders"    value={metrics?.totalOrders ?? "—"}   icon={ShoppingCart}  color="hsl(258,70%,55%)"    sub="Last 30 days" delay="delay-150" />
        <StatCard label="Payments"  value={metrics?.totalPayments ?? "—"} icon={CreditCard}    color="hsl(22,85%,50%)"     sub="Last 30 days" delay="delay-200" />
      </div>

      {/* Connect banner */}
      {!isConnected && (
        <div
          className="rounded-xl border p-4 flex items-center gap-4 animate-in-stagger delay-200"
          style={{ background: "hsl(142,55%,93%)", borderColor: "hsl(142,50%,78%)" }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: GREEN }}>
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm" style={{ color: "hsl(142,60%,20%)" }}>Connect your WhatsApp</p>
            <p className="text-xs mt-0.5" style={{ color: "hsl(142,50%,32%)" }}>
              Link your number to start automating customer conversations.
            </p>
          </div>
          <Link href="/whatsapp">
            <button className="px-4 py-2 rounded-lg text-sm font-semibold text-white flex-shrink-0" style={{ background: GREEN }}>
              Connect
            </button>
          </Link>
        </div>
      )}

      {/* Quick access */}
      <div>
        <h2 className="font-semibold text-xs mb-2.5 uppercase tracking-wider" style={{ color: "hsl(215,15%,50%)" }}>
          Quick access
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <QuickActionCard href="/contacts"      icon={Users}        label="Manage Contacts"  description="View and update your customer CRM"         color={GREEN} />
          <QuickActionCard href="/orders"        icon={ShoppingCart} label="View Orders"      description="Track and manage customer orders"          color="hsl(258,70%,55%)" />
          <QuickActionCard href="/products"      icon={Package}      label="Product Catalog"  description="Manage your products and inventory"        color="hsl(22,85%,50%)" />
          <QuickActionCard href="/knowledge-base" icon={BookOpen}    label="Knowledge Base"   description="Train your AI assistant with your content" color="hsl(200,80%,46%)" />
        </div>
      </div>
    </div>
  );
}
