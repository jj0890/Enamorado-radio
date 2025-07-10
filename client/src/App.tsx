import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import MobileRadio from "./pages/MobileRadio";

function Router() {
  return (
    <Switch>
      <Route path="/" component={MobileRadio} />
      <Route path="/mobile" component={MobileRadio} />
      <Route>
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Enamorado Radio</h1>
            <p className="text-white/60">Loading...</p>
          </div>
        </div>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
    </QueryClientProvider>
  );
}

export default App;
