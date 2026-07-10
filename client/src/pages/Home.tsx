import { Link } from "wouter";
import { Bot, Zap, Shield, Smartphone, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-accent/30">
      {/* Navbar */}
      <nav className="border-b border-border/50 bg-background/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded flex items-center justify-center">
              <Bot className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="font-display font-semibold text-lg tracking-tight">WhatsApp AI Assistant</span>
          </div>
          <Link href="/dashboard">
            <Button variant="default" className="font-medium h-9 px-5 rounded-full">
              Open Dashboard
            </Button>
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full max-w-5xl mx-auto px-6 pt-32 pb-24 text-center relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/20 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="animate-in-stagger relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
              </span>
              v1.0 Live Command Center
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight mb-6 text-glow leading-[1.1]">
              Your business, <br className="hidden md:block" />
              run from your pocket.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Connect your real WhatsApp number. Let AI handle the conversations, 
              capture the orders, and log the payments. You just watch the dashboard.
            </p>
            <Link href="/dashboard">
              <Button size="lg" className="h-14 px-8 text-base font-semibold rounded-full gap-2 shadow-[0_0_40px_hsla(152,76%,40%,0.4)] hover:shadow-[0_0_60px_hsla(152,76%,40%,0.6)] transition-all duration-300">
                Enter Command Center <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Value Props */}
        <section className="w-full max-w-6xl mx-auto px-6 py-24 border-t border-border/50">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="animate-in-stagger delay-100 p-8 rounded-2xl bg-card border border-border">
              <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-6">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-3">Native WhatsApp</h3>
              <p className="text-muted-foreground leading-relaxed">
                Pairs via QR code just like WhatsApp Web. No API fees, no meta approvals, no generic bot numbers. It's your actual business number.
              </p>
            </div>
            
            <div className="animate-in-stagger delay-200 p-8 rounded-2xl bg-card border border-border">
              <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-3">Silent Intelligence</h3>
              <p className="text-muted-foreground leading-relaxed">
                The AI reads your knowledge base and catalog to instantly reply to customers, extract order intents, and update CRM records automatically.
              </p>
            </div>

            <div className="animate-in-stagger delay-300 p-8 rounded-2xl bg-card border border-border">
              <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-6">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-3">Total Control</h3>
              <p className="text-muted-foreground leading-relaxed">
                One dashboard to track all inventory, verify payments, manage orders, and oversee AI conversations. Everything is strictly yours.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50 py-8 text-center">
        <p className="text-sm text-muted-foreground font-medium tracking-wide uppercase">
          AI WhatsApp Business Assistant
        </p>
      </footer>
    </div>
  );
}
