import { useState } from "react";
import { Link } from "wouter";
import { Play, Calendar, Music, Radio, Users, Compass } from "lucide-react";

// Three alternative hero layouts - all work great with zero content

export function HeroOption1_Minimal() {
  // Clean, simple, text-focused - like NTS Radio
  return (
    <section className="mb-20">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <h1 className="text-7xl md:text-8xl font-bold font-mono text-navy leading-none">
          ENAMORADO
        </h1>
        <p className="text-2xl md:text-3xl text-gray-600 dark:text-gray-400 font-mono leading-relaxed max-w-2xl mx-auto">
          A space dedicated to the things we are enamored with.
        </p>
        <p className="text-lg text-gray-500 dark:text-gray-500 font-mono max-w-xl mx-auto">
          Listener-driven internet radio from San Antonio.
        </p>
        
        {/* Single prominent CTA */}
        <div className="pt-6">
          <button className="bg-navy text-white px-12 py-5 font-mono text-lg font-bold hover:bg-navy-dark transition-colors inline-flex items-center gap-3">
            <Radio className="w-6 h-6" />
            LISTEN NOW
          </button>
        </div>

        {/* Secondary actions below */}
        <div className="flex flex-wrap justify-center gap-4 pt-4 text-sm font-mono">
          <Link href="/schedule" className="text-gray-600 dark:text-gray-400 hover:text-navy underline">
            View Schedule
          </Link>
          <Link href="/submit-mix" className="text-gray-600 dark:text-gray-400 hover:text-navy underline">
            Submit a Mix
          </Link>
          <Link href="/explore" className="text-gray-600 dark:text-gray-400 hover:text-navy underline">
            Explore Guides
          </Link>
        </div>
      </div>
    </section>
  );
}

export function HeroOption2_SplitStatic() {
  // Split layout but uses static branding instead of dynamic content
  return (
    <section className="mb-16">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        {/* LEFT: Text */}
        <div className="space-y-6">
          <h1 className="text-6xl md:text-7xl font-bold font-mono text-navy leading-tight">
            ENAMORADO<br />RADIO
          </h1>
          <p className="text-2xl text-gray-600 dark:text-gray-400 font-mono leading-relaxed">
            A space dedicated to the things we are enamored with.
          </p>
          <p className="text-lg text-gray-500 dark:text-gray-500 font-mono max-w-lg">
            Listener-driven internet radio from San Antonio. Community mixes, resident shows, and themed programming.
          </p>
          
          <div className="flex flex-wrap gap-3 pt-4">
            <Link
              href="/latest"
              className="inline-flex items-center gap-2 bg-navy text-white px-6 py-3 font-mono text-sm hover:bg-navy-dark transition-colors"
            >
              <Play className="w-4 h-4" />
              LATEST
            </Link>
            <Link
              href="/schedule"
              className="inline-flex items-center gap-2 bg-white dark:bg-gray-900 border-2 border-black dark:border-gray-700 px-6 py-3 font-mono text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              SCHEDULE
            </Link>
            <Link
              href="/submit-mix"
              className="inline-flex items-center gap-2 bg-white dark:bg-gray-900 border-2 border-black dark:border-gray-700 px-6 py-3 font-mono text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Music className="w-4 h-4" />
              SUBMIT
            </Link>
          </div>
        </div>

        {/* RIGHT: Static branded visual - no dynamic content needed */}
        <div className="space-y-4">
          {/* Big station identity card */}
          <div className="bg-gradient-to-br from-red-500 to-pink-600 border-2 border-black dark:border-gray-700 p-12 aspect-square flex items-center justify-center">
            <div className="text-center text-white space-y-6">
              <Radio className="w-24 h-24 mx-auto" />
              <div className="font-mono font-bold text-4xl">24/7</div>
              <div className="font-mono text-xl">LIVE RADIO</div>
            </div>
          </div>
          
          {/* Station info */}
          <div className="grid grid-cols-2 gap-2 font-mono text-sm">
            <div className="bg-white dark:bg-gray-900 border-2 border-black dark:border-gray-700 p-4 text-center">
              <div className="text-navy font-bold">SAN ANTONIO</div>
              <div className="text-gray-600 dark:text-gray-400 text-xs">Texas</div>
            </div>
            <div className="bg-white dark:bg-gray-900 border-2 border-black dark:border-gray-700 p-4 text-center">
              <div className="text-navy font-bold">STREAMING</div>
              <div className="text-gray-600 dark:text-gray-400 text-xs">Now</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HeroOption3_FullWidth() {
  // Full-width banner style - bold and simple, no redundant tune-in button
  return (
    <section className="mb-16 -mx-4">
      <div className="bg-gradient-to-r from-red-500 to-pink-600 border-y-4 border-black dark:border-gray-700 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-6 text-white">
            <h1 className="text-6xl md:text-8xl font-bold font-mono leading-tight">
              ENAMORADO RADIO
            </h1>
            <p className="text-2xl md:text-3xl font-mono max-w-3xl mx-auto leading-relaxed opacity-90">
              Internet radio from San Antonio dedicated to the things we are enamored with
            </p>
            
            {/* Primary CTAs - content discovery focused */}
            <div className="flex flex-wrap justify-center gap-4 pt-6">
              <Link
                href="/latest"
                className="bg-white text-navy px-8 py-4 font-mono font-bold hover:bg-gray-100 transition-colors inline-flex items-center gap-3 border-2 border-black"
                data-testid="button-hero-latest"
              >
                <Play className="w-5 h-5" />
                LATEST EPISODES
              </Link>
              <Link
                href="/schedule"
                className="bg-transparent border-2 border-white text-white px-8 py-4 font-mono font-bold hover:bg-white hover:text-navy transition-colors inline-flex items-center gap-3"
                data-testid="button-hero-schedule"
              >
                <Calendar className="w-5 h-5" />
                SCHEDULE
              </Link>
              <Link
                href="/mixes"
                className="bg-transparent border-2 border-white text-white px-8 py-4 font-mono font-bold hover:bg-white hover:text-navy transition-colors inline-flex items-center gap-3"
                data-testid="button-hero-mixes"
              >
                <Music className="w-5 h-5" />
                MIXES
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary nav pills below banner */}
      <div className="max-w-7xl mx-auto px-4 -mt-6">
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/explore"
            className="bg-white dark:bg-gray-900 border-2 border-black dark:border-gray-700 px-6 py-3 font-mono text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-lg"
          >
            <Compass className="w-4 h-4 inline mr-2" />
            Explore Guides
          </Link>
          <Link
            href="/albums"
            className="bg-white dark:bg-gray-900 border-2 border-black dark:border-gray-700 px-6 py-3 font-mono text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-lg"
          >
            Albums of the Month
          </Link>
          <Link
            href="/submit-mix"
            className="bg-white dark:bg-gray-900 border-2 border-black dark:border-gray-700 px-6 py-3 font-mono text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-lg"
          >
            Submit a Mix
          </Link>
        </div>
      </div>
    </section>
  );
}
