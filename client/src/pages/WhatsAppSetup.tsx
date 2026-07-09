import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Loader2, QrCode, RefreshCw, Unplug } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  idle: "Not connected",
  connecting: "Connecting…",
  qr: "Scan the QR code",
  connected: "Connected",
  disconnected: "Disconnected",
  error: "Connection error",
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountQuery.isLoading, accountQuery.data]);

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
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Connect WhatsApp</h2>
        <p className="text-muted-foreground mt-1">
          Pair your personal WhatsApp account so the assistant can read and reply to your chats.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>{account?.accountName || "My WhatsApp"}</CardTitle>
            <CardDescription>
              {statusQuery.data?.phoneNumber || account?.phoneNumber || "No number linked yet"}
            </CardDescription>
          </div>
          <Badge variant={isConnected ? "default" : "secondary"} className="gap-1">
            {isConnected && <CheckCircle2 className="w-3.5 h-3.5" />}
            {STATUS_LABEL[status] ?? status}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === "qr" && statusQuery.data?.qrDataUrl && (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="p-4 bg-white rounded-lg border">
                <img src={statusQuery.data.qrDataUrl} alt="WhatsApp QR code" className="w-56 h-56" />
              </div>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                Open WhatsApp on your phone → Settings → Linked Devices → Link a Device, then scan this code.
              </p>
            </div>
          )}

          {status === "connecting" && (
            <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm">Preparing pairing session…</p>
            </div>
          )}

          {status === "connected" && (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              <p className="font-medium">WhatsApp is connected</p>
              <p className="text-sm text-muted-foreground">
                Incoming messages will be answered automatically and logged to your conversations.
              </p>
            </div>
          )}

          {(status === "idle" || status === "disconnected" || status === "error") && (
            <div className="flex flex-col items-center gap-3 py-8 text-center text-muted-foreground">
              <QrCode className="w-10 h-10" />
              <p className="text-sm">
                {statusQuery.data?.lastError || "Not connected yet. Start pairing to generate a QR code."}
              </p>
            </div>
          )}

          <div className="flex justify-center gap-3">
            {!isConnected ? (
              <Button
                onClick={() => accountId && connectMutation.mutate({ whatsappAccountId: accountId })}
                disabled={!accountId || connectMutation.isPending || status === "connecting" || status === "qr"}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                {status === "qr" ? "Waiting for scan…" : "Start pairing"}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => accountId && disconnectMutation.mutate({ whatsappAccountId: accountId })}
                disabled={disconnectMutation.isPending}
                className="gap-2"
              >
                <Unplug className="w-4 h-4" />
                Disconnect
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
