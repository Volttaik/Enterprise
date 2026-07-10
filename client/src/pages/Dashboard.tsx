import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { MessageSquare, ShoppingCart, DollarSign, Users, ArrowUpRight, Activity, Bot, FileText } from "lucide-react";
import { trpc } from "@/lib/trpc";

const mockChartData = [
  { date: "Mon", messages: 45, orders: 12, revenue: 1200 },
  { date: "Tue", messages: 52, orders: 15, revenue: 1500 },
  { date: "Wed", messages: 48, orders: 10, revenue: 1000 },
  { date: "Thu", messages: 61, orders: 18, revenue: 1800 },
  { date: "Fri", messages: 55, orders: 14, revenue: 1400 },
  { date: "Sat", messages: 67, orders: 20, revenue: 2000 },
  { date: "Sun", messages: 72, orders: 22, revenue: 2200 },
];

export default function Dashboard() {
  const { data: metrics, isLoading: isMetricsLoading } = trpc.analytics.getMetrics.useQuery({ days: 7 });
  const { data: accounts, isLoading: isAccountsLoading } = trpc.whatsapp.getAccounts.useQuery();

  const account = accounts?.[0];
  const { data: statusData } = trpc.whatsapp.getStatus.useQuery(
    { whatsappAccountId: account?.id! },
    { enabled: !!account?.id, refetchInterval: 5000 }
  );

  const isConnected = statusData?.status === "connected";

  if (isMetricsLoading || isAccountsLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse p-2">
        <div className="h-10 w-48 bg-muted rounded-md mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-muted rounded-xl mt-4" />
      </div>
    );
  }

  const safeMetrics = metrics || { totalMessages: 0, totalOrders: 0, totalPayments: 0, totalContacts: 0 };

  return (
    <div className="space-y-8 animate-in-stagger">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight mb-1">Command Overview</h1>
          <p className="text-muted-foreground">Here is what's happening across your business.</p>
        </div>

        <div className="flex items-center gap-3 bg-card px-4 py-2 rounded-full shadow-soft">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">WhatsApp:</span>
            {isConnected ? (
              <span className="flex items-center gap-1.5 text-sm font-semibold text-accent">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
                </span>
                Active
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-sm font-semibold text-destructive">
                <span className="w-2 h-2 rounded-full bg-destructive" />
                Disconnected
              </span>
            )}
          </div>
          {!isConnected && (
            <Link href="/whatsapp">
              <Button variant="link" size="sm" className="h-6 px-2 text-xs">Reconnect</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border shadow-soft shadow-soft-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold">{safeMetrics.totalMessages}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-soft shadow-soft-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Orders Created</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold">{safeMetrics.totalOrders}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-soft shadow-soft-hover relative overflow-hidden">
          <div className="absolute inset-0 bg-accent/5 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-accent">Est. Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-display font-bold text-foreground">
              ${(safeMetrics.totalPayments * 150).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Based on avg. value</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-soft shadow-soft-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold">{safeMetrics.totalContacts}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-card border-border shadow-soft">
          <CardHeader>
            <CardTitle className="font-display font-semibold">Activity Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Line type="monotone" dataKey="messages" name="Messages" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="orders" name="Orders" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-soft flex flex-col">
          <CardHeader>
            <CardTitle className="font-display font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-accent" /> Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-3">
            <Link href="/products" className="flex-1">
              <Button variant="outline" className="w-full h-full justify-between items-center bg-background hover:bg-accent/5 hover:text-accent hover:border-accent/30 transition-all">
                <span className="flex items-center gap-3">
                  <FileText className="w-4 h-4" /> Add Product
                </span>
                <ArrowUpRight className="w-4 h-4 opacity-50" />
              </Button>
            </Link>
            <Link href="/knowledge-base" className="flex-1">
              <Button variant="outline" className="w-full h-full justify-between items-center bg-background hover:bg-accent/5 hover:text-accent hover:border-accent/30 transition-all">
                <span className="flex items-center gap-3">
                  <Bot className="w-4 h-4" /> Train AI
                </span>
                <ArrowUpRight className="w-4 h-4 opacity-50" />
              </Button>
            </Link>
            <Link href="/orders" className="flex-1">
              <Button variant="outline" className="w-full h-full justify-between items-center bg-background hover:bg-accent/5 hover:text-accent hover:border-accent/30 transition-all">
                <span className="flex items-center gap-3">
                  <ShoppingCart className="w-4 h-4" /> View Orders
                </span>
                <ArrowUpRight className="w-4 h-4 opacity-50" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
