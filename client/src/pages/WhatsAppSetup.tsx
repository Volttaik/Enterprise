import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Smartphone, QrCode, Phone, CheckCircle, AlertCircle, Loader2, RefreshCw } from "lucide-react";

type PairingMethod = "qr" | "phone";

export default function WhatsAppSetup() {
  const [pairingMethod, setPairingMethod] = useState<PairingMethod>("qr");
  const [phoneInput, setPhoneInput] = useState("");
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<number | null>(null);

  const getOrCreateMutation = trpc.whatsapp.getOrCreateDefaultAccount.useMutation({
    onSuccess: (account) => {
      if (account) setAccountId(account.id);
    },
    onError: (err) => toast.error(err.message),
  });

  const connectMutation = trpc.whatsapp.connect.useMutation({
    onSuccess: () => toast.success("Connection started — scan the QR code"),
    onError: (err) => toast.error(err.message),
  });

  const disconnectMutation = trpc.whatsapp.disconnect.useMutation({
    onSuccess: () => {
      toast.success("Disconnected successfully");
      setPairingCode(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const phoneCodeMutation = trpc.whatsapp.requestPhoneCode.useMutation({
    onSuccess: ({ code }) => {
      setPairingCode(code);
      toast.success("Pairing code received — enter it in WhatsApp");
    },
    onError: (err) => toast.error(err.message),
  });

  const statusQuery = trpc.whatsapp.getStatus.useQuery(
    { whatsappAccountId: accountId! },
    {
      enabled: !!accountId,
      refetchInterval: (data) => {
        const status = data?.state?.data?.status;
        return status === "qr" || status === "connecting" ? 3000 : false;
      },
    }
  );

  const status = statusQuery.data?.status ?? "idle";
  const qrDataUrl = statusQuery.data?.qrDataUrl;
  const phoneNumber = statusQuery.data?.phoneNumber;

  const handleConnect = async () => {
    let id = accountId;
    if (!id) {
      const result = await getOrCreateMutation.mutateAsync();
      id = result?.id ?? null;
    }
    if (!id) return;
    setAccountId(id);
    setPairingCode(null);
    connectMutation.mutate({ whatsappAccountId: id });
  };

  const handlePhoneConnect = async () => {
    if (!phoneInput.trim()) {
      toast.error("Please enter a phone number");
      return;
    }
    let id = accountId;
    if (!id) {
      const result = await getOrCreateMutation.mutateAsync();
      id = result?.id ?? null;
    }
    if (!id) return;
    setAccountId(id);
    // Start connection first, then request pairing code
    await connectMutation.mutateAsync({ whatsappAccountId: id });
    // Give Baileys a moment to initialise before requesting the code
    await new Promise((r) => setTimeout(r, 2500));
    phoneCodeMutation.mutate({
      whatsappAccountId: id,
      phoneNumber: phoneInput.replace(/\D/g, ""),
    });
  };

  const statusColors: Record<string, string> = {
    idle: "hsl(220,12%,55%)",
    connecting: "hsl(38,90%,55%)",
    qr: "hsl(38,90%,55%)",
    connected: "hsl(152,65%,45%)",
    disconnected: "hsl(0,65%,60%)",
    error: "hsl(0,65%,60%)",
  };

  const statusLabels: Record<string, string> = {
    idle: "Not connected",
    connecting: "Connecting…",
    qr: "Waiting for scan",
    connected: "Connected",
    disconnected: "Disconnected",
    error: "Connection error",
  };

  return (
    <div className="space-y-6 animate-in-stagger">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-2xl" style={{ color: "hsl(228,24%,18%)" }}>
          WhatsApp Connection
        </h1>
        <p style={{ color: "hsl(220,12%,52%)" }} className="text-sm mt-1">
          Link your WhatsApp Business number to start receiving and sending messages.
        </p>
      </div>

      {/* Status card */}
      {accountId && (
        <div
          className="rounded-2xl p-5 flex items-center gap-4"
          style={{
            background: "white",
            boxShadow: "6px 6px 14px hsla(220,35%,65%,0.18), -4px -4px 10px hsla(0,0%,100%,0.85)",
          }}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{
              background:
                status === "connected"
                  ? "hsl(152,65%,94%)"
                  : status === "error" || status === "disconnected"
                  ? "hsl(0,65%,94%)"
                  : "hsl(38,90%,94%)",
            }}
          >
            {status === "connected" ? (
              <CheckCircle className="w-6 h-6" style={{ color: "hsl(152,65%,45%)" }} />
            ) : status === "error" || status === "disconnected" ? (
              <AlertCircle className="w-6 h-6" style={{ color: "hsl(0,65%,60%)" }} />
            ) : (
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: "hsl(38,90%,55%)" }} />
            )}
          </div>
          <div className="flex-1">
            <p className="font-semibold" style={{ color: "hsl(228,24%,18%)" }}>
              {statusLabels[status] ?? status}
            </p>
            {phoneNumber && status === "connected" && (
              <p className="text-sm mt-0.5" style={{ color: "hsl(220,12%,52%)" }}>
                Connected as +{phoneNumber}
              </p>
            )}
            {statusQuery.data?.lastError && (
              <p className="text-sm mt-0.5" style={{ color: "hsl(0,65%,60%)" }}>
                {statusQuery.data.lastError}
              </p>
            )}
          </div>
          {status === "connected" && (
            <button
              onClick={() => disconnectMutation.mutate({ whatsappAccountId: accountId! })}
              disabled={disconnectMutation.isPending}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: "hsl(0,65%,94%)",
                color: "hsl(0,65%,50%)",
              }}
            >
              Disconnect
            </button>
          )}
        </div>
      )}

      {/* Pairing method selector */}
      {status !== "connected" && (
        <div
          className="rounded-2xl p-6 space-y-5"
          style={{
            background: "white",
            boxShadow: "6px 6px 14px hsla(220,35%,65%,0.18), -4px -4px 10px hsla(0,0%,100%,0.85)",
          }}
        >
          <h2 className="font-display font-semibold text-lg" style={{ color: "hsl(228,24%,18%)" }}>
            How would you like to connect?
          </h2>

          {/* Method toggle */}
          <div
            className="flex gap-2 p-1.5 rounded-2xl"
            style={{ background: "hsl(220,28%,96%)" }}
          >
            {([
              { id: "qr", label: "QR Code", icon: QrCode },
              { id: "phone", label: "Phone Number", icon: Phone },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setPairingMethod(id)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={
                  pairingMethod === id
                    ? {
                        background: "white",
                        color: "hsl(258,84%,62%)",
                        boxShadow:
                          "4px 4px 10px hsla(220,35%,65%,0.25), -3px -3px 8px hsla(0,0%,100%,0.85)",
                      }
                    : { color: "hsl(220,12%,55%)" }
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* QR method */}
          {pairingMethod === "qr" && (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: "hsl(220,12%,52%)" }}>
                Open WhatsApp on your phone → Settings → Linked devices → Link a device, then scan the QR code below.
              </p>

              {qrDataUrl ? (
                <div className="flex flex-col items-center gap-4">
                  <div
                    className="p-4 rounded-2xl"
                    style={{
                      background: "hsl(220,28%,96%)",
                      boxShadow: "inset 3px 3px 8px hsla(220,35%,65%,0.25), inset -2px -2px 6px hsla(0,0%,100%,0.8)",
                    }}
                  >
                    <img src={qrDataUrl} alt="WhatsApp QR Code" className="w-56 h-56 rounded-xl" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <p className="text-sm" style={{ color: "hsl(38,90%,45%)" }}>
                      Waiting for scan…
                    </p>
                  </div>
                  <button
                    onClick={handleConnect}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                    style={{ background: "hsl(220,28%,96%)", color: "hsl(220,12%,52%)" }}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh QR
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleConnect}
                  disabled={connectMutation.isPending || getOrCreateMutation.isPending}
                  className="w-full py-3.5 rounded-2xl font-semibold text-sm text-white transition-all active:scale-[0.98] disabled:opacity-60"
                  style={{
                    background: "linear-gradient(135deg, hsl(258,84%,62%), hsl(22,90%,62%))",
                    boxShadow: "0 4px 16px hsla(258,84%,62%,0.30)",
                  }}
                >
                  {connectMutation.isPending || getOrCreateMutation.isPending
                    ? "Starting connection…"
                    : "Generate QR Code"}
                </button>
              )}
            </div>
          )}

          {/* Phone number method */}
          {pairingMethod === "phone" && (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: "hsl(220,12%,52%)" }}>
                Enter your WhatsApp phone number (with country code) and we'll generate a pairing code to enter in your WhatsApp settings.
              </p>

              <div className="space-y-2">
                <label
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "hsl(220,12%,52%)" }}
                >
                  Phone number
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="e.g. 447911123456"
                    className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
                    style={{
                      background: "hsl(220,28%,96%)",
                      boxShadow:
                        "inset 3px 3px 7px hsla(220,35%,65%,0.25), inset -2px -2px 5px hsla(0,0%,100%,0.8)",
                      border: "none",
                      color: "hsl(228,24%,18%)",
                    }}
                  />
                  <button
                    onClick={handlePhoneConnect}
                    disabled={
                      phoneCodeMutation.isPending ||
                      connectMutation.isPending ||
                      getOrCreateMutation.isPending ||
                      !phoneInput.trim()
                    }
                    className="px-5 py-3 rounded-xl font-semibold text-sm text-white transition-all active:scale-[0.98] disabled:opacity-60"
                    style={{
                      background: "linear-gradient(135deg, hsl(258,84%,62%), hsl(22,90%,62%))",
                      boxShadow: "0 4px 12px hsla(258,84%,62%,0.30)",
                    }}
                  >
                    {phoneCodeMutation.isPending || connectMutation.isPending
                      ? "Getting code…"
                      : "Get Code"}
                  </button>
                </div>
                <p className="text-xs" style={{ color: "hsl(220,12%,65%)" }}>
                  Include country code without + (e.g. 447911123456 for UK +44 7911 123456)
                </p>
              </div>

              {/* Show pairing code */}
              {pairingCode && (
                <div
                  className="rounded-2xl p-5 text-center space-y-2"
                  style={{
                    background: "hsl(258,84%,97%)",
                    border: "2px solid hsl(258,84%,88%)",
                  }}
                >
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "hsl(258,84%,52%)" }}>
                    Your pairing code
                  </p>
                  <p
                    className="font-display font-bold text-4xl tracking-[0.3em]"
                    style={{ color: "hsl(258,84%,45%)" }}
                  >
                    {pairingCode}
                  </p>
                  <p className="text-xs" style={{ color: "hsl(258,84%,55%)" }}>
                    Open WhatsApp → Settings → Linked Devices → Link with phone number → enter this code
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Help card */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: "linear-gradient(135deg, hsl(258,84%,97%), hsl(22,90%,97%))",
          border: "1px solid hsl(258,84%,90%)",
        }}
      >
        <h3 className="font-semibold text-sm mb-2" style={{ color: "hsl(228,24%,25%)" }}>
          Need help connecting?
        </h3>
        <ul className="space-y-1.5 text-xs" style={{ color: "hsl(220,12%,52%)" }}>
          <li>• Make sure you're using the latest version of WhatsApp</li>
          <li>• For QR: Open WhatsApp → tap the three-dot menu → Linked Devices</li>
          <li>• For phone number: Open WhatsApp → Settings → Linked Devices → Link with phone number</li>
          <li>• Each account can only be linked to one device at a time</li>
        </ul>
      </div>
    </div>
  );
}
