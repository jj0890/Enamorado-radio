import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import RadioLanding from "@/pages/RadioLanding";
import MobileRadio from "@/pages/MobileRadio";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/radio" component={RadioLanding} />
      <Route path="/mobile" component={MobileRadio} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
