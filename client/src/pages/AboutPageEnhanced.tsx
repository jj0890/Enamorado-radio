import { useRoute, Link } from 'wouter';
import Navigation from '@/components/Navigation';
import { Mail, Users, FileText, Send, BookOpen } from 'lucide-react';

type AboutSection = 'overview' | 'mission' | 'team' | 'guidelines' | 'contact' | 'newsletter';

export default function AboutPageEnhanced() {
  const [, params] = useRoute('/about/:section?');
  const section = (params?.section as AboutSection) || 'overview';

  const renderContent = () => {
    switch (section) {
      case 'mission':
        return <MissionSection />;
      case 'team':
        return <TeamSection />;
      case 'guidelines':
        return <GuidelinesSection />;
      case 'contact':
        return <ContactSection />;
      case 'newsletter':
        return <NewsletterSection />;
      default:
        return <OverviewSection />;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Navigation />

      <main className="max-w-5xl mx-auto px-4 py-12 md:py-16">
        {/* Secondary Navigation */}
        <nav className="flex flex-wrap gap-4 mb-12 border-b border-gray-200 dark:border-gray-800 pb-4">
          <Link href="/about">
            <button
              className={`px-4 py-2 font-sans text-sm transition-colors ${
                section === 'overview'
                  ? 'text-navy dark:text-navy-light font-bold border-b-2 border-navy dark:border-navy-light'
                  : 'text-gray-600 dark:text-gray-400 hover:text-navy dark:hover:text-navy-light'
              }`}
            >
              About Us
            </button>
          </Link>
          <Link href="/about/mission">
            <button
              className={`px-4 py-2 font-sans text-sm transition-colors ${
                section === 'mission'
                  ? 'text-navy dark:text-navy-light font-bold border-b-2 border-navy dark:border-navy-light'
                  : 'text-gray-600 dark:text-gray-400 hover:text-navy dark:hover:text-navy-light'
              }`}
            >
              Mission
            </button>
          </Link>
          <Link href="/about/team">
            <button
              className={`px-4 py-2 font-sans text-sm transition-colors ${
                section === 'team'
                  ? 'text-navy dark:text-navy-light font-bold border-b-2 border-navy dark:border-navy-light'
                  : 'text-gray-600 dark:text-gray-400 hover:text-navy dark:hover:text-navy-light'
              }`}
            >
              Team
            </button>
          </Link>
          <Link href="/about/guidelines">
            <button
              className={`px-4 py-2 font-sans text-sm transition-colors ${
                section === 'guidelines'
                  ? 'text-navy dark:text-navy-light font-bold border-b-2 border-navy dark:border-navy-light'
                  : 'text-gray-600 dark:text-gray-400 hover:text-navy dark:hover:text-navy-light'
              }`}
            >
              Guidelines
            </button>
          </Link>
          <Link href="/about/contact">
            <button
              className={`px-4 py-2 font-sans text-sm transition-colors ${
                section === 'contact'
                  ? 'text-navy dark:text-navy-light font-bold border-b-2 border-navy dark:border-navy-light'
                  : 'text-gray-600 dark:text-gray-400 hover:text-navy dark:hover:text-navy-light'
              }`}
            >
              Contact
            </button>
          </Link>
          <Link href="/about/newsletter">
            <button
              className={`px-4 py-2 font-sans text-sm transition-colors ${
                section === 'newsletter'
                  ? 'text-navy dark:text-navy-light font-bold border-b-2 border-navy dark:border-navy-light'
                  : 'text-gray-600 dark:text-gray-400 hover:text-navy dark:hover:text-navy-light'
              }`}
            >
              Newsletter
            </button>
          </Link>
        </nav>

        {/* Content */}
        {renderContent()}
      </main>
    </div>
  );
}

function OverviewSection() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <h1 className="text-5xl font-serif text-gray-900 dark:text-white mb-6">
        About Enamorado Radio
      </h1>

      <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
        Enamorado Radio is an independent online radio station and cultural platform
        dedicated to discovering, curating, and sharing diverse sounds from around the world.
      </p>

      <div className="grid md:grid-cols-2 gap-8 my-12 not-prose">
        <div className="border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-6 h-6 text-navy dark:text-navy-light" />
            <h3 className="text-xl font-serif text-gray-900 dark:text-white">Our Mission</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-sans text-sm leading-relaxed">
            To create a space where music lovers, artists, and cultural enthusiasts can
            discover new sounds, share their passions, and connect with a global community.
          </p>
          <Link href="/about/mission">
            <button className="mt-4 text-sm text-navy dark:text-navy-light hover:underline font-sans">
              Read more →
            </button>
          </Link>
        </div>

        <div className="border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-navy dark:text-navy-light" />
            <h3 className="text-xl font-serif text-gray-900 dark:text-white">Our Team</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-sans text-sm leading-relaxed">
            A collective of music enthusiasts, DJs, writers, and creatives working together
            to bring you the best in underground and independent music.
          </p>
          <Link href="/about/team">
            <button className="mt-4 text-sm text-navy dark:text-navy-light hover:underline font-sans">
              Meet the team →
            </button>
          </Link>
        </div>
      </div>

      <h2 className="text-3xl font-serif text-gray-900 dark:text-white mt-12 mb-4">
        What We Do
      </h2>

      <ul className="space-y-3 text-gray-600 dark:text-gray-400">
        <li className="flex items-start gap-3">
          <span className="text-navy dark:text-navy-light">▸</span>
          <span>24/7 radio programming featuring underground and independent music</span>
        </li>
        <li className="flex items-start gap-3">
          <span className="text-navy dark:text-navy-light">▸</span>
          <span>Weekly shows hosted by resident DJs and guest selectors</span>
        </li>
        <li className="flex items-start gap-3">
          <span className="text-navy dark:text-navy-light">▸</span>
          <span>Editorial content: interviews, essays, and cultural features</span>
        </li>
        <li className="flex items-start gap-3">
          <span className="text-navy dark:text-navy-light">▸</span>
          <span>Community submissions: mixes, playlists, and creative work</span>
        </li>
      </ul>
    </div>
  );
}

