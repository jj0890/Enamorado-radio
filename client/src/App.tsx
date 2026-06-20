import { Switch, Route, Link, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { AudioProvider } from "@/providers/AudioProvider";
import HomePage from "./pages/HomePage";
import MobileRadio from "./pages/MobileRadio";
import RadioLanding from "./pages/RadioLanding";

// ResidentApplication removed - now redirects to Google Form via Express route
import ScheduleAdmin from "./pages/ScheduleAdmin";
import Schedule from "./pages/Schedule";

import EditorialWorkflow from "./pages/EditorialWorkflow";
import AdminAuthWrapper from "./components/AdminAuthWrapper";
import ResidentAuthWrapper from "./components/ResidentAuthWrapper";
import Discover from "./pages/Discover";
import MixUpload from "./pages/MixUpload";
import LiveMixDemo from "./pages/LiveMixDemo";
import EpisodesBrowser from "./pages/EpisodesBrowser";
import EpisodeView from "./pages/EpisodeView";
import Guides from "./pages/Guides";
import GuideDetail from "./pages/GuideDetail";
import AlbumsOfTheMonth from "./pages/AlbumsOfTheMonth";
import AlbumsPage from "./pages/AlbumsPage";
import Top10AlbumsPage from "./pages/Top10AlbumsPage";
import SubmitAlbum from "./pages/SubmitAlbum";
import GenrePage from "./pages/GenrePage";
import MixesLanding from "./pages/MixesLanding";
import SubmitMix from "./pages/SubmitMix";
import SubmitPlaylist from "./pages/SubmitPlaylist";
import AdminQueue from "./pages/AdminQueue";
import AzuraCastAdmin from "./pages/AzuraCastAdmin";
import AdminMixRouting from "./pages/AdminMixRouting";
import AdminEpisodeUpload from "./pages/AdminEpisodeUpload";
import AdminBackups from "./pages/AdminBackups";
import AdminResidentApplications from "./pages/AdminResidentApplications";
import MixUploadToAzuraCast from "./components/MixUploadToAzuraCast";
import AzuraCastMixManager from "./components/AzuraCastMixManager";
import StickyRadioPlayer from "./components/StickyRadioPlayer";
import GenreDiscovery from "./pages/GenreDiscovery";
import AboutPage from "./pages/AboutPage";
import ResidentsPage from "./pages/ResidentsPage";
import CommunityPage from "./pages/CommunityPage";
import CommunityDetailPage from "./pages/CommunityDetailPage";
import ContributorProfile from "./pages/ContributorProfile";
import ContributorsPage from "./pages/ContributorsPage";
import ProfileSetup from "./pages/ProfileSetup";
import LatestPage from "./pages/LatestPage";
import Editorial from "./pages/Editorial";
import EditorialEntry from "./pages/EditorialEntry";
import IssuePage from "./pages/IssuePage";
import SubmissionPage from "./pages/SubmissionPage";
import AdminEditorial from "./pages/AdminEditorial";
import AdminEditorialEditor from "./pages/AdminEditorialEditor";
import AdminIssues from "./pages/AdminIssues";
import UnifiedSubmit from "./pages/UnifiedSubmit";
import WriterSubmissionPage from "./pages/WriterSubmissionPage";
import { Toaster } from "@/components/ui/toaster";

function Router() {
  console.log('🌐 App Router rendering...');
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/mobile" component={MobileRadio} />
      <Route path="/radio" component={RadioLanding} />
      
      {/* Content browsing */}
      <Route path="/latest" component={LatestPage} />
      <Route path="/explore">{() => <Redirect to="/community" />}</Route>
      <Route path="/discover" component={Discover} />

      {/* /resident-application handled by Express redirect to Google Form */}
      <Route path="/editor" component={AdminAuthWrapper} />
      <Route path="/admin" component={AdminAuthWrapper} />
      <Route path="/admin/*" component={AdminAuthWrapper} />
      <Route path="/resident" component={ResidentAuthWrapper} />
      <Route path="/resident/*" component={ResidentAuthWrapper} />
      <Route path="/schedule" component={Schedule} />

      <Route path="/mix-upload" component={MixUpload} />
      <Route path="/live-mix-demo" component={LiveMixDemo} />
      <Route path="/episodes" component={EpisodesBrowser} />
      <Route path="/episode/:id" component={EpisodeView} />
      <Route path="/guides" component={Guides} />
      <Route path="/guide/:id" component={GuideDetail} />
      <Route path="/albums" component={AlbumsPage} />
      <Route path="/albums/top-10-albums-2025" component={Top10AlbumsPage} />
      <Route path="/submit-album" component={SubmitAlbum} />
      <Route path="/genres" component={GenreDiscovery} />
      <Route path="/genre/:slug" component={GenrePage} />
      <Route path="/mixes" component={MixesLanding} />

      {/* Unified submission landing page — /submit-editorial redirects here */}
      <Route path="/submit" component={UnifiedSubmit} />
      <Route path="/submit-editorial">{() => <Redirect to="/submit" />}</Route>
      <Route path="/submit-mix" component={SubmitMix} />
      <Route path="/submit-playlist" component={SubmitPlaylist} />
      <Route path="/write-for-us" component={WriterSubmissionPage} />

      <Route path="/community" component={CommunityPage} />
      <Route path="/community/:id" component={CommunityDetailPage} />
      <Route path="/contributors" component={ContributorsPage} />
      <Route path="/contributors/:handle" component={ContributorProfile} />
      <Route path="/profile/setup" component={ProfileSetup} />

      {/* Editorial / Magazine routes */}
      <Route path="/editorial" component={Editorial} />
      <Route path="/editorial/:slug" component={EditorialEntry} />
      <Route path="/issue/:slug" component={IssuePage} />
      <Route path="/content/:slug" component={SubmissionPage} />
      <Route path="/admin/editorial" component={AdminEditorial} />
      <Route path="/admin/editorial/:id" component={AdminEditorialEditor} />
      <Route path="/admin/issues" component={AdminIssues} />

      <Route path="/about" component={AboutPage} />
      <Route path="/residents" component={ResidentsPage} />
      <Route path="/residency" component={ResidentsPage} />
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

function AppContent() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-slate-900">
      <Router />
      <StickyRadioPlayer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AudioProvider>
        <AppContent />
      </AudioProvider>
    </QueryClientProvider>
  );
}

export default App;
