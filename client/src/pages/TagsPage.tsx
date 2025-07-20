import { Link, useRoute } from 'wouter';
import { ArrowLeft } from 'lucide-react';

interface Guide {
  id: number;
  title: string;
  description: string;
  author: string;
  episodeCount: number;
  tags: string[];
}

export default function TagsPage() {
  const [, params] = useRoute('/tag/:tag');
  const currentTag = params?.tag ? decodeURIComponent(params.tag) : '';

  // Mock data - would come from API filtered by tag
  const allGuides: Guide[] = [
    {
      id: 1,
      title: "Enamorado Guide to Earl Sweatshirt",
      description: "Deep dive into Earl's artistic evolution and discography",
      author: "Jarrad",
      episodeCount: 8,
      tags: ["Hip-Hop", "Underground", "Introspective"]
    },
    {
      id: 3,
      title: "Enamorado Guide to Hip-Hop Classics",
      description: "Dive deep into the tracks that defined hip-hop culture",
      author: "Marcus",
      episodeCount: 15,
      tags: ["Hip-Hop", "Legends"]
    },
    {
      id: 7,
      title: "Enamorado Guide to Underground Hip-Hop",
      description: "Exploring the underground scene and emerging artists",
      author: "Alex",
      episodeCount: 12,
      tags: ["Hip-Hop", "Underground", "Experimental"]
    },
    {
      id: 2,
      title: "Enamorado Guide to Jazz Essentials",
      description: "Explore the soulful roots of jazz with this essential collection",
      author: "Lauren",
      episodeCount: 12,
      tags: ["Jazz", "Classics"]
    },
    {
      id: 8,
      title: "Enamorado Guide to Modern Jazz",
      description: "Contemporary jazz artists pushing boundaries",
      author: "Maya",
      episodeCount: 9,
      tags: ["Jazz", "Modern"]
    },
    {
      id: 4,
      title: "Enamorado Guide to Electronic Vibes",
      description: "Journey through electronic music's evolution",
      author: "Riley",
      episodeCount: 10,
      tags: ["Electronic", "Techno"]
    }
  ];

  // Filter guides by current tag
  const filteredGuides = allGuides.filter(guide => 
    guide.tags.some(tag => tag.toLowerCase() === currentTag.toLowerCase())
  );

  return (
    <div className="bg-white text-black min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 border-b-2 border-black pb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/guides">
              <button className="flex items-center gap-2 text-black hover:text-gray-600 transition-colors">
                <ArrowLeft className="w-5 h-5" />
                Back to Guides
              </button>
            </Link>
          </div>
          
          <h1 className="text-4xl font-bold uppercase tracking-wide mb-4">
            {currentTag} GUIDES
          </h1>
          <p className="text-lg">
            All guides tagged with "{currentTag}" - {filteredGuides.length} results
          </p>
        </div>

        {/* Guides Grid */}
        {filteredGuides.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-2 border-black">
            {filteredGuides.map((guide) => (
              <Link key={guide.id} href={`/guide/${guide.id}`}>
                <div className="border-r-2 border-b-2 border-black p-6 hover:bg-gray-50 transition-colors group cursor-pointer">
                  {/* Image Area */}
                  <div className="aspect-square bg-gray-100 mb-4 flex items-center justify-center text-6xl">
                    🎵
                  </div>
                  
                  {/* Content */}
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg uppercase tracking-wide leading-tight">
                      {guide.title.replace('Enamorado Guide to ', '')}
                    </h3>
                    
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {guide.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-1 pt-2">
                      {guide.tags.map((tag, tagIndex) => (
                        <span 
                          key={tagIndex} 
                          className={`text-xs font-mono px-2 py-1 ${
                            tag.toLowerCase() === currentTag.toLowerCase() 
                              ? 'bg-black text-white' 
                              : 'bg-gray-200 text-black'
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="text-xs text-gray-500 font-mono pt-2">
                      {guide.episodeCount} EPISODES • BY {guide.author.toUpperCase()}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold mb-2">No guides found</h2>
            <p className="text-gray-600">
              No guides are currently tagged with "{currentTag}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}