function MissionSection() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <h1 className="text-5xl font-serif text-gray-900 dark:text-white mb-6">
        Our Mission
      </h1>

      <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
        Enamorado Radio exists to celebrate music as a universal language that connects
        people across cultures, borders, and backgrounds.
      </p>

      <h2 className="text-2xl font-serif text-gray-900 dark:text-white mt-8 mb-4">
        What We Believe
      </h2>

      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
        We believe that music discovery should be accessible to everyone. That underground
        and independent artists deserve platforms to share their work. That cultural
        exchange happens through sound, and that community is built through shared passion.
      </p>

      <h2 className="text-2xl font-serif text-gray-900 dark:text-white mt-8 mb-4">
        Our Values
      </h2>

      <div className="space-y-6 not-prose">
        <div>
          <h3 className="text-lg font-sans font-bold text-gray-900 dark:text-white mb-2">
            Diversity
          </h3>
          <p className="text-gray-600 dark:text-gray-400 font-sans text-sm leading-relaxed">
            We champion music from all genres, cultures, and communities. From experimental
            electronic to traditional folk, from global sounds to local scenes.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-sans font-bold text-gray-900 dark:text-white mb-2">
            Independence
          </h3>
          <p className="text-gray-600 dark:text-gray-400 font-sans text-sm leading-relaxed">
            We operate independently, free from commercial pressures. Our programming is
            guided by passion, not profit.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-sans font-bold text-gray-900 dark:text-white mb-2">
            Community
          </h3>
          <p className="text-gray-600 dark:text-gray-400 font-sans text-sm leading-relaxed">
            We're a platform for listeners, artists, and creators to connect, collaborate,
            and support each other.
          </p>
        </div>
      </div>
    </div>
  );
}

