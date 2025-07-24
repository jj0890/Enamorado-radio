import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import HomePage from "./pages/HomePage";
import MobileRadio from "./pages/MobileRadio";
import RadioLanding from "./pages/RadioLanding";
import DJSubmit from "./pages/DJSubmit";
import ScheduleAdmin from "./pages/ScheduleAdmin";
import Schedule from "./pages/Schedule";
import ZineArchive from "./pages/ZineArchive";
import ZineSubmit from "./pages/ZineSubmit";
import EditorialWorkflow from "./pages/EditorialWorkflow";
import Discover from "./pages/Discover";
import MixUpload from "./pages/MixUpload";
import LiveMixDemo from "./pages/LiveMixDemo";
import EpisodesBrowser from "./pages/EpisodesBrowser";
import EpisodeView from "./pages/EpisodeView";
import Guides from "./pages/Guides";
import GuideDetail from "./pages/GuideDetail";
import AlbumsOfTheMonth from "./pages/AlbumsOfTheMonth";
import MixesLanding from "./pages/MixesLanding";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/mobile" component={MobileRadio} />
      <Route path="/radio" component={RadioLanding} />
      <Route path="/discover" component={Discover} />
      <Route path="/dj-submit" component={DJSubmit} />
      <Route path="/admin" component={ScheduleAdmin} />
      <Route path="/admin/editorial-workflow" component={EditorialWorkflow} />
      <Route path="/schedule" component={Schedule} />
      <Route path="/zine" component={ZineArchive} />
      <Route path="/zine/submit" component={ZineSubmit} />
      <Route path="/mix-upload" component={MixUpload} />
      <Route path="/live-mix-demo" component={LiveMixDemo} />
      <Route path="/episodes" component={EpisodesBrowser} />
      <Route path="/episode/:id" component={EpisodeView} />
      <Route path="/guides" component={Guides} />
      <Route path="/guide/:id" component={GuideDetail} />
      <Route path="/albums" component={AlbumsOfTheMonth} />
      <Route path="/mixes" component={MixesLanding} />
      <Route>
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Enamorado Radio</h1>
            <p className="text-white/60 mb-4">Page not found</p>
            <a href="/" className="text-blue-400 hover:text-blue-300">
              Go back home
            </a>
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
