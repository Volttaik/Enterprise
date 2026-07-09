import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
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

/** Single-user app — every route is available, no login gate. */
function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />

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
        component={() => (
          <AdminLayout>
            <ContactsPage />
          </AdminLayout>
        )}
      />
      <Route
        path={"/orders"}
        component={() => (
          <AdminLayout>
            <OrdersPage />
          </AdminLayout>
        )}
      />
      <Route
        path={"/payments"}
        component={() => (
          <AdminLayout>
            <PaymentsPage />
          </AdminLayout>
        )}
      />
      <Route
        path={"/products"}
        component={() => (
          <AdminLayout>
            <ProductsPage />
          </AdminLayout>
        )}
      />
      <Route
        path={"/knowledge-base"}
        component={() => (
          <AdminLayout>
            <KnowledgeBasePage />
          </AdminLayout>
        )}
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
            <WhatsAppSetup />
          </AdminLayout>
        )}
      />
      <Route
        path={"/settings"}
        component={() => (
          <AdminLayout>
            <SettingsPage />
          </AdminLayout>
        )}
      />

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
