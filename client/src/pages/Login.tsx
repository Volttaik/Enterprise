import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex" style={{ background: "hsl(220,28%,96%)" }}>
      {/* Left branding panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[52%] p-12 relative overflow-hidden"
        style={{
          background: "linear-gradient(145deg, hsl(258,84%,58%) 0%, hsl(22,90%,60%) 100%)",
        }}
      >
        {/* Pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
            <img src="/logo-icon.png" alt="Logo" className="w-6 h-6" onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }} />
            <span className="text-white font-bold text-sm hidden">W</span>
          </div>
          <span className="text-white font-display font-bold text-xl tracking-tight">
            WaAssist
          </span>
        </div>

        {/* Hero content */}
        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <h1 className="text-white font-display font-bold text-4xl leading-tight">
              Your AI business
              <br />
              assistant, ready
              <br />
              to work for you.
            </h1>
            <p className="text-white/75 text-lg max-w-sm">
              Manage every customer conversation, order, and payment — all in one place.
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-6">
            {[
              { value: "10x", label: "Faster replies" },
              { value: "98%", label: "Customer satisfaction" },
              { value: "24/7", label: "Always on" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-white font-display font-bold text-2xl">{s.value}</div>
                <div className="text-white/65 text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Illustration card */}
        <div className="relative z-10">
          <div className="rounded-2xl bg-white/15 backdrop-blur border border-white/20 p-4 max-w-xs">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                AI
              </div>
              <div className="space-y-1.5">
                <div className="h-2.5 bg-white/40 rounded-full w-full" />
                <div className="h-2.5 bg-white/30 rounded-full w-4/5" />
                <div className="h-2.5 bg-white/20 rounded-full w-3/5" />
              </div>
            </div>
            <div className="mt-3 text-white/80 text-xs">Replying to a customer enquiry…</div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, hsl(258,84%,62%), hsl(22,90%,62%))" }}
          >
            <span className="text-white font-bold text-sm">W</span>
          </div>
          <span className="font-display font-bold text-xl">WaAssist</span>
        </div>

        <div className="w-full max-w-sm space-y-8">
          {/* Heading */}
          <div className="space-y-1.5">
            <h2 className="font-display font-bold text-2xl" style={{ color: "hsl(228,24%,18%)" }}>
              Welcome back
            </h2>
            <p style={{ color: "hsl(220,12%,52%)" }} className="text-sm">
              Sign in to your workspace
            </p>
          </div>

          {/* Form card */}
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl p-6 space-y-4"
            style={{
              background: "white",
              boxShadow:
                "6px 6px 14px hsla(220,35%,65%,0.3), -4px -4px 10px hsla(0,0%,100%,0.9)",
            }}
          >
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold tracking-wide uppercase" style={{ color: "hsl(220,12%,52%)" }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: "hsl(220,28%,96%)",
                  boxShadow: "inset 3px 3px 7px hsla(220,35%,65%,0.25), inset -2px -2px 5px hsla(0,0%,100%,0.8)",
                  border: "none",
                  color: "hsl(228,24%,18%)",
                }}
                onFocus={(e) => {
                  e.target.style.boxShadow =
                    "inset 3px 3px 7px hsla(220,35%,65%,0.30), inset -2px -2px 5px hsla(0,0%,100%,0.8), 0 0 0 2px hsl(258,84%,62%,0.25)";
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow =
                    "inset 3px 3px 7px hsla(220,35%,65%,0.25), inset -2px -2px 5px hsla(0,0%,100%,0.8)";
                }}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold tracking-wide uppercase" style={{ color: "hsl(220,12%,52%)" }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 pr-12 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: "hsl(220,28%,96%)",
                    boxShadow: "inset 3px 3px 7px hsla(220,35%,65%,0.25), inset -2px -2px 5px hsla(0,0%,100%,0.8)",
                    border: "none",
                    color: "hsl(228,24%,18%)",
                  }}
                  onFocus={(e) => {
                    e.target.style.boxShadow =
                      "inset 3px 3px 7px hsla(220,35%,65%,0.30), inset -2px -2px 5px hsla(0,0%,100%,0.8), 0 0 0 2px hsl(258,84%,62%,0.25)";
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow =
                      "inset 3px 3px 7px hsla(220,35%,65%,0.25), inset -2px -2px 5px hsla(0,0%,100%,0.8)";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium"
                  style={{ color: "hsl(258,84%,62%)" }}
                >
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all active:scale-[0.98] disabled:opacity-60 mt-2"
              style={{
                background: "linear-gradient(135deg, hsl(258,84%,62%), hsl(22,90%,62%))",
                boxShadow: "0 4px 16px hsla(258,84%,62%,0.35)",
              }}
            >
              {loginMutation.isPending ? "Signing in…" : "Sign in"}
            </button>
          </form>

          {/* Switch to register */}
          <p className="text-center text-sm" style={{ color: "hsl(220,12%,52%)" }}>
            Don't have an account?{" "}
            <a
              href="/register"
              className="font-semibold"
              style={{ color: "hsl(258,84%,62%)" }}
              onClick={(e) => {
                e.preventDefault();
                navigate("/register");
              }}
            >
              Create one free
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
