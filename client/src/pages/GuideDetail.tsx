import { useState } from 'react';
import { useRoute, Link } from 'wouter';
import { Play, ArrowLeft, ExternalLink, Clock, User, Calendar, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface GuideSection {
  id: number;
  title: string;
  type: 'episode' | 'article' | 'video';
  duration?: string;
  description: string;
  url: string;
  isLive?: boolean;
}

interface GuideData {
  id: number;
  title: string;
  description: string;
  author: string;
  coverImage?: string;
  tags: string[];
  totalDuration: string;
  sectionsCount: number;
  createdAt: string;
  sections: GuideSection[];
}

export default function GuideDetail() {
  const [, params] = useRoute('/guide/:id');
  const guideId = params?.id ? parseInt(params.id) : null;

  // Mock guide data - would come from API
  const guide: GuideData = {
    id: 1,
    title: "Enamorado Guide to Earl Sweatshirt",
    description: "Dive into the artistry of Earl Sweatshirt and explore his unique approach to hip-hop, showcasing his introspective lyrics, unconventional production, and artistic evolution from Odd Future to his solo career.",
    author: "Jarrad",
    coverImage: "@assets/IMG_0231_1752971370281.PNG",
    tags: ["Hip-Hop", "Underground", "Introspective", "Odd Future"],
    totalDuration: "2h 15m",
    sectionsCount: 8,
    createdAt: "2025-01-15",
    sections: [
      {
        id: 1,
        title: "Early Days with Odd Future",
        type: 'episode',
        duration: "18 min",
        description: "Exploring Earl's beginnings with Tyler, the Creator and the collective that changed hip-hop.",
        url: "/episode/earl-1",
        isLive: false
      },
      {
        id: 2,
        title: "The EARL Mixtape Analysis",
        type: 'article',
        duration: "12 min read",
        description: "Deep dive into the themes and production of his debut project.",
        url: "/articles/earl-mixtape-analysis"
      },
      {
        id: 3,
        title: "Doris: Coming of Age",
        type: 'episode',
        duration: "22 min",
        description: "Breaking down his first studio album and the maturation of his sound.",
        url: "/episode/earl-doris"
      },
      {
        id: 4,
        title: "Production Techniques Breakdown",
        type: 'video',
        duration: "15 min",
        description: "Visual analysis of Earl's unique approach to beat selection and flow.",
        url: "/videos/earl-production"
      },
      {
        id: 5,
        title: "I Don't Like Shit, I Don't Go Outside",
        type: 'episode',
        duration: "25 min",
        description: "Examining the raw emotion and minimalist production of this pivotal album.",
        url: "/episode/earl-idls"
      },
      {
        id: 6,
        title: "Some Rap Songs: Experimental Phase",
        type: 'episode',
        duration: "28 min",
        description: "Understanding the abstract nature and personal themes of his most experimental work.",
        url: "/episode/earl-srs"
      },
      {
        id: 7,
        title: "FEET OF CLAY & Recent Evolution",
        type: 'article',
        duration: "10 min read",
        description: "Analyzing his latest releases and artistic growth.",
        url: "/articles/earl-recent"
      },
      {
        id: 8,
        title: "Live Performance & Legacy",
        type: 'video',
        duration: "20 min",
        description: "Earl's stage presence and influence on modern underground hip-hop.",
        url: "/videos/earl-legacy"
      }
    ]
  };

  if (!guide) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Guide Not Found</h1>
          <p className="text-gray-400">The guide you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'episode': return <Play className="h-4 w-4" />;
      case 'article': return <BookOpen className="h-4 w-4" />;
      case 'video': return <ExternalLink className="h-4 w-4" />;
      default: return <Play className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'episode': return 'bg-green-600';
      case 'article': return 'bg-blue-600';
      case 'video': return 'bg-navy-dark';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="bg-black text-white min-h-screen">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" asChild>
              <Link href="/guides">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Guides
              </Link>
            </Button>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Cover Image */}
            <div className="lg:w-1/3">
              <div className="w-full max-w-md mx-auto">
                {guide.coverImage ? (
                  <img 
                    src={guide.coverImage} 
                    alt={guide.title}
                    className="w-full rounded-lg shadow-2xl"
                  />
                ) : (
                  <div className="w-full aspect-square bg-gray-800 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-16 w-16 text-gray-600" />
                  </div>
                )}
              </div>
            </div>
            
            {/* Guide Info */}
            <div className="lg:w-2/3">
              <h1 className="text-4xl font-bold mb-4">{guide.title}</h1>
              <p className="text-xl text-gray-300 mb-6 leading-relaxed">{guide.description}</p>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {guide.tags.map((tag, index) => (
                  <Badge key={index} className="bg-purple-600">
                    {tag}
                  </Badge>
                ))}
              </div>
              
              <div className="flex flex-wrap gap-6 text-sm text-gray-400 mb-6">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>by {guide.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{guide.totalDuration} total</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>{guide.sectionsCount} sections</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(guide.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                <Play className="h-5 w-5 mr-2" />
                Start Guide
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Guide Sections */}
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-semibold mb-6">Guide Contents</h2>
        
        <div className="space-y-4">
          {guide.sections.map((section, index) => (
            <div key={section.id} className="bg-gray-900 rounded-lg p-6 hover:bg-gray-800 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl font-bold text-gray-500">
                      {(index + 1).toString().padStart(2, '0')}
                    </span>
                    <Badge className={`${getTypeColor(section.type)} text-white`}>
                      {getTypeIcon(section.type)}
                      <span className="ml-1 capitalize">{section.type}</span>
                    </Badge>
                    {section.duration && (
                      <span className="text-sm text-gray-400">{section.duration}</span>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-2">{section.title}</h3>
                  <p className="text-gray-400 mb-4">{section.description}</p>
                </div>
                
                <Button asChild>
                  <Link href={section.url}>
                    {section.type === 'episode' ? (
                      <Play className="h-4 w-4 mr-2" />
                    ) : (
                      <ExternalLink className="h-4 w-4 mr-2" />
                    )}
                    {section.type === 'episode' ? 'Listen' : 
                     section.type === 'article' ? 'Read' : 'Watch'}
                  </Link>
                </Button>
              </div>
              
              {index < guide.sections.length - 1 && (
                <Separator className="mt-6 bg-gray-700" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}