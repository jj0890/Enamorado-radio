import Navigation from "@/components/Navigation";
import StickyRadioPlayer from "@/components/StickyRadioPlayer";
import { Link } from "wouter";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <StickyRadioPlayer />
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-12">
          {/* Header */}
          <section className="border-b border-gray-200 dark:border-gray-800 pb-8">
            <h1 className="text-5xl font-bold font-mono text-red-500 mb-4">
              About Enamorado Radio
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 font-mono">
              Listener-driven internet radio from San Antonio
            </p>
          </section>

          {/* Mission */}
          <section className="space-y-4">
            <h2 className="text-3xl font-bold font-mono text-gray-900 dark:text-white">
              Our Mission
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 font-mono leading-relaxed">
              Enamorado Radio is dedicated to the music we are enamored with. We feature community mixes, 
              resident shows, and themed programming—all curated by passionate music lovers who want to 
              share their discoveries with the world.
            </p>
            <p className="text-lg text-gray-700 dark:text-gray-300 font-mono leading-relaxed">
              Our platform celebrates the diversity of musical expression and creates a space where 
              both emerging and established artists can connect with listeners who appreciate authentic, 
              carefully selected content.
            </p>
          </section>

          {/* What We Do */}
          <section className="space-y-4">
            <h2 className="text-3xl font-bold font-mono text-gray-900 dark:text-white">
              What We Do
            </h2>
            <div className="grid gap-6">
              <div className="border-l-4 border-red-500 pl-6">
                <h3 className="text-xl font-bold font-mono mb-2 text-gray-900 dark:text-white">
                  Community Mixes
                </h3>
                <p className="text-gray-700 dark:text-gray-300 font-mono">
                  We showcase DJ mixes and curated playlists submitted by our community, 
                  giving voices to diverse musical perspectives.
                </p>
              </div>

              <div className="border-l-4 border-red-500 pl-6">
                <h3 className="text-xl font-bold font-mono mb-2 text-gray-900 dark:text-white">
                  Resident Programming
                </h3>
                <p className="text-gray-700 dark:text-gray-300 font-mono">
                  Selected residents produce regular episodes and can stream live, 
                  creating ongoing series that build dedicated audiences.
                </p>
              </div>

              <div className="border-l-4 border-red-500 pl-6">
                <h3 className="text-xl font-bold font-mono mb-2 text-gray-900 dark:text-white">
                  Albums of the Month
                </h3>
                <p className="text-gray-700 dark:text-gray-300 font-mono">
                  Our editorial team curates monthly album selections, celebrating 
                  outstanding releases across all genres.
                </p>
              </div>
            </div>
          </section>

          {/* Get Involved */}
          <section className="bg-gray-50 dark:bg-gray-900 border-2 border-black dark:border-gray-700 p-8 space-y-6">
            <h2 className="text-3xl font-bold font-mono text-gray-900 dark:text-white">
              Get Involved
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 font-mono">
              Enamorado Radio is built by and for music lovers. Here's how you can participate:
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <Link 
                href="/submit-mix"
                className="block bg-white dark:bg-black border-2 border-black dark:border-gray-700 p-6 hover:border-red-500 transition-colors"
              >
                <h3 className="text-xl font-bold font-mono mb-2 text-red-500">
                  Submit a Mix
                </h3>
                <p className="text-gray-700 dark:text-gray-300 font-mono text-sm">
                  Share your DJ mixes or curated playlists with our community
                </p>
              </Link>

              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSemchUyWBCIvq953jVKTp8kbpOJU1DM9DtMt_Pe-s0F6lKuPw/viewform?usp=header"
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-white dark:bg-black border-2 border-black dark:border-gray-700 p-6 hover:border-red-500 transition-colors"
              >
                <h3 className="text-xl font-bold font-mono mb-2 text-red-500">
                  Become a Resident
                </h3>
                <p className="text-gray-700 dark:text-gray-300 font-mono text-sm">
                  Apply for a regular programming slot and streaming access
                </p>
              </a>
            </div>
          </section>

          {/* Location */}
          <section className="space-y-4 border-t border-gray-200 dark:border-gray-800 pt-8">
            <h2 className="text-2xl font-bold font-mono text-gray-900 dark:text-white">
              Location
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 font-mono">
              Based in San Antonio, Texas
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
