import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Smartphone,
  QrCode,
  Phone,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Wifi,
  WifiOff,
  Copy,
} from "lucide-react";

const GREEN = "hsl(142,72%,40%)";
const GREEN_BG = "hsl(142,55%,93%)";
const BORDER = "hsl(0,0%,86%)";

type PairingMethod = "qr" | "phone";

export default function WhatsAppSetup() {
  const [pairingMethod, setPairingMethod] = useState<PairingMethod>("qr");
  const [phoneInput, setPhoneInput] = useState("");
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<number | null>(null);

  const getOrCreateMutation = trpc.whatsapp.getOrCreateDefaultAccount.useMutation({
    onSuccess: (account) => { if (account) setAccountId(account.id); },
    onError: (err) => toast.error(err.message),
  });

  const connectMutation = trpc.whatsapp.connect.useMutation({
    onSuccess: () => toast.success("Connection started"),
    onError: (err) => toast.error(err.message),
  });

  const disconnectMutation = trpc.whatsapp.disconnect.useMutation({
    onSuccess: () => { toast.success("Disconnected"); setPairingCode(null); },
    onError: (err) => toast.error(err.message),
  });

  const phoneCodeMutation = trpc.whatsapp.requestPhoneCode.useMutation({
    onSuccess: ({ code }) => { setPairingCode(code); toast.success("Enter this code in WhatsApp"); },
    onError: (err) => toast.error(err.message),
  });

  const statusQuery = trpc.whatsapp.getStatus.useQuery(
    { whatsappAccountId: accountId! },
    {
      enabled: !!accountId,
      refetchInterval: (data) => {
        const s = (data as any)?.status;
        return s === "qr" || s === "connecting" || s === "phone_pairing" ? 3000 : false;
      },
    }
  );

  const accountsQuery = trpc.whatsapp.getAccounts.useQuery();
  const accounts = accountsQuery.data ?? [];

  const status = statusQuery.data?.status ?? "idle";
  const qrDataUrl = statusQuery.data?.qrDataUrl;
  const phoneNumber = statusQuery.data?.phoneNumber;

  const handleConnect = async () => {
    let id = accountId;
    if (!id) { const r = await getOrCreateMutation.mutateAsync(); id = r?.id ?? null; }
    if (!id) return;
    setAccountId(id);
    setPairingCode(null);
    connectMutation.mutate({ whatsappAccountId: id });
  };

  const handlePhoneConnect = async () => {
    if (!phoneInput.trim()) { toast.error("Please enter a phone number"); return; }
    let id = accountId;
    if (!id) { const r = await getOrCreateMutation.mutateAsync(); id = r?.id ?? null; }
    if (!id) return;
    setAccountId(id);
    await connectMutation.mutateAsync({ whatsappAccountId: id });
    await new Promise((r) => setTimeout(r, 2500));
    phoneCodeMutation.mutate({ whatsappAccountId: id, phoneNumber: phoneInput.replace(/\D/g, "") });
  };

  const statusMeta: Record<string, { label: string; color: string; bg: string; border: string }> = {
    idle:          { label: "Not connected",    color: "hsl(215,15%,50%)", bg: "hsl(0,0%,96%)",     border: BORDER },
    connecting:    { label: "Connecting…",      color: "hsl(38,85%,46%)",  bg: "hsl(38,90%,94%)",   border: "hsl(38,80%,80%)" },
    qr:            { label: "Scan QR code",     color: "hsl(38,85%,46%)",  bg: "hsl(38,90%,94%)",   border: "hsl(38,80%,80%)" },
    phone_pairing: { label: "Enter code",       color: "hsl(38,85%,46%)",  bg: "hsl(38,90%,94%)",   border: "hsl(38,80%,80%)" },
    connected:     { label: "Connected",        color: GREEN,              bg: GREEN_BG,             border: "hsl(142,50%,78%)" },
    disconnected:  { label: "Disconnected",     color: "hsl(0,65%,52%)",   bg: "hsl(0,65%,95%)",    border: "hsl(0,60%,82%)" },
    error:         { label: "Connection error", color: "hsl(0,65%,52%)",   bg: "hsl(0,65%,95%)",    border: "hsl(0,60%,82%)" },
  };

  const meta = statusMeta[status] ?? statusMeta.idle;

  return (
    <div className="space-y-5 animate-in-stagger max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-xl" style={{ color: "hsl(215,25%,13%)" }}>
          WhatsApp Connection
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "hsl(215,15%,50%)" }}>
          Link your WhatsApp Business number to start automating replies.
        </p>
      </div>

      {/* Accounts list */}
      {accounts.length > 0 && (
        <div className="rounded-xl border overflow-hidden card-shadow" style={{ borderColor: BORDER }}>
          <div className="px-4 py-2.5 border-b" style={{ background: "hsl(0,0%,98%)", borderColor: BORDER }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "hsl(215,15%,50%)" }}>
              Your assistants
            </p>
          </div>
          <div className="divide-y" style={{ background: "white" }}>
            {accounts.map((acc) => (
              <div key={acc.id} className="flex items-center gap-3 px-4 py-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: acc.isActive ? GREEN_BG : "hsl(0,0%,93%)" }}
                >
                  {acc.isActive
                    ? <Wifi style={{ width: 16, height: 16, color: GREEN }} />
                    : <WifiOff style={{ width: 16, height: 16, color: "hsl(215,15%,52%)" }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "hsl(215,25%,13%)" }}>
                    {acc.accountName}
                  </p>
                  <p className="text-xs truncate" style={{ color: "hsl(215,15%,52%)" }}>
                    {acc.phoneNumber?.startsWith("pending") ? "Not paired yet" : `+${acc.phoneNumber}`}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: acc.isActive ? GREEN : "hsl(0,0%,76%)" }} />
                  <span className="text-xs font-medium" style={{ color: acc.isActive ? GREEN : "hsl(215,15%,52%)" }}>
                    {acc.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                {!acc.isActive && (
                  <button
                    onClick={() => { setAccountId(acc.id); connectMutation.mutate({ whatsappAccountId: acc.id }); }}
                    className="px-3 py-1.5 rounded-md text-xs font-semibold text-white transition-all"
                    style={{ background: GREEN }}
                  >
                    Connect
                  </button>
                )}
                {acc.isActive && (
                  <button
                    onClick={() => disconnectMutation.mutate({ whatsappAccountId: acc.id })}
                    className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                    style={{ background: "hsl(0,65%,95%)", color: "hsl(0,65%,48%)" }}
                  >
                    Disconnect
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current connection status */}
      {accountId && (
        <div
          className="rounded-xl border p-4 flex items-center gap-3"
          style={{ background: meta.bg, borderColor: meta.border }}
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: status === "connected" ? GREEN : "white" }}
          >
            {status === "connected" ? (
              <CheckCircle className="w-5 h-5 text-white" />
            ) : status === "error" || status === "disconnected" ? (
              <AlertCircle style={{ width: 18, height: 18, color: "hsl(0,65%,52%)" }} />
            ) : (
              <Loader2 style={{ width: 18, height: 18, color: meta.color }} className="animate-spin" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: meta.color }}>
              {meta.label}
            </p>
            {phoneNumber && status === "connected" && (
              <p className="text-xs mt-0.5" style={{ color: "hsl(142,60%,28%)" }}>+{phoneNumber}</p>
            )}
            {statusQuery.data?.lastError && (
              <p className="text-xs mt-0.5" style={{ color: "hsl(0,65%,52%)" }}>{statusQuery.data.lastError}</p>
            )}
          </div>
        </div>
      )}

      {/* New connection card */}
      {status !== "connected" && (
        <div
          className="rounded-xl border overflow-hidden card-shadow"
          style={{ background: "white", borderColor: BORDER }}
        >
          <div className="px-4 py-3 border-b" style={{ background: "hsl(0,0%,98%)", borderColor: BORDER }}>
            <p className="text-sm font-semibold" style={{ color: "hsl(215,25%,13%)" }}>
              Connect a new number
            </p>
            <p className="text-xs mt-0.5" style={{ color: "hsl(215,15%,52%)" }}>
              Choose how to link your WhatsApp
            </p>
          </div>

          <div className="p-4 space-y-4">
            {/* Method toggle */}
            <div
              className="flex gap-1 p-1 rounded-lg border"
              style={{ background: "hsl(0,0%,96%)", borderColor: BORDER }}
            >
              {([
                { id: "qr" as const, label: "Scan QR Code", icon: QrCode },
                { id: "phone" as const, label: "Phone Number", icon: Phone },
              ]).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => { setPairingMethod(id); setPairingCode(null); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-semibold transition-all"
                  style={
                    pairingMethod === id
                      ? { background: "white", color: GREEN, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }
                      : { color: "hsl(215,15%,52%)" }
                  }
                >
                  <Icon style={{ width: 14, height: 14 }} />
                  {label}
                </button>
              ))}
            </div>

            {/* QR method */}
            {pairingMethod === "qr" && (
              <div className="space-y-4">
                <div className="space-y-2 text-sm" style={{ color: "hsl(215,15%,45%)" }}>
                  {["Open WhatsApp on your phone", "Go to Settings → Linked Devices", "Tap 'Link a Device' and scan the QR code"].map((step, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                        style={{ background: GREEN_BG, color: GREEN }}
                      >
                        {i + 1}
                      </div>
                      <span className="text-[13px]">{step}</span>
                    </div>
                  ))}
                </div>

                {qrDataUrl ? (
                  <div className="flex justify-center">
                    <div className="p-3 border rounded-xl inline-block" style={{ borderColor: BORDER }}>
                      <img src={qrDataUrl} alt="QR Code" className="w-48 h-48" />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleConnect}
                    disabled={connectMutation.isPending || getOrCreateMutation.isPending}
                    className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                    style={{ background: GREEN }}
                  >
                    {connectMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Connecting…</>
                    ) : (
                      <><QrCode className="w-4 h-4" /> Generate QR Code</>
                    )}
                  </button>
                )}

                {(status === "qr" || status === "connecting") && (
                  <button
                    onClick={handleConnect}
                    className="w-full py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 border transition-all hover:bg-gray-50"
                    style={{ borderColor: BORDER, color: "hsl(215,15%,50%)" }}
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh QR
                  </button>
                )}
              </div>
            )}

            {/* Phone method */}
            {pairingMethod === "phone" && (
              <div className="space-y-4">
                <div className="space-y-2" style={{ color: "hsl(215,15%,45%)" }}>
                  {[
                    "Enter your WhatsApp number below (with country code)",
                    "Open WhatsApp → Settings → Linked Devices → Link with phone number",
                    "Enter the 8-character code shown here",
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                        style={{ background: GREEN_BG, color: GREEN }}
                      >
                        {i + 1}
                      </div>
                      <span className="text-[13px]">{step}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "hsl(215,15%,50%)" }}>
                    Phone number (with country code)
                  </label>
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="e.g. 2348061938576"
                    className="w-full px-3 py-2.5 text-sm"
                    autoComplete="tel"
                  />
                </div>

                {pairingCode ? (
                  <div className="space-y-3">
                    <div
                      className="rounded-xl border p-4 text-center"
                      style={{ background: GREEN_BG, borderColor: "hsl(142,50%,78%)" }}
                    >
                      <p className="text-xs font-semibold mb-2" style={{ color: "hsl(142,60%,28%)" }}>
                        Your pairing code
                      </p>
                      <div className="flex items-center justify-center gap-3">
                        <p
                          className="font-display font-bold text-3xl tracking-[0.2em]"
                          style={{ color: GREEN }}
                        >
                          {pairingCode}
                        </p>
                        <button
                          onClick={() => { navigator.clipboard.writeText(pairingCode); toast.success("Copied!"); }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center border transition-all hover:bg-white"
                          style={{ borderColor: "hsl(142,50%,78%)", color: GREEN }}
                        >
                          <Copy style={{ width: 14, height: 14 }} />
                        </button>
                      </div>
                      <p className="text-xs mt-2" style={{ color: "hsl(142,55%,36%)" }}>
                        Enter this in WhatsApp → Linked Devices → Link with phone number
                      </p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handlePhoneConnect}
                    disabled={phoneCodeMutation.isPending || connectMutation.isPending || getOrCreateMutation.isPending}
                    className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                    style={{ background: GREEN }}
                  >
                    {phoneCodeMutation.isPending || connectMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Getting code…</>
                    ) : (
                      <><Phone className="w-4 h-4" /> Get pairing code</>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Connected state */}
      {status === "connected" && (
        <div
          className="rounded-xl border p-4 card-shadow"
          style={{ background: "white", borderColor: BORDER }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: GREEN_BG }}
            >
              <Smartphone style={{ width: 18, height: 18, color: GREEN }} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: "hsl(215,25%,13%)" }}>
                WhatsApp is connected
              </p>
              <p className="text-xs mt-0.5" style={{ color: "hsl(215,15%,52%)" }}>
                Your AI assistant is now active and will reply to incoming messages automatically.
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t flex justify-end" style={{ borderColor: BORDER }}>
            <button
              onClick={() => accountId && disconnectMutation.mutate({ whatsappAccountId: accountId })}
              disabled={disconnectMutation.isPending}
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{ background: "hsl(0,65%,95%)", color: "hsl(0,65%,48%)" }}
            >
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
