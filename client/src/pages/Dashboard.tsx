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
      className={`rounded-lg p-3.5 border animate-in-stagger ${delay ?? ""} card-shadow`}
      style={{ background: "white", borderColor: "hsl(0,0%,88%)" }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider truncate" style={{ color: "hsl(215,15%,52%)" }}>
            {label}
          </p>
          <p className="font-display font-bold text-xl mt-0.5" style={{ color: "hsl(215,25%,15%)" }}>
            {value}
          </p>
          {sub && (
            <p className="text-[10px] mt-0.5" style={{ color: "hsl(215,15%,60%)" }}>
              {sub}
            </p>
          )}
        </div>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: color + "18" }}
        >
          <Icon style={{ width: 15, height: 15, color }} />
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
        className="rounded-lg p-3 flex items-center gap-3 border cursor-pointer card-shadow-hover"
        style={{ background: "white", borderColor: "hsl(0,0%,88%)" }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: color + "15" }}
        >
          <Icon style={{ width: 15, height: 15, color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-xs" style={{ color: "hsl(215,25%,15%)" }}>
            {label}
          </p>
          <p className="text-[10px] mt-0.5 truncate" style={{ color: "hsl(215,15%,52%)" }}>
            {description}
          </p>
        </div>
        <ArrowRight style={{ width: 13, height: 13, flexShrink: 0, color: "hsl(215,15%,65%)" }} />
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-base animate-in-stagger" style={{ color: "hsl(215,25%,15%)" }}>
            {greeting()}, {user?.name?.split(" ")[0] ?? "there"} 👋
          </h1>
          <p className="text-xs mt-0.5 animate-in-stagger delay-50" style={{ color: "hsl(215,15%,52%)" }}>
            Your business at a glance — last 30 days
          </p>
        </div>

        {/* WhatsApp status pill */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-semibold border animate-in-stagger delay-100 flex-shrink-0"
          style={
            isConnected
              ? { background: "hsl(142,55%,93%)", color: GREEN, borderColor: "hsl(142,50%,80%)" }
              : { background: "hsl(38,90%,94%)", color: "hsl(30,80%,38%)", borderColor: "hsl(38,80%,82%)" }
          }
        >
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: isConnected ? GREEN : "hsl(38,80%,52%)" }}
          />
          {isConnected ? "Connected" : "Not linked"}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <StatCard
          label="Messages"
          value={metrics?.totalMessages ?? "—"}
          icon={MessageSquare}
          color={GREEN}
          sub="Last 30 days"
          delay="delay-50"
        />
        <StatCard
          label="Contacts"
          value={metrics?.totalContacts ?? "—"}
          icon={Users}
          color="hsl(200,80%,48%)"
          sub="Last 30 days"
          delay="delay-100"
        />
        <StatCard
          label="Orders"
          value={metrics?.totalOrders ?? "—"}
          icon={ShoppingCart}
          color="hsl(258,70%,55%)"
          sub="Last 30 days"
          delay="delay-150"
        />
        <StatCard
          label="Payments"
          value={metrics?.totalPayments ?? "—"}
          icon={CreditCard}
          color="hsl(22,85%,52%)"
          sub="Last 30 days"
          delay="delay-200"
        />
      </div>

      {/* Connect banner */}
      {!isConnected && (
        <div
          className="rounded-lg p-3.5 flex items-center gap-3 border animate-in-stagger delay-200"
          style={{
            background: "hsl(142,55%,93%)",
            borderColor: "hsl(142,50%,78%)",
          }}
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: GREEN }}
          >
            <Smartphone className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-xs" style={{ color: "hsl(142,60%,20%)" }}>
              Connect your WhatsApp
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: "hsl(142,50%,32%)" }}>
              Link your number to start automating customer conversations.
            </p>
          </div>
          <Link href="/whatsapp">
            <button
              className="px-3 py-1.5 rounded-md text-xs font-semibold text-white flex-shrink-0"
              style={{ background: GREEN }}
            >
              Connect
            </button>
          </Link>
        </div>
      )}

      {/* Quick access */}
      <div>
        <h2
          className="font-display font-semibold text-xs mb-2 animate-in-stagger delay-300 uppercase tracking-wider"
          style={{ color: "hsl(215,15%,52%)" }}
        >
          Quick access
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in-stagger delay-300">
          <QuickActionCard
            href="/contacts"
            icon={Users}
            label="Manage Contacts"
            description="View and update your customer CRM"
            color={GREEN}
          />
          <QuickActionCard
            href="/orders"
            icon={ShoppingCart}
            label="View Orders"
            description="Track and manage customer orders"
            color="hsl(258,70%,55%)"
          />
          <QuickActionCard
            href="/products"
            icon={Package}
            label="Product Catalog"
            description="Manage your products and inventory"
            color="hsl(22,85%,52%)"
          />
          <QuickActionCard
            href="/knowledge-base"
            icon={BookOpen}
            label="Knowledge Base"
            description="Train your AI assistant with your content"
            color="hsl(200,80%,48%)"
          />
        </div>
      </div>
    </div>
  );
}
