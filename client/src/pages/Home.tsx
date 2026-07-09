import { Button } from "@/components/ui/button";
import {
  Bot,
  BarChart3,
  MessageCircle,
  Package,
  Users,
} from "lucide-react";
import { useLocation } from "wouter";

const features = [
  {
    icon: MessageCircle,
    title: "WhatsApp conversations",
    description:
      "Handle customer messages with AI-powered replies and full conversation history.",
  },
  {
    icon: Users,
    title: "Customer CRM",
    description:
      "Auto-build contact profiles, score leads, and track lifetime value.",
  },
  {
    icon: Package,
    title: "Orders & inventory",
    description:
      "Create orders, track payments, and get alerted on low stock automatically.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description:
      "Real-time revenue, message, and customer growth metrics at a glance.",
  },
];

export default function Home() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <span className="font-semibold">WhatsApp AI Assistant</span>
          </div>
          <Button variant="default" onClick={() => navigate("/dashboard")}>
            Open dashboard
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-6 py-20 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Your personal WhatsApp business assistant
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            AI-powered conversations, a built-in CRM, and order management —
            all from one dashboard, connected straight to your own WhatsApp.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button size="lg" onClick={() => navigate("/dashboard")}>
              Open dashboard
            </Button>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 pb-20">
          <div className="grid gap-6 sm:grid-cols-2">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-lg border bg-card p-6 text-left"
              >
                <Icon className="h-6 w-6 text-primary mb-3" />
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        Enterprise AI WhatsApp Business Assistant
      </footer>
    </div>
  );
}
