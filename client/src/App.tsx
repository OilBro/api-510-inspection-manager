import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Inspections from "./pages/Inspections";
import NewInspection from "./pages/NewInspection";
import InspectionDetail from "./pages/InspectionDetail";
import ValidationDashboard from "./pages/ValidationDashboard";
import Materials from "./pages/Materials";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/inspections"} component={Inspections} />
      <Route path={"/inspection/new"} component={NewInspection} />
      <Route path={"/inspection/:id"} component={InspectionDetail} />
      <Route path={"/inspection/:id/validation"} component={ValidationDashboard} />
      <Route path={"/materials"} component={Materials} />
      <Route path={"/404"} component={NotFound} />
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
