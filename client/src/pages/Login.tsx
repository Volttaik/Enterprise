import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { MessageSquare, Eye, EyeOff } from "lucide-react";
import loginHeroBg from "@/assets/login-hero-bg.jpg";

const GREEN = "hsl(142,72%,40%)";

export default function Login() {
  const [, navigate] = useLocation();
  const { refetch } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await refetch();
      navigate("/dashboard");
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="min-h-screen flex" style={{ background: "hsl(0,0%,96%)" }}>
      {/* Left panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[46%] p-10 relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(155deg, hsla(142,72%,20%,0.75) 0%, hsla(162,68%,18%,0.75) 100%), url(${loginHeroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-display font-bold text-base tracking-tight">WaAssist</span>
        </div>

        {/* Hero */}
        <div className="relative z-10 space-y-5">
          <div className="space-y-2">
            <h1 className="text-white font-display font-bold text-3xl leading-tight">
              Your AI business<br />assistant, ready<br />to work for you.
            </h1>
            <p className="text-white/70 text-sm max-w-xs">
              Manage every customer conversation, order, and payment — all in one place.
            </p>
          </div>
          <div className="flex gap-6">
            {[
              { value: "10x", label: "Faster replies" },
              { value: "98%", label: "Satisfaction" },
              { value: "24/7", label: "Always on" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-white font-display font-bold text-xl">{s.value}</div>
                <div className="text-white/60 text-[10px] mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Illustration */}
        <div className="relative z-10">
          <div className="rounded-xl bg-white/10 border border-white/15 p-3.5 max-w-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-white/25 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                AI
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="h-1.5 bg-white/35 rounded-full w-full" />
                <div className="h-1.5 bg-white/25 rounded-full w-4/5" />
                <div className="h-1.5 bg-white/15 rounded-full w-3/5" />
              </div>
            </div>
            <p className="text-white/60 text-[10px] mt-2">Replying to a customer enquiry…</p>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Mobile logo */}
        <div className="lg:hidden mb-6 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: GREEN }}>
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-base">WaAssist</span>
        </div>

        <div className="w-full max-w-[340px] space-y-5">
          <div className="space-y-1">
            <h2 className="font-display font-bold text-lg" style={{ color: "hsl(215,25%,15%)" }}>
              Welcome back
            </h2>
            <p className="text-xs" style={{ color: "hsl(215,15%,52%)" }}>
              Sign in to your workspace
            </p>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); loginMutation.mutate({ email, password }); }}
            className="rounded-xl border p-5 space-y-3.5 card-shadow"
            style={{ background: "white", borderColor: "hsl(0,0%,88%)" }}
          >
            {/* Email */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "hsl(215,15%,50%)" }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                autoComplete="email"
                className="w-full px-3 py-2 text-xs"
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "hsl(215,15%,50%)" }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full px-3 py-2 pr-9 text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2"
                  style={{ color: "hsl(215,15%,52%)" }}
                >
                  {showPass
                    ? <EyeOff style={{ width: 13, height: 13 }} />
                    : <Eye style={{ width: 13, height: 13 }} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full py-2.5 rounded-md font-semibold text-xs text-white transition-all active:scale-[0.98] disabled:opacity-60"
              style={{ background: GREEN }}
            >
              {loginMutation.isPending ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-center text-xs" style={{ color: "hsl(215,15%,52%)" }}>
            Don't have an account?{" "}
            <a
              href="/register"
              className="font-semibold"
              style={{ color: GREEN }}
              onClick={(e) => { e.preventDefault(); navigate("/register"); }}
            >
              Create one free
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
