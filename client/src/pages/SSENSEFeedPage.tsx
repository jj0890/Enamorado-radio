import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import HeaderWithDropdown from '@/components/HeaderWithDropdown';
import FeedPost from '@/components/FeedPost';
import { ContentItem } from '@shared/schema';

type FeedFilter = 'ALL' | 'EDITORIAL' | 'COMMUNITY';

export default function SSENSEFeedPage() {
  const [activeFilter, setActiveFilter] = useState<FeedFilter>('ALL');

  // Fetch all community content
  const { data: allContent = [], isLoading } = useQuery<ContentItem[]>({
    queryKey: ['/api/community', 'ssense-feed'],
    queryFn: async () => {
      const params = new URLSearchParams({
        sort: 'recent',
        limit: '50',
      });

      const response = await fetch(`/api/community?${params}`);
      if (!response.ok) throw new Error('Failed to fetch community content');
      return response.json();
    },
    refetchOnWindowFocus: false,
  });

  // Separate featured from latest
  const featuredContent = allContent.find(item => item.isFeatured);
  const latestContent = allContent.filter(item => !item.isFeatured);

  // Filter content based on active filter
  const filteredContent = latestContent.filter(item => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'EDITORIAL') return item.isFeatured || item.type === 'episode';
    if (activeFilter === 'COMMUNITY') return item.type === 'playlist' || item.type === 'mix';
    return true;
  });

  return (
    <div className="min-h-screen bg-white">
      <HeaderWithDropdown />

      <main className="max-w-[1440px] mx-auto px-20 py-12">
        {/* Featured Section */}
        {featuredContent && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif">Featured</h2>
              <span className="text-sm font-sans text-gray-600">CURATED BY STAFF</span>
            </div>
            <FeedPost content={featuredContent} variant="featured" />
          </section>
        )}

        {/* Latest Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-serif">Latest</h2>

            {/* Filter Tabs */}
            <div className="flex items-center gap-6">
              {(['ALL', 'EDITORIAL', 'COMMUNITY'] as FeedFilter[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`text-sm font-sans transition-colors pb-1 ${
                    activeFilter === filter
                      ? 'text-black border-b-2 border-black'
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="grid grid-cols-2 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[16/9] bg-gray-200 animate-pulse rounded"
                />
              ))}
            </div>
          ) : filteredContent.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-lg font-sans text-gray-600">
                No content found
              </p>
            </div>
          ) : (
            // 2-Column Grid
            <div className="grid grid-cols-2 gap-8">
              {filteredContent.map((item) => (
                <FeedPost
                  key={`${item.type}-${item.id}`}
                  content={item}
                  variant="grid"
                />
              ))}
            </div>
          )}
        </section>

        {/* Submission CTA */}
        <section className="mt-16">
          <div className="border-2 border-dashed border-gray-300 p-12 text-center hover:border-gray-400 transition-colors">
            <h3 className="text-2xl font-serif mb-4">Share Your Work</h3>
            <p className="font-sans text-gray-600 mb-6 max-w-xl mx-auto">
              We welcome submissions from our community. Share your photography, writing, or cultural commentary.
            </p>
            <a
              href="/submit"
              className="inline-block bg-black text-white px-8 py-3 font-sans text-sm hover:bg-gray-800 transition-colors"
            >
              Submit Work
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-24">
        <div className="max-w-[1440px] mx-auto px-20 py-12">
          <div className="grid grid-cols-3 gap-12 mb-12">
            {/* Column 1: About */}
            <div>
              <h4 className="font-serif text-lg mb-4">About</h4>
              <ul className="space-y-2 font-sans text-sm text-gray-600">
                <li><a href="/about/mission" className="hover:text-black">Mission</a></li>
                <li><a href="/about/team" className="hover:text-black">Team</a></li>
                <li><a href="/about/contact" className="hover:text-black">Contact</a></li>
              </ul>
            </div>

            {/* Column 2: Explore */}
            <div>
              <h4 className="font-serif text-lg mb-4">Explore</h4>
              <ul className="space-y-2 font-sans text-sm text-gray-600">
                <li><a href="/discover/featured" className="hover:text-black">Featured</a></li>
                <li><a href="/latest" className="hover:text-black">Latest</a></li>
                <li><a href="/discover/archives" className="hover:text-black">Archives</a></li>
              </ul>
            </div>

            {/* Column 3: Newsletter */}
            <div>
              <h4 className="font-serif text-lg mb-4">Newsletter</h4>
              <p className="font-sans text-sm text-gray-600 mb-4">
                Get updates on new content and features.
              </p>
              <form className="flex">
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 px-4 py-2 border border-gray-300 font-sans text-sm focus:outline-none focus:border-black"
                />
                <button
                  type="submit"
                  className="bg-black text-white px-6 py-2 font-sans text-sm hover:bg-gray-800 transition-colors"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-200 pt-6">
            <p className="font-sans text-sm text-gray-600 text-center">
              © 2026 Enamorado Radio. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
