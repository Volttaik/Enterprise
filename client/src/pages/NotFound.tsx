import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-destructive/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="max-w-md w-full text-center relative z-10 animate-in-stagger">
        <div className="w-20 h-20 bg-destructive/10 rounded-2xl border border-destructive/20 flex items-center justify-center mx-auto mb-8">
          <ShieldAlert className="w-10 h-10 text-destructive" />
        </div>
        
        <h1 className="font-display text-7xl font-bold tracking-tight mb-4 text-foreground">
          404
        </h1>
        <h2 className="text-2xl font-semibold mb-3">Sector Not Found</h2>
        
        <p className="text-muted-foreground mb-10 leading-relaxed">
          The command interface you're looking for doesn't exist, has been restricted, or is currently offline.
        </p>
        
        <Link href="/dashboard">
          <Button size="lg" className="w-full sm:w-auto h-12 px-8 rounded-full font-medium gap-2">
            <ArrowLeft className="w-4 h-4" />
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
