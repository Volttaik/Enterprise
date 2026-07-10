import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Loader2, QrCode, RefreshCw, Unplug, ShieldCheck } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  idle: "Awaiting connection",
  connecting: "Establishing tunnel...",
  qr: "Ready for scan",
  connected: "Active & Synced",
  disconnected: "Offline",
  error: "Connection failed",
};

export default function WhatsAppSetup() {
  const utils = trpc.useUtils();

  const accountQuery = trpc.whatsapp.getAccounts.useQuery();
  const ensureAccount = trpc.whatsapp.getOrCreateDefaultAccount.useMutation({
    onSuccess: () => utils.whatsapp.getAccounts.invalidate(),
  });

  useEffect(() => {
    if (!accountQuery.isLoading && accountQuery.data?.length === 0) {
      ensureAccount.mutate();
    }
  }, [accountQuery.isLoading, accountQuery.data, ensureAccount]);

  const account = accountQuery.data?.[0];
  const accountId = account?.id;

  const statusQuery = trpc.whatsapp.getStatus.useQuery(
    { whatsappAccountId: accountId! },
    {
      enabled: !!accountId,
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        return status === "connected" ? false : 2000;
      },
    }
  );

  const connectMutation = trpc.whatsapp.connect.useMutation({
    onSuccess: () => statusQuery.refetch(),
  });
  
  const disconnectMutation = trpc.whatsapp.disconnect.useMutation({
    onSuccess: () => statusQuery.refetch(),
  });

  const status = statusQuery.data?.status ?? "idle";
  const isConnected = status === "connected";

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in-stagger">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight mb-2">Device Pairing</h1>
        <p className="text-muted-foreground text-lg">
          Connect your business number. Once paired, the AI will autonomously handle messages and track events.
        </p>
      </div>

      <Card className="bg-card border-border shadow-md overflow-hidden relative">
        {isConnected && <div className="absolute top-0 left-0 w-1 h-full bg-accent" />}
        <CardHeader className="border-b border-border/50 bg-muted/20 flex flex-row items-center justify-between pb-6">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${isConnected ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-muted border-border text-muted-foreground'}`}>
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-display">{account?.accountName || "Primary WhatsApp"}</CardTitle>
              <CardDescription className="mt-1">
                {statusQuery.data?.phoneNumber || account?.phoneNumber || "No number verified"}
              </CardDescription>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className={`px-3 py-1 text-sm font-medium border ${isConnected ? 'bg-accent/10 text-accent border-accent/20' : 'bg-muted text-muted-foreground border-border'}`}
          >
            {isConnected && <span className="w-2 h-2 rounded-full bg-accent mr-2 animate-pulse" />}
            {STATUS_LABEL[status] ?? status}
          </Badge>
        </CardHeader>
        
        <CardContent className="p-8">
          <div className="min-h-[300px] flex flex-col items-center justify-center">
            {status === "qr" && statusQuery.data?.qrDataUrl ? (
              <div className="flex flex-col items-center gap-6 animate-in-stagger">
                <div className="p-4 bg-white rounded-xl shadow-lg border border-border/10 ring-1 ring-black/5">
                  <img src={statusQuery.data.qrDataUrl} alt="WhatsApp QR code" className="w-64 h-64 object-contain" />
                </div>
                <div className="text-center max-w-sm">
                  <h3 className="font-semibold mb-2">Scan to pair</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Open WhatsApp on your phone &rarr; Settings &rarr; Linked Devices &rarr; Link a Device, and point your camera here.
                  </p>
                </div>
              </div>
            ) : status === "connecting" ? (
              <div className="flex flex-col items-center gap-4 text-muted-foreground animate-in-stagger">
                <Loader2 className="w-10 h-10 animate-spin text-accent" />
                <p className="font-medium text-foreground">Negotiating handshake...</p>
              </div>
            ) : status === "connected" ? (
              <div className="flex flex-col items-center gap-4 text-center animate-in-stagger">
                <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center border border-accent/20 mb-2">
                  <CheckCircle2 className="w-10 h-10 text-accent" />
                </div>
                <h3 className="text-2xl font-display font-bold">Secure connection established</h3>
                <p className="text-muted-foreground max-w-md">
                  Your assistant is now actively listening for customer inquiries, orders, and payment receipts on this number.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 text-center text-muted-foreground animate-in-stagger">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center border border-border mb-2">
                  <QrCode className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-medium text-foreground">Ready to pair</h3>
                <p className="text-sm max-w-xs">
                  {statusQuery.data?.lastError || "Generate a secure QR code to authenticate your session."}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-center mt-8 pt-8 border-t border-border/50">
            {!isConnected ? (
              <Button
                size="lg"
                onClick={() => accountId && connectMutation.mutate({ whatsappAccountId: accountId })}
                disabled={!accountId || connectMutation.isPending || status === "connecting" || status === "qr"}
                className="gap-2 px-8 rounded-full font-semibold shadow-[0_0_20px_hsla(152,76%,40%,0.2)] hover:shadow-[0_0_30px_hsla(152,76%,40%,0.4)]"
              >
                <RefreshCw className={`w-5 h-5 ${connectMutation.isPending ? 'animate-spin' : ''}`} />
                {status === "qr" ? "Regenerate Code" : "Initialize Pairing"}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="lg"
                onClick={() => accountId && disconnectMutation.mutate({ whatsappAccountId: accountId })}
                disabled={disconnectMutation.isPending}
                className="gap-2 px-8 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive border-border"
              >
                <Unplug className="w-5 h-5" />
                Terminate Session
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
