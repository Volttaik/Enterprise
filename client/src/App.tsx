import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import { AdminLayout } from "./components/AdminLayout";
import { useAuth } from "./_core/hooks/useAuth";

function Router() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Auth routes */}
      <Route path={"/login"} component={Login} />

      {/* Public routes */}
      <Route path={"/"} component={Home} />

      {/* Protected admin routes */}
      {isAuthenticated && (
        <>
          <Route
            path={"/dashboard"}
            component={() => (
              <AdminLayout>
                <Dashboard />
              </AdminLayout>
            )}
          />
          <Route
            path={"/chat"}
            component={() => (
              <AdminLayout>
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold mb-4">Live Chat Monitor</h2>
                  <p className="text-muted-foreground">Coming soon...</p>
                </div>
              </AdminLayout>
            )}
          />
          <Route
            path={"/contacts"}
            component={() => {
              const ContactsPage = require("./pages/Contacts").default;
              return (
                <AdminLayout>
                  <ContactsPage />
                </AdminLayout>
              );
            }}
          />
          <Route
            path={"/orders"}
            component={() => {
              const OrdersPage = require("./pages/Orders").default;
              return (
                <AdminLayout>
                  <OrdersPage />
                </AdminLayout>
              );
            }}
          />
          <Route
            path={"/payments"}
            component={() => {
              const PaymentsPage = require("./pages/Payments").default;
              return (
                <AdminLayout>
                  <PaymentsPage />
                </AdminLayout>
              );
            }}
          />
          <Route
            path={"/products"}
            component={() => {
              const ProductsPage = require("./pages/Products").default;
              return (
                <AdminLayout>
                  <ProductsPage />
                </AdminLayout>
              );
            }}
          />
          <Route
            path={"/knowledge-base"}
            component={() => {
              const KnowledgeBasePage = require("./pages/KnowledgeBase").default;
              return (
                <AdminLayout>
                  <KnowledgeBasePage />
                </AdminLayout>
              );
            }}
          />
          <Route
            path={"/campaigns"}
            component={() => (
              <AdminLayout>
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold mb-4">Broadcast Campaigns</h2>
                  <p className="text-muted-foreground">Coming soon...</p>
                </div>
              </AdminLayout>
            )}
          />
          <Route
            path={"/analytics"}
            component={() => (
              <AdminLayout>
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold mb-4">Analytics</h2>
                  <p className="text-muted-foreground">Coming soon...</p>
                </div>
              </AdminLayout>
            )}
          />
          <Route
            path={"/whatsapp"}
            component={() => (
              <AdminLayout>
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold mb-4">WhatsApp Configuration</h2>
                  <p className="text-muted-foreground">Coming soon...</p>
                </div>
              </AdminLayout>
            )}
          />
          <Route
            path={"/settings"}
            component={() => {
              const SettingsPage = require("./pages/Settings").default;
              return (
                <AdminLayout>
                  <SettingsPage />
                </AdminLayout>
              );
            }}
          />
        </>
      )}

      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
