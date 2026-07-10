import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { MessageSquare, Eye, EyeOff, Check } from "lucide-react";
import loginHeroBg from "@/assets/login-hero-bg.jpg";

const GREEN = "hsl(142,72%,40%)";

export default function Register() {
  const [, navigate] = useLocation();
  const { refetch } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async () => {
      toast.success("Account created! Welcome aboard.");
      await refetch();
      navigate("/dashboard");
    },
    onError: (err) => toast.error(err.message),
  });

  const strength = Math.min(4, Math.floor(password.length / 3));

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
          <span className="text-white font-display font-bold text-base">WaAssist</span>
        </div>

        {/* Hero */}
        <div className="relative z-10 space-y-5">
          <div className="space-y-2">
            <h1 className="text-white font-display font-bold text-3xl leading-tight">
              Start automating<br />your business<br />conversations.
            </h1>
            <p className="text-white/70 text-sm max-w-xs">
              Set up your AI assistant in minutes. No technical knowledge needed.
            </p>
          </div>
          <div className="space-y-2">
            {[
              "Instant WhatsApp AI replies",
              "Full CRM & order tracking",
              "Smart payment verification",
              "Multi-account support",
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Check style={{ width: 9, height: 9, color: "white" }} />
                </div>
                <span className="text-white/80 text-xs">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div className="relative z-10">
          <div className="rounded-xl bg-white/10 border border-white/15 p-3.5 max-w-xs">
            <p className="text-white/70 text-xs italic">
              "WaAssist saves us 4 hours a day. Our customers get instant answers even at midnight."
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white/25 flex-shrink-0" />
              <div>
                <div className="text-white text-[10px] font-semibold">Sarah K.</div>
                <div className="text-white/55 text-[10px]">Online Fashion Store</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="lg:hidden mb-6 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: GREEN }}>
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-base">WaAssist</span>
        </div>

        <div className="w-full max-w-[340px] space-y-5">
          <div className="space-y-1">
            <h2 className="font-display font-bold text-lg" style={{ color: "hsl(215,25%,15%)" }}>
              Create your workspace
            </h2>
            <p className="text-xs" style={{ color: "hsl(215,15%,52%)" }}>
              Free to start, no credit card required
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (password.length < 8) { toast.error("Password must be at least 8 characters."); return; }
              registerMutation.mutate({ name, email, password });
            }}
            className="rounded-xl border p-5 space-y-3 card-shadow"
            style={{ background: "white", borderColor: "hsl(0,0%,88%)" }}
          >
            {/* Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "hsl(215,15%,50%)" }}>
                Your name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                required
                minLength={2}
                autoComplete="name"
                className="w-full px-3 py-2 text-xs"
              />
            </div>

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
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
                  autoComplete="new-password"
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

              {/* Strength bar */}
              {password.length > 0 && (
                <div className="flex gap-1 mt-1.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-1 flex-1 rounded-full transition-all"
                      style={{
                        background: strength >= i
                          ? strength <= 2 ? "hsl(38,85%,52%)" : GREEN
                          : "hsl(0,0%,88%)",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full py-2.5 rounded-md font-semibold text-xs text-white transition-all active:scale-[0.98] disabled:opacity-60"
              style={{ background: GREEN }}
            >
              {registerMutation.isPending ? "Creating workspace…" : "Create free workspace"}
            </button>

            <p className="text-center text-[10px]" style={{ color: "hsl(215,15%,60%)" }}>
              By signing up you agree to our Terms of Service
            </p>
          </form>

          <p className="text-center text-xs" style={{ color: "hsl(215,15%,52%)" }}>
            Already have an account?{" "}
            <a
              href="/login"
              className="font-semibold"
              style={{ color: GREEN }}
              onClick={(e) => { e.preventDefault(); navigate("/login"); }}
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
