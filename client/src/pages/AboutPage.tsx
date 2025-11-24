import Navigation from "@/components/Navigation";
import StickyRadioPlayer from "@/components/StickyRadioPlayer";
import { Link } from "wouter";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <StickyRadioPlayer />
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-16">
          {/* Header */}
          <section>
            <h1 className="text-5xl md:text-6xl font-bold font-mono text-navy mb-6">
              About Enamorado Radio
            </h1>
            <p className="text-2xl text-gray-800 dark:text-gray-200 font-mono leading-relaxed">
              San Antonio's first community-run radio platform. Listener-driven programming, 24/7 streaming, and a home for the music we're enamored with.
            </p>
          </section>

          {/* FAQ Section - Clear Answers */}
          <section className="space-y-8">
            <h2 className="text-3xl font-bold font-serif text-gray-900 dark:text-white mb-8 border-b-2 border-navy pb-3">
              What We Are
            </h2>
            
            {/* Is there a live stream? */}
            <div className="bg-gray-50 dark:bg-gray-900 border-l-4 border-navy p-6">
              <h3 className="text-xl font-bold font-mono mb-3 text-gray-900 dark:text-white">
                Is there a live stream happening now?
              </h3>
              <p className="text-lg text-gray-700 dark:text-gray-300 font-mono leading-relaxed mb-2">
                <strong className="text-navy">Yes, always.</strong> We broadcast 24/7 with a mix of AutoDJ programming and scheduled live shows from our resident DJs.
              </p>
              <p className="text-base text-gray-600 dark:text-gray-400 font-mono">
                The stream never stops—whether it's a live resident show or our curated AutoDJ rotation, you can tune in anytime.
              </p>
            </div>

            {/* Are resident shows scheduled? */}
            <div className="bg-gray-50 dark:bg-gray-900 border-l-4 border-navy p-6">
              <h3 className="text-xl font-bold font-mono mb-3 text-gray-900 dark:text-white">
                Are resident shows actually scheduled content?
              </h3>
              <p className="text-lg text-gray-700 dark:text-gray-300 font-mono leading-relaxed mb-2">
                <strong className="text-navy">Yes.</strong> Our residents have regular time slots and produce ongoing series with dedicated audiences.
              </p>
              <p className="text-base text-gray-600 dark:text-gray-400 font-mono">
                Each resident gets streaming access and can broadcast live during their scheduled slot, creating consistent programming you can rely on.
              </p>
            </div>

            {/* Can I listen to past episodes? */}
            <div className="bg-gray-50 dark:bg-gray-900 border-l-4 border-navy p-6">
              <h3 className="text-xl font-bold font-mono mb-3 text-gray-900 dark:text-white">
                Can I listen to past episodes?
              </h3>
              <p className="text-lg text-gray-700 dark:text-gray-300 font-mono leading-relaxed mb-2">
                <strong className="text-navy">Yes.</strong> All resident episodes are archived and available to stream anytime.
              </p>
              <p className="text-base text-gray-600 dark:text-gray-400 font-mono">
                Browse our <Link href="/#latest" className="underline hover:text-navy transition-colors">archive of episodes</Link> and community mixes on the homepage—every show is preserved for on-demand listening.
              </p>
            </div>
          </section>

          {/* What We Do */}
          <section className="space-y-6">
            <h2 className="text-3xl font-bold font-serif text-gray-900 dark:text-white mb-6 border-b-2 border-navy pb-3">
              What You Can Do Right Now
            </h2>
            <div className="grid gap-6">
              <div className="bg-white dark:bg-black border-2 border-black dark:border-gray-700 p-6">
                <h3 className="text-xl font-bold font-mono mb-2 text-navy">
                  🎧 Listen Live
                </h3>
                <p className="text-gray-700 dark:text-gray-300 font-mono">
                  Tune into our 24/7 stream from the homepage. Hear live resident shows or our curated AutoDJ selection.
                </p>
              </div>

              <div className="bg-white dark:bg-black border-2 border-black dark:border-gray-700 p-6">
                <h3 className="text-xl font-bold font-mono mb-2 text-navy">
                  📻 Browse Archives
                </h3>
                <p className="text-gray-700 dark:text-gray-300 font-mono">
                  Explore past episodes, community mixes, and resident shows—all available on-demand.
                </p>
              </div>

              <div className="bg-white dark:bg-black border-2 border-black dark:border-gray-700 p-6">
                <h3 className="text-xl font-bold font-mono mb-2 text-navy">
                  💿 Discover Albums
                </h3>
                <p className="text-gray-700 dark:text-gray-300 font-mono">
                  Check out our editorial team's monthly album picks—hand-selected favorites across all genres.
                </p>
              </div>

              <div className="bg-white dark:bg-black border-2 border-black dark:border-gray-700 p-6">
                <h3 className="text-xl font-bold font-mono mb-2 text-navy">
                  🎵 Submit Your Mix
                </h3>
                <p className="text-gray-700 dark:text-gray-300 font-mono">
                  Share your DJ mixes with our community—submit via SoundCloud, Mixcloud, or direct upload.
                </p>
              </div>
            </div>
          </section>

          {/* Get Involved */}
          <section className="bg-navy text-white p-8 md:p-12 space-y-6">
            <h2 className="text-3xl font-bold font-serif">
              Join the Community
            </h2>
            <p className="text-lg font-mono leading-relaxed opacity-90">
              Enamorado Radio is built by and for music lovers. Whether you're a listener, DJ, or curator—there's a place for you here.
            </p>
            
            <div className="grid md:grid-cols-2 gap-4 pt-4">
              <Link 
                href="/submit-mix"
                className="block bg-white text-navy border-2 border-white p-6 hover:bg-cream transition-colors"
              >
                <h3 className="text-xl font-bold font-mono mb-2">
                  Submit a Mix
                </h3>
                <p className="font-mono text-sm">
                  Share your DJ mixes or curated playlists with our community
                </p>
              </Link>

              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSemchUyWBCIvq953jVKTp8kbpOJU1DM9DtMt_Pe-s0F6lKuPw/viewform?usp=header"
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-white text-navy border-2 border-white p-6 hover:bg-cream transition-colors"
              >
                <h3 className="text-xl font-bold font-mono mb-2">
                  Become a Resident
                </h3>
                <p className="font-mono text-sm">
                  Apply for a regular programming slot and streaming access
                </p>
              </a>
            </div>
          </section>

          {/* Location */}
          <section className="text-center space-y-3 pt-8 border-t border-gray-200 dark:border-gray-800">
            <p className="text-xl text-gray-700 dark:text-gray-300 font-mono">
              Based in <span className="font-bold text-navy">San Antonio, Texas</span>
            </p>
            <p className="text-gray-600 dark:text-gray-400 font-mono text-sm">
              Broadcasting to listeners worldwide
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