function TeamSection() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <h1 className="text-5xl font-serif text-gray-900 dark:text-white mb-6">
        Our Team
      </h1>

      <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed mb-12">
        Meet the people behind Enamorado Radio.
      </p>

      <div className="grid md:grid-cols-2 gap-8 not-prose">
        <div className="border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-xl font-serif text-gray-900 dark:text-white mb-2">
            Jarrad Jones
          </h3>
          <p className="text-sm font-sans text-navy dark:text-navy-light mb-4">
            Founder & Director
          </p>
          <p className="text-gray-600 dark:text-gray-400 font-sans text-sm leading-relaxed">
            Founded Enamorado Radio with a vision to create an independent platform for
            music discovery and cultural exchange.
          </p>
        </div>

        {/* Add more team members here */}
        <div className="border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-xl font-serif text-gray-900 dark:text-white mb-2">
            Resident DJs
          </h3>
          <p className="text-sm font-sans text-navy dark:text-navy-light mb-4">
            Our Selectors
          </p>
          <p className="text-gray-600 dark:text-gray-400 font-sans text-sm leading-relaxed">
            A diverse collective of DJs and selectors bringing you weekly shows spanning
            genres, eras, and cultures.
          </p>
          <Link href="/residents">
            <button className="mt-4 text-sm text-navy dark:text-navy-light hover:underline font-sans">
              View all residents →
            </button>
          </Link>
        </div>
      </div>

      <div className="mt-12 p-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 not-prose">
        <h3 className="text-lg font-serif text-gray-900 dark:text-white mb-3">
          Join Our Team
        </h3>
        <p className="text-gray-600 dark:text-gray-400 font-sans text-sm leading-relaxed mb-4">
          Interested in becoming a resident DJ, contributing to our editorial, or helping
          build the platform? We're always looking for passionate people to join us.
        </p>
        <Link href="/about/contact">
          <button className="px-4 py-2 bg-navy text-white font-sans text-sm hover:bg-navy-dark transition-colors">
            Get in Touch
          </button>
        </Link>
      </div>
    </div>
  );
}

function GuidelinesSection() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <h1 className="text-5xl font-serif text-gray-900 dark:text-white mb-6">
        Community Guidelines
      </h1>

      <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
        Our guidelines for creating a respectful, inclusive community.
      </p>

      <h2 className="text-2xl font-serif text-gray-900 dark:text-white mt-8 mb-4">
        Submission Guidelines
      </h2>

      <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
        When submitting mixes, playlists, or editorial content:
      </p>

      <ul className="space-y-2 text-gray-600 dark:text-gray-400">
        <li>Ensure your content is original or properly licensed</li>
        <li>Respect copyright and intellectual property rights</li>
        <li>Provide accurate metadata (artist names, track titles, etc.)</li>
        <li>Include thoughtful descriptions and context</li>
        <li>Tag your content appropriately for discoverability</li>
      </ul>

      <h2 className="text-2xl font-serif text-gray-900 dark:text-white mt-8 mb-4">
        Code of Conduct
      </h2>

      <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
        We're committed to fostering a welcoming, inclusive environment:
      </p>

      <ul className="space-y-2 text-gray-600 dark:text-gray-400">
        <li>Treat all community members with respect</li>
        <li>No harassment, hate speech, or discriminatory language</li>
        <li>Respect diverse perspectives and musical tastes</li>
        <li>Give credit where credit is due</li>
        <li>Support fellow artists and creators</li>
      </ul>

      <h2 className="text-2xl font-serif text-gray-900 dark:text-white mt-8 mb-4">
        Content Standards
      </h2>

      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
        All submitted content should align with our values of diversity, quality, and
        cultural exchange. We reserve the right to moderate submissions that don't meet
        our community standards or violate copyright law.
      </p>
    </div>
  );
}

