import { Switch, Route, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";

// Clean page components
import HomePage from "./pages/HomePage";
import LatestPage from "./pages/LatestPage";
import ExplorePage from "./pages/ExplorePage";  
import SchedulePage from "./pages/SchedulePage";
import EpisodesPage from "./pages/EpisodesPage";
import EpisodeView from "./pages/EpisodeView";
import GuideDetail from "./pages/GuideDetail";
import MixesPage from "./pages/MixesPage";
import SubmitMix from "./pages/SubmitMix-clean";
import AlbumsPage from "./pages/AlbumsPage";
import SubmitAlbum from "./pages/SubmitAlbum";
import AdminAuthWrapper from "./components/AdminAuthWrapper";
import ResidentAuthWrapper from "./components/ResidentAuthWrapper";

// Genre pages
import GenrePage from "./pages/GenrePage";
import GenreDiscovery from "./pages/GenreDiscovery";

// Legacy compatibility - keep radio functionality
import MobileRadio from "./pages/MobileRadio";

function Router() {
  console.log('🌐 App-clean Router rendering...');
  return (
    <Switch>
      {/* Core Navigation */}
      <Route path="/" component={HomePage} />
      <Route path="/latest" component={LatestPage} />
      <Route path="/explore" component={ExplorePage} />
      <Route path="/explore/:slug" component={GuideDetail} />
      <Route path="/episodes" component={EpisodesPage} />
      <Route path="/episode/:id" component={EpisodeView} />
      <Route path="/schedule" component={SchedulePage} />
      <Route path="/mixes" component={MixesPage} />
      <Route path="/submit-mix" component={SubmitMix} />
      <Route path="/albums" component={AlbumsPage} />
      <Route path="/submit-album" component={SubmitAlbum} />
      
      {/* Genre routes */}
      <Route path="/genres" component={GenreDiscovery} />
      <Route path="/genre/:slug" component={GenrePage} />
      
      {/* Admin - explicit routes */}
      <Route path="/admin" component={AdminAuthWrapper} />
      <Route path="/admin/:rest*" component={AdminAuthWrapper} />
      
      {/* Resident - explicit routes */}
      <Route path="/resident" component={ResidentAuthWrapper} />
      <Route path="/resident/:rest*" component={ResidentAuthWrapper} />
      
      {/* Legacy/Compatibility */}
      <Route path="/mobile" component={MobileRadio} />
      <Route path="/radio" component={() => (
        <div className="min-h-screen bg-white text-black flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4 font-mono text-red-500">RADIO</h1>
            <p className="text-gray-600 font-mono mb-4">Listen via the player in the top-right corner</p>
            <Link href="/" className="text-red-500 hover:underline font-mono">← Back to Home</Link>
          </div>
        </div>
      )} />
      
      {/* Resident Applications handled by Express redirect */}
      
      {/* 404 */}
      <Route>
        <div className="min-h-screen bg-white text-black flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4 font-mono text-red-500">404</h1>
            <p className="text-gray-600 mb-4 font-mono">Page not found</p>
            <Link href="/" className="text-red-500 hover:underline font-mono">
              ← Back to Home
            </Link>
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