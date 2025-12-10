import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Prospects from "./pages/Prospects";
import { useAuth } from "./_core/hooks/useAuth";
import { trpc } from "./lib/trpc";
import { Loader2 } from "lucide-react";

/**
 * Protected route wrapper that checks authentication and onboarding status
 */
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading, isAuthenticated } = useAuth();
  const { data: onboardingStatus, isLoading: onboardingLoading } = trpc.onboarding.status.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  if (loading || onboardingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/" />;
  }

  // If user is not onboarded, redirect to onboarding
  if (onboardingStatus && !onboardingStatus.onboarded) {
    return <Redirect to="/onboarding" />;
  }

  return <Component />;
}

/**
 * Onboarding route wrapper that redirects if already onboarded
 */
function OnboardingRoute() {
  const { user, loading, isAuthenticated } = useAuth();
  const { data: onboardingStatus, isLoading: onboardingLoading } = trpc.onboarding.status.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  if (loading || onboardingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/" />;
  }

  // If user is already onboarded, redirect to dashboard
  if (onboardingStatus && onboardingStatus.onboarded) {
    return <Redirect to="/dashboard" />;
  }

  return <Onboarding />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/onboarding">
        <OnboardingRoute />
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/prospects">
        <ProtectedRoute component={Prospects} />
      </Route>
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
