import { Switch, Route, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import HomePage from "./pages/HomePage";
import MobileRadio from "./pages/MobileRadio";
import RadioLanding from "./pages/RadioLanding";

// ResidentApplication removed - now redirects to Google Form via Express route
import ScheduleAdmin from "./pages/ScheduleAdmin";
import Schedule from "./pages/Schedule";

import EditorialWorkflow from "./pages/EditorialWorkflow";
import Discover from "./pages/Discover";
import MixUpload from "./pages/MixUpload";
import LiveMixDemo from "./pages/LiveMixDemo";
import EpisodesBrowser from "./pages/EpisodesBrowser";
import EpisodeView from "./pages/EpisodeView";
import Guides from "./pages/Guides";
import GuideDetail from "./pages/GuideDetail";
import AlbumsOfTheMonth from "./pages/AlbumsOfTheMonth";
import AlbumsPage from "./pages/AlbumsPage";
import GenrePage from "./pages/GenrePage";
import MixesLanding from "./pages/MixesLanding";
import SubmitMix from "./pages/SubmitMix-clean";
import AdminSongSubmissions from "./pages/AdminSongSubmissions";
import AdminQueue from "./pages/AdminQueue";
import AzuraCastAdmin from "./pages/AzuraCastAdmin";
import AdminMixRouting from "./pages/AdminMixRouting";
import AdminEpisodeUpload from "./pages/AdminEpisodeUpload";
import MixUploadToAzuraCast from "./components/MixUploadToAzuraCast";
import AzuraCastMixManager from "./components/AzuraCastMixManager";
import StickyRadioPlayer from "./components/StickyRadioPlayer";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/mobile" component={MobileRadio} />
      <Route path="/radio" component={RadioLanding} />
      <Route path="/discover" component={Discover} />

      {/* /resident-application handled by Express redirect to Google Form */}
      <Route path="/admin" component={ScheduleAdmin} />
      <Route path="/admin/song-submissions" component={AdminSongSubmissions} />
      <Route path="/admin/queue" component={AdminQueue} />
      <Route path="/admin/azuracast" component={AzuraCastAdmin} />
      <Route path="/admin/routing" component={AdminMixRouting} />
      <Route path="/admin/upload" component={AdminEpisodeUpload} />
      <Route path="/admin/azuracast-upload" component={() => (
        <div className="min-h-screen bg-[#FEFCF9] p-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 font-mono text-red-500">
              AZURACAST UPLOAD
            </h1>
            <MixUploadToAzuraCast />
          </div>
        </div>
      )} />
      <Route path="/admin/mix-manager" component={() => (
        <div className="min-h-screen bg-[#FEFCF9] p-6">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 font-mono text-red-500">
              MIX MANAGER - Upload, Publish & Schedule
            </h1>
            <AzuraCastMixManager />
          </div>
        </div>
      )} />
      <Route path="/admin/editorial-workflow" component={EditorialWorkflow} />
      <Route path="/schedule" component={Schedule} />

      <Route path="/mix-upload" component={MixUpload} />
      <Route path="/live-mix-demo" component={LiveMixDemo} />
      <Route path="/episodes" component={EpisodesBrowser} />
      <Route path="/episode/:id" component={EpisodeView} />
      <Route path="/guides" component={Guides} />
      <Route path="/guide/:id" component={GuideDetail} />
      <Route path="/albums" component={AlbumsPage} />
      <Route path="/genre/:slug" component={GenrePage} />
      <Route path="/mixes" component={MixesLanding} />
      <Route path="/submit-mix" component={SubmitMix} />
      <Route path="/residents" component={() => (
        <div className="min-h-screen bg-white text-black flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4 font-mono text-red-500">RESIDENTS</h1>
            <p className="text-gray-600 font-mono">Coming soon - Meet our resident DJs and radio hosts</p>
            <Link href="/mixes" className="text-red-500 hover:underline font-mono mt-4 inline-block">← Back to Mixes</Link>
          </div>
        </div>
      )} />
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
      <div className="min-h-screen bg-[#FEFCF9]">
        <Router />
        <StickyRadioPlayer />
      </div>
    </QueryClientProvider>
  );
}

export default App;
