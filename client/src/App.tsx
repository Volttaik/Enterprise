import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import WhatsAppSetup from "./pages/WhatsAppSetup";
import { AdminLayout } from "./components/AdminLayout";
import ContactsPage from "./pages/Contacts";
import OrdersPage from "./pages/Orders";
import PaymentsPage from "./pages/Payments";
import ProductsPage from "./pages/Products";
import KnowledgeBasePage from "./pages/KnowledgeBase";
import SettingsPage from "./pages/Settings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

/** Wraps a route component so unauthenticated users are redirected to /login */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(220,28%,96%)" }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center animate-pulse"
            style={{ background: "linear-gradient(135deg, hsl(258,84%,62%), hsl(22,90%,62%))" }}
          >
            <span className="text-white font-bold text-lg">W</span>
          </div>
          <p className="text-sm" style={{ color: "hsl(220,12%,52%)" }}>Loading your workspace…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
}

/** Wraps auth pages so logged-in users are redirected straight to dashboard */
function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) return <Redirect to="/dashboard" />;
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Home} />
      <Route path="/login">
        <PublicOnlyRoute>
          <Login />
        </PublicOnlyRoute>
      </Route>
      <Route path="/register">
        <PublicOnlyRoute>
          <Register />
        </PublicOnlyRoute>
      </Route>

      {/* Protected routes */}
      <Route path="/dashboard">
        <ProtectedRoute>
          <AdminLayout>
            <Dashboard />
          </AdminLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/contacts">
        <ProtectedRoute>
          <AdminLayout>
            <ContactsPage />
          </AdminLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/orders">
        <ProtectedRoute>
          <AdminLayout>
            <OrdersPage />
          </AdminLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/payments">
        <ProtectedRoute>
          <AdminLayout>
            <PaymentsPage />
          </AdminLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/products">
        <ProtectedRoute>
          <AdminLayout>
            <ProductsPage />
          </AdminLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/knowledge-base">
        <ProtectedRoute>
          <AdminLayout>
            <KnowledgeBasePage />
          </AdminLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/whatsapp">
        <ProtectedRoute>
          <AdminLayout>
            <WhatsAppSetup />
          </AdminLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/settings">
        <ProtectedRoute>
          <AdminLayout>
            <SettingsPage />
          </AdminLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/campaigns">
        <ProtectedRoute>
          <AdminLayout>
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, hsl(258,84%,94%), hsl(22,90%,94%))" }}
              >
                <span className="text-2xl">📢</span>
              </div>
              <h2 className="font-display font-bold text-xl" style={{ color: "hsl(228,24%,18%)" }}>
                Broadcast Campaigns
              </h2>
              <p style={{ color: "hsl(220,12%,52%)" }} className="text-sm">Coming soon — send messages to thousands at once.</p>
            </div>
          </AdminLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/analytics">
        <ProtectedRoute>
          <AdminLayout>
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, hsl(258,84%,94%), hsl(22,90%,94%))" }}
              >
                <span className="text-2xl">📊</span>
              </div>
              <h2 className="font-display font-bold text-xl" style={{ color: "hsl(228,24%,18%)" }}>
                Analytics
              </h2>
              <p style={{ color: "hsl(220,12%,52%)" }} className="text-sm">Coming soon — deep insights into your business performance.</p>
            </div>
          </AdminLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <TooltipProvider>
        <Toaster position="top-right" />
        <AuthProvider>
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </ErrorBoundary>
  );
}

export default App;