function ContactSection() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <h1 className="text-5xl font-serif text-gray-900 dark:text-white mb-6">
        Contact Us
      </h1>

      <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed mb-12">
        Get in touch with the Enamorado team.
      </p>

      <div className="grid md:grid-cols-2 gap-8 not-prose">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Mail className="w-6 h-6 text-navy dark:text-navy-light" />
            <h2 className="text-2xl font-serif text-gray-900 dark:text-white">
              Email
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-sans text-gray-500 dark:text-gray-500 mb-1">
                General Inquiries
              </p>
              <a
                href="mailto:hello@enamoradoradio.com"
                className="text-navy dark:text-navy-light hover:underline font-sans"
              >
                hello@enamoradoradio.com
              </a>
            </div>
            <div>
              <p className="text-sm font-sans text-gray-500 dark:text-gray-500 mb-1">
                Submissions
              </p>
              <a
                href="mailto:submit@enamoradoradio.com"
                className="text-navy dark:text-navy-light hover:underline font-sans"
              >
                submit@enamoradoradio.com
              </a>
            </div>
            <div>
              <p className="text-sm font-sans text-gray-500 dark:text-gray-500 mb-1">
                Press & Media
              </p>
              <a
                href="mailto:press@enamoradoradio.com"
                className="text-navy dark:text-navy-light hover:underline font-sans"
              >
                press@enamoradoradio.com
              </a>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-6">
            <Send className="w-6 h-6 text-navy dark:text-navy-light" />
            <h2 className="text-2xl font-serif text-gray-900 dark:text-white">
              Social Media
            </h2>
          </div>
          <div className="space-y-3">
            <a
              href="https://instagram.com/enamoradoradio"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-gray-600 dark:text-gray-400 hover:text-navy dark:hover:text-navy-light font-sans text-sm"
            >
              Instagram →
            </a>
            <a
              href="https://twitter.com/enamoradoradio"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-gray-600 dark:text-gray-400 hover:text-navy dark:hover:text-navy-light font-sans text-sm"
            >
              Twitter/X →
            </a>
            <a
              href="https://soundcloud.com/enamoradoradio"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-gray-600 dark:text-gray-400 hover:text-navy dark:hover:text-navy-light font-sans text-sm"
            >
              SoundCloud →
            </a>
          </div>
        </div>
      </div>

      <div className="mt-12 p-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 not-prose">
        <h3 className="text-lg font-serif text-gray-900 dark:text-white mb-3">
          Quick Links
        </h3>
        <div className="flex flex-wrap gap-4">
          <Link href="/submit">
            <button className="px-4 py-2 border border-navy text-navy dark:border-navy-light dark:text-navy-light font-sans text-sm hover:bg-navy hover:text-white dark:hover:bg-navy-light dark:hover:text-black transition-colors">
              Submit Content
            </button>
          </Link>
          <Link href="/about/newsletter">
            <button className="px-4 py-2 border border-navy text-navy dark:border-navy-light dark:text-navy-light font-sans text-sm hover:bg-navy hover:text-white dark:hover:bg-navy-light dark:hover:text-black transition-colors">
              Subscribe to Newsletter
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function NewsletterSection() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <h1 className="text-5xl font-serif text-gray-900 dark:text-white mb-6">
        Newsletter
      </h1>

      <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
        Stay updated with the latest from Enamorado Radio.
      </p>

      <div className="my-12 p-8 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 not-prose">
        <h2 className="text-2xl font-serif text-gray-900 dark:text-white mb-4">
          Subscribe
        </h2>
        <p className="text-gray-600 dark:text-gray-400 font-sans text-sm leading-relaxed mb-6">
          Get weekly updates on new shows, editorial features, and community highlights
          delivered straight to your inbox.
        </p>

        <form className="flex gap-2">
          <input
            type="email"
            placeholder="your@email.com"
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white font-sans text-sm focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-navy-light"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-navy text-white font-sans text-sm hover:bg-navy-dark dark:bg-navy-light dark:text-black dark:hover:bg-navy transition-colors"
          >
            Subscribe
          </button>
        </form>
      </div>

      <h2 className="text-2xl font-serif text-gray-900 dark:text-white mt-12 mb-4">
        What You'll Get
      </h2>

      <ul className="space-y-3 text-gray-600 dark:text-gray-400">
        <li className="flex items-start gap-3">
          <span className="text-navy dark:text-navy-light">▸</span>
          <span>Weekly show schedule and guest lineup</span>
        </li>
        <li className="flex items-start gap-3">
          <span className="text-navy dark:text-navy-light">▸</span>
          <span>New editorial features and interviews</span>
        </li>
        <li className="flex items-start gap-3">
          <span className="text-navy dark:text-navy-light">▸</span>
          <span>Curated playlists and mix recommendations</span>
        </li>
        <li className="flex items-start gap-3">
          <span className="text-navy dark:text-navy-light">▸</span>
          <span>Community highlights and featured submissions</span>
        </li>
        <li className="flex items-start gap-3">
          <span className="text-navy dark:text-navy-light">▸</span>
          <span>Exclusive content and early access to events</span>
        </li>
      </ul>

      <p className="text-sm text-gray-500 dark:text-gray-500 mt-8">
        We respect your privacy. Unsubscribe anytime. No spam, ever.
      </p>
    </div>
  );
}
