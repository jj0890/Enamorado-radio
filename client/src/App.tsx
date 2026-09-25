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
import AlbumsPage from "./pages/AlbumsPage";
import Top10AlbumsPage from "./pages/Top10AlbumsPage";
import SubmitAlbum from "./pages/SubmitAlbum";
import GenrePage from "./pages/GenrePage";
import MixesLanding from "./pages/MixesLanding";
import SubmitMix from "./pages/SubmitMix";
import SubmitPlaylist from "./pages/SubmitPlaylist";
import SubmitContent from "./pages/SubmitContent";
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
import CommunityDetailPageEnhanced from "./pages/CommunityDetailPageEnhanced";
import ContributorProfile from "./pages/ContributorProfile";
import LatestPage from "./pages/LatestPage";
import SSENSEFeedPage from "./pages/SSENSEFeedPage";
import EditorialLanding from "./pages/EditorialLanding";
import AboutPageEnhanced from "./pages/AboutPageEnhanced";
import PhotoshootTemplate from "./pages/editorial-templates/PhotoshootTemplate";
import InterviewTemplate from "./pages/editorial-templates/InterviewTemplate";
import EssayTemplate from "./pages/editorial-templates/EssayTemplate";
import { Toaster } from "@/components/ui/toaster";
import AnnouncementBar from "@/components/AnnouncementBar";
import { UserProvider } from "@/contexts/UserContext";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import UserSettingsPage from "./pages/UserSettingsPage";
import AdminCommunity from "./pages/AdminCommunity";

// ── Magazine pages (lazy-loaded) ──────────────────────────────────────────────
import { lazy, Suspense } from "react";
const MagazineArchive    = lazy(() => import("./pages/magazine-archive.tsx"));
const MagazineCulture    = lazy(() => import("./pages/magazine-culture.tsx"));
const MagazineEditorials = lazy(() => import("./pages/magazine-editorials.tsx"));
const MagazineEntry      = lazy(() => import("./pages/magazine-entry.tsx"));
const MagazineIssue      = lazy(() => import("./pages/magazine-issue.tsx"));
const MagazineOpenCalls  = lazy(() => import("./pages/magazine-open-calls.tsx"));
const SpotlightPage      = lazy(() => import("./pages/spotlight.tsx"));

function MagazineFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="font-mono text-xs uppercase tracking-widest text-ink-muted">Loading…</p>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/mobile" component={MobileRadio} />
      <Route path="/radio" component={RadioLanding} />

      {/* ── Content browsing ── */}
      <Route path="/latest/:section?" component={LatestPage} />
      <Route path="/feed" component={SSENSEFeedPage} />
      {/* Template routes must come before the greedy :category? route */}
      <Route path="/editorial/photoshoot/:id" component={PhotoshootTemplate} />
      <Route path="/editorial/interview/:id" component={InterviewTemplate} />
      <Route path="/editorial/essay/:id" component={EssayTemplate} />
      <Route path="/editorial/:category?" component={EditorialLanding} />

      {/* ── Magazine routes ── */}
      <Route path="/archive">
        <Suspense fallback={<MagazineFallback />}><MagazineArchive /></Suspense>
      </Route>
      <Route path="/culture">
        <Suspense fallback={<MagazineFallback />}><MagazineCulture /></Suspense>
      </Route>
      <Route path="/editorials">
        <Suspense fallback={<MagazineFallback />}><MagazineEditorials /></Suspense>
      </Route>
      <Route path="/entry/:slug">
        <Suspense fallback={<MagazineFallback />}><MagazineEntry /></Suspense>
      </Route>
      <Route path="/issue/:slug">
        <Suspense fallback={<MagazineFallback />}><MagazineIssue /></Suspense>
      </Route>
      <Route path="/open-calls">
        <Suspense fallback={<MagazineFallback />}><MagazineOpenCalls /></Suspense>
      </Route>
      <Route path="/spotlight">
        <Suspense fallback={<MagazineFallback />}><SpotlightPage /></Suspense>
      </Route>

      {/* ── Platform ── */}
      <Route path="/explore">{() => <Redirect to="/community" />}</Route>
      <Route path="/discover" component={Discover} />
      <Route path="/editor" component={AdminAuthWrapper} />
      <Route path="/admin" component={AdminAuthWrapper} />
      <Route path="/admin/*" component={AdminAuthWrapper} />
      <Route path="/resident" component={ResidentAuthWrapper} />
      <Route path="/resident/*" component={ResidentAuthWrapper} />
      <Route path="/schedule" component={Schedule} />

      {/* ── Radio features ── */}
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
      <Route path="/submit" component={SubmitContent} />
      <Route path="/submit-mix" component={SubmitMix} />
      <Route path="/submit-playlist" component={SubmitPlaylist} />
      <Route path="/community" component={CommunityPage} />
      <Route path="/community/@:handle" component={ContributorProfile} />
      <Route path="/community/:id" component={CommunityDetailPageEnhanced} />
      <Route path="/contributors/:handle" component={ContributorProfile} />
      <Route path="/about/:section?" component={AboutPageEnhanced} />
      <Route path="/residents" component={ResidentsPage} />
      <Route path="/residency" component={ResidentsPage} />

      {/* Public auth & profile */}
      <Route path="/signup" component={SignupPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/settings" component={UserSettingsPage} />

      {/* ── 404 ── */}
      <Route>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-display font-800 text-6xl uppercase text-foreground mb-4">404</h1>
            <p className="font-mono text-sm text-ink-muted mb-6">Page not found</p>
            <a href="/" className="font-mono text-xs uppercase tracking-widest text-olive hover:underline">
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
    <div className="min-h-screen bg-background">
      <AnnouncementBar />
      <Router />
      <StickyRadioPlayer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AudioProvider>
        <UserProvider>
          <AppContent />
        </UserProvider>
      </AudioProvider>
    </QueryClientProvider>
  );
}

export default App;
