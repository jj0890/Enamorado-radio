import { Link } from 'wouter';
import { Calendar, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StickyRadioPlayer from '@/components/StickyRadioPlayer';
import Navigation from '@/components/Navigation';

export default function Schedule() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <StickyRadioPlayer />
      <Navigation />
      
      <main className="max-w-3xl mx-auto px-4 py-24">
        <div className="text-center space-y-8">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
              <Calendar className="w-10 h-10 text-red-500" />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold font-mono text-gray-900 dark:text-white">
              Schedule Coming Soon
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 font-mono max-w-xl mx-auto">
              We're working on a comprehensive programming schedule. In the meantime, tune in to our live stream or browse recent episodes.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/episodes">
              <Button 
                className="bg-red-500 hover:bg-red-600 text-white font-mono"
                data-testid="button-browse-episodes"
              >
                <Radio className="w-4 h-4 mr-2" />
                Browse Episodes
              </Button>
            </Link>
            
            <Link href="/mixes">
              <Button 
                variant="outline" 
                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-mono"
                data-testid="button-browse-mixes"
              >
                Browse Mixes
              </Button>
            </Link>
          </div>

          {/* Additional Info */}
          <div className="pt-8 border-t border-gray-200 dark:border-gray-800 mt-12">
            <p className="text-sm text-gray-500 dark:text-gray-500 font-mono">
              Want to join community programming and get your own show?{' '}
              <a 
                href="https://docs.google.com/forms/d/e/1FAIpQLSemchUyWBCIvq953jVKTp8kbpOJU1DM9DtMt_Pe-s0F6lKuPw/viewform?usp=header"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-500 hover:underline"
              >
                Apply here
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
