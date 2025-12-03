import Navigation from "@/components/Navigation";
import StickyRadioPlayer from "@/components/StickyRadioPlayer";
import { Link } from "wouter";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border-b border-gray-200 dark:border-gray-800">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 flex items-center justify-between text-left hover:text-navy dark:hover:text-sky-400 transition-colors"
        data-testid={`faq-${question.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30)}`}
      >
        <span className="text-lg font-mono font-medium text-gray-900 dark:text-white pr-4">
          {question}
        </span>
        <ChevronDown 
          className={`w-5 h-5 text-navy dark:text-sky-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      {isOpen && (
        <div className="pb-5 pr-8">
          <p className="text-gray-600 dark:text-gray-400 font-mono leading-relaxed">
            {answer}
          </p>
        </div>
      )}
    </div>
  );
}

export default function AboutPage() {
  const faqs = [
    {
      question: "What is Enamorado Radio?",
      answer: "We're San Antonio's first community-run radio station. A platform for artists and music lovers to share what they're passionate about—no algorithms, no corporate playlists, just real people sharing real taste."
    },
    {
      question: "How do I listen?",
      answer: "Just hit the play button! We stream 24/7 from the homepage. You can also browse our archive of past episodes and community mixes anytime."
    },
    {
      question: "Is it free?",
      answer: "Yes, completely free. No subscriptions, no ads, no catches. We're community-supported."
    },
    {
      question: "What kind of music do you play?",
      answer: "Everything. Our DJs and community members share what moves them—electronic, jazz, hip-hop, experimental, classical, ambient, and everything in between. If someone's enamored with it, you might hear it here."
    },
    {
      question: "Can I submit my own music or mixes?",
      answer: "Absolutely! Anyone can submit a DJ mix or playlist. Just head to the Submit page and share your SoundCloud, Mixcloud, Spotify, or Apple Music link. Our team reviews submissions and features the best ones."
    },
    {
      question: "How do I become a resident DJ?",
      answer: "Residents are DJs with regular programming slots who can broadcast live. If you're interested, apply through our resident application form. We're always looking for voices that bring something unique."
    },
    {
      question: "When are live shows?",
      answer: "Check the Schedule page for upcoming live broadcasts. When no one's live, our AutoDJ keeps the music going with a curated rotation."
    },
    {
      question: "Can I listen to old episodes?",
      answer: "Yes! All resident episodes and approved community mixes are archived and available on-demand. Browse them from the Latest or Explore pages."
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <StickyRadioPlayer />
      <Navigation />
      
      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="space-y-16">
          {/* Header */}
          <section className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold font-mono text-navy dark:text-sky-400 mb-6">
              About Enamorado Radio
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 font-mono leading-relaxed">
              San Antonio's first community-run radio platform. Listener-driven programming, 24/7 streaming, and a home for the music we're enamored with.
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-400 font-mono mt-4">
              An online platform for artists, trying to make sharing taste more personal and accessible.
            </p>
          </section>

          {/* FAQ Section */}
          <section>
            <h2 className="text-2xl font-bold font-mono text-gray-900 dark:text-white mb-8">
              Frequently Asked Questions
            </h2>
            <div className="divide-y divide-gray-200 dark:divide-gray-800 border-t border-gray-200 dark:border-gray-800">
              {faqs.map((faq, index) => (
                <FAQItem key={index} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </section>

          {/* Quick Actions */}
          <section className="grid md:grid-cols-2 gap-4">
            <Link 
              href="/"
              className="block bg-navy text-white p-6 hover:bg-navy-dark transition-colors"
              data-testid="link-listen-now"
            >
              <h3 className="text-xl font-bold font-mono mb-2">
                Listen Now
              </h3>
              <p className="font-mono text-sm opacity-90">
                Tune into our 24/7 stream
              </p>
            </Link>

            <Link 
              href="/submit-mix"
              className="block bg-white dark:bg-gray-900 text-navy dark:text-sky-400 border-2 border-navy dark:border-sky-400 p-6 hover:bg-cream dark:hover:bg-gray-800 transition-colors"
              data-testid="link-submit-mix"
            >
              <h3 className="text-xl font-bold font-mono mb-2">
                Submit Your Music
              </h3>
              <p className="font-mono text-sm text-gray-600 dark:text-gray-400">
                Share a mix or playlist with our community
              </p>
            </Link>

            <Link 
              href="/latest"
              className="block bg-white dark:bg-gray-900 text-navy dark:text-sky-400 border-2 border-navy dark:border-sky-400 p-6 hover:bg-cream dark:hover:bg-gray-800 transition-colors"
              data-testid="link-browse-archive"
            >
              <h3 className="text-xl font-bold font-mono mb-2">
                Browse Archive
              </h3>
              <p className="font-mono text-sm text-gray-600 dark:text-gray-400">
                Explore past episodes and community mixes
              </p>
            </Link>

            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSemchUyWBCIvq953jVKTp8kbpOJU1DM9DtMt_Pe-s0F6lKuPw/viewform?usp=header"
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white dark:bg-gray-900 text-navy dark:text-sky-400 border-2 border-navy dark:border-sky-400 p-6 hover:bg-cream dark:hover:bg-gray-800 transition-colors"
              data-testid="link-become-resident"
            >
              <h3 className="text-xl font-bold font-mono mb-2">
                Become a Resident
              </h3>
              <p className="font-mono text-sm text-gray-600 dark:text-gray-400">
                Apply for a regular programming slot
              </p>
            </a>
          </section>

          {/* Location */}
          <section className="text-center space-y-2 pt-8 border-t border-gray-200 dark:border-gray-800">
            <p className="text-lg text-gray-700 dark:text-gray-300 font-mono">
              Based in <span className="font-bold text-navy dark:text-sky-400">San Antonio, Texas</span>
            </p>
            <p className="text-gray-500 dark:text-gray-500 font-mono text-sm">
              Broadcasting to listeners worldwide
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
