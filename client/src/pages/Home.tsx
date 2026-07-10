import { Redirect } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

/** Root route: redirect authenticated users to dashboard, others to login */
export default function Home() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "hsl(220,28%,96%)" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center animate-pulse"
            style={{
              background: "linear-gradient(135deg, hsl(258,84%,62%), hsl(22,90%,62%))",
            }}
          >
            <span className="text-white font-bold text-lg">W</span>
          </div>
        </div>
      </div>
    );
  }

  return <Redirect to={user ? "/dashboard" : "/login"} />;
}
