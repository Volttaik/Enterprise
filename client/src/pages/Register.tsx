import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    registerMutation.mutate({ name, email, password });
  };

  const inputStyle = {
    background: "hsl(220,28%,96%)",
    boxShadow: "inset 3px 3px 7px hsla(220,35%,65%,0.25), inset -2px -2px 5px hsla(0,0%,100%,0.8)",
    border: "none",
    color: "hsl(228,24%,18%)",
  };

  const inputFocusStyle = {
    ...inputStyle,
    boxShadow:
      "inset 3px 3px 7px hsla(220,35%,65%,0.30), inset -2px -2px 5px hsla(0,0%,100%,0.8), 0 0 0 2px hsl(258,84%,62%,0.25)",
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
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
            <span className="text-white font-bold text-sm">W</span>
          </div>
          <span className="text-white font-display font-bold text-xl tracking-tight">WaAssist</span>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <h1 className="text-white font-display font-bold text-4xl leading-tight">
              Start automating
              <br />
              your business
              <br />
              conversations.
            </h1>
            <p className="text-white/75 text-lg max-w-sm">
              Set up your AI assistant in minutes. No technical knowledge needed.
            </p>
          </div>

          <div className="space-y-3">
            {[
              "Instant WhatsApp AI replies",
              "Full CRM & order tracking",
              "Smart payment verification",
              "Multi-account support",
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
                <span className="text-white/85 text-sm">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="rounded-2xl bg-white/15 backdrop-blur border border-white/20 p-4 max-w-xs">
            <p className="text-white/70 text-xs italic">
              "WaAssist saves us 4 hours a day. Our customers get instant answers even at midnight."
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white/30" />
              <div>
                <div className="text-white text-xs font-semibold">Sarah K.</div>
                <div className="text-white/60 text-xs">Online Fashion Store</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
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
          <div className="space-y-1.5">
            <h2 className="font-display font-bold text-2xl" style={{ color: "hsl(228,24%,18%)" }}>
              Create your workspace
            </h2>
            <p style={{ color: "hsl(220,12%,52%)" }} className="text-sm">
              Free to start, no credit card required
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-3xl p-6 space-y-4"
            style={{
              background: "white",
              boxShadow:
                "6px 6px 14px hsla(220,35%,65%,0.3), -4px -4px 10px hsla(0,0%,100%,0.9)",
            }}
          >
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold tracking-wide uppercase" style={{ color: "hsl(220,12%,52%)" }}>
                Your name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                required
                minLength={2}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={inputStyle}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.target.style, inputStyle)}
              />
            </div>

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
                style={inputStyle}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.target.style, inputStyle)}
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
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
                  className="w-full px-4 py-3 pr-12 rounded-xl text-sm outline-none transition-all"
                  style={inputStyle}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.target.style, inputStyle)}
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

              {/* Password strength indicator */}
              {password.length > 0 && (
                <div className="flex gap-1 mt-1.5">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="h-1 flex-1 rounded-full transition-all"
                      style={{
                        background:
                          password.length >= (i + 1) * 3
                            ? i < 2
                              ? "hsl(22,90%,62%)"
                              : "hsl(152,65%,45%)"
                            : "hsl(220,20%,88%)",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all active:scale-[0.98] disabled:opacity-60 mt-2"
              style={{
                background: "linear-gradient(135deg, hsl(258,84%,62%), hsl(22,90%,62%))",
                boxShadow: "0 4px 16px hsla(258,84%,62%,0.35)",
              }}
            >
              {registerMutation.isPending ? "Creating workspace…" : "Create free workspace"}
            </button>

            <p className="text-center text-xs" style={{ color: "hsl(220,12%,65%)" }}>
              By signing up you agree to our Terms of Service
            </p>
          </form>

          <p className="text-center text-sm" style={{ color: "hsl(220,12%,52%)" }}>
            Already have an account?{" "}
            <a
              href="/login"
              className="font-semibold"
              style={{ color: "hsl(258,84%,62%)" }}
              onClick={(e) => {
                e.preventDefault();
                navigate("/login");
              }}
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
