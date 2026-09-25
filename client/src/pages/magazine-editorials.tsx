import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, Filter, Grid, List, PenTool, Plus, BookOpen, Users, Calendar, TrendingUp, Upload, ArrowLeft, Play, Video } from "lucide-react";
import { Link } from "wouter";
import { Submission, FeatureWithContent } from "@shared/schema";
import Navigation from "@/components/Navigation";
import EditorialGrid from "@/components/editorial-grid";
import ProgressiveSubmissionForm from "@/components/progressive-submission-form";
import { extractYouTubeId, getYouTubeThumbnail } from "@/lib/youtube-utils";

const categories = [
  { id: 'all', label: 'All', color: 'bg-white/10 text-white', icon: Grid },
  { id: 'writing', label: 'Writing', color: 'bg-blue-500/20 text-blue-300', icon: BookOpen },
  { id: 'art', label: 'Visual Work', color: 'bg-purple-500/20 text-purple-300', icon: PenTool },
  { id: 'playlist', label: 'Music', color: 'bg-green-500/20 text-green-300', icon: Users }
];

export default function Editorials() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);

  // Fetch featured content for hero section
  const { data: features = [] } = useQuery<FeatureWithContent[]>({
    queryKey: ['/api/features-with-content'],
  });

  // Get hero feature (first hero or main feature)
  const heroFeatures = features.filter(f => f.feature.featureType === 'hero' && f.content);
  const mainFeatures = features.filter(f => f.feature.featureType === 'main' && f.content);
  const heroContent = heroFeatures[0]?.content || mainFeatures[0]?.content;
  
  // If heroContent came from mainFeatures, exclude it from the featured grid
  const featuredGridItems = heroFeatures.length > 0 
    ? mainFeatures 
    : mainFeatures.slice(1); // Skip first item if it's being used as hero

  return (
    <div className="min-h-screen bg-[var(--cream)]">
      <Navigation />
      
      {/* Header - Clean white, non-sticky */}
      <div className="pt-20 pb-16 bg-[var(--cream)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link href="/">
              <Button variant="ghost" className="text-[var(--charcoal)]/70 hover:text-[var(--charcoal)] mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-6xl font-bold text-[var(--charcoal)] mb-2 tracking-tight">
              EDITORIAL
            </h1>
            <p className="text-lg text-[var(--charcoal)]/70 max-w-2xl mx-auto">
              Long-form articles, commissioned features, and editorial selections
            </p>
          </div>
        </div>
      </div>

      {/* Hero Featured Content - Full width, no crop */}
      {heroContent && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <a href={`/entry/${heroContent.slug}`} className="block group">
            {/* Featured badge */}
            <Badge className="mb-4 bg-[var(--editorial)] text-white">
              FEATURED
            </Badge>
            
            {/* Full-width image, no crop */}
            <div className="mb-6 bg-white rounded-lg overflow-hidden">
              {heroContent.videoUrl && extractYouTubeId(heroContent.videoUrl) ? (
                <div className="relative">
                  <img
                    src={getYouTubeThumbnail(extractYouTubeId(heroContent.videoUrl)!, 'maxres')}
                    alt={heroContent.title}
                    className="w-full h-auto object-contain"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="bg-[var(--editorial)] rounded-full p-6">
                      <Play className="w-12 h-12 text-white fill-white" />
                    </div>
                  </div>
                </div>
              ) : heroContent.coverImageUrl ? (
                <img
                  src={heroContent.coverImageUrl}
                  alt={heroContent.title}
                  className="w-full h-auto object-contain max-h-[70vh]"
                />
              ) : (
                <div className="w-full aspect-[16/9] bg-gradient-to-br from-[var(--editorial)]/20 to-[var(--editorial)]/5 flex items-center justify-center">
                  <BookOpen className="w-16 h-16 text-[var(--editorial)]/40" />
                </div>
              )}
            </div>

            {/* Content below image */}
            <div className="max-w-3xl">
              <h2 className="text-4xl md:text-5xl font-bold text-[var(--charcoal)] mb-4 group-hover:text-[var(--editorial)] transition-colors">
                {heroContent.title}
              </h2>
              {heroContent.excerpt && (
                <p className="text-xl text-[var(--charcoal)]/70 mb-4 leading-relaxed">
                  {heroContent.excerpt}
                </p>
              )}
              {heroContent.authors && heroContent.authors.length > 0 && (
                <p className="text-sm text-[var(--charcoal)]/60 uppercase tracking-wide">
                  By {heroContent.authors.join(', ')}
                </p>
              )}
            </div>
          </a>
        </div>
      )}

      {/* Featured Content Section - Separate from grid */}
      {featuredGridItems.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <h2 className="text-2xl font-bold text-[var(--charcoal)] mb-8 uppercase tracking-wide">
            Featured
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredGridItems.slice(0, 3).map((feature) => {
              if (!feature.content) return null;
              const content = feature.content;
              
              return (
                <a
                  key={content.id}
                  href={`/entry/${content.slug}`}
                  className="group block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Image - no crop */}
                  <div className="w-full aspect-[4/3] bg-[var(--cream)] flex items-center justify-center overflow-hidden">
                    {content.coverImageUrl ? (
                      <img
                        src={content.coverImageUrl}
                        alt={content.title}
                        className="w-full h-full object-contain"
                      />
                    ) : (content as any).gallery?.[0]?.src ? (
                      <img
                        src={(content as any).gallery[0].src}
                        alt={content.title}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <BookOpen className="w-12 h-12 text-[var(--charcoal)]/20" />
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="p-6">
                    <Badge className="mb-3 bg-[var(--editorial)]/10 text-[var(--editorial)] border-none">
                      {content.contentType?.toUpperCase() || 'EDITORIAL'}
                    </Badge>
                    <h3 className="text-xl font-bold text-[var(--charcoal)] mb-2 group-hover:text-[var(--editorial)] transition-colors">
                      {content.title}
                    </h3>
                    {content.excerpt && (
                      <p className="text-sm text-[var(--charcoal)]/70 line-clamp-2">
                        {content.excerpt}
                      </p>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main content column */}
          <div className="lg:col-span-3">{/* Search and filters */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search submissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white dark:bg-[var(--navy)] border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                onClick={() => setViewMode('grid')}
                size="sm"
                className="px-3"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                onClick={() => setViewMode('list')}
                size="sm"
                className="px-3"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Category filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(category.id)}
                  className="flex items-center space-x-2"
                  size="sm"
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{category.label}</span>
                </Button>
              );
            })}
          </div>
        </div>





        {/* Editorial Grid */}
        <EditorialGrid 
          selectedCategory={selectedCategory} 
          searchTerm={searchTerm} 
        />
        </div>

        {/* Sidebar - Clean, minimal */}
        <div className="lg:col-span-1 space-y-8">
          {/* Submit prompt */}
          <div className="bg-white border border-[var(--light-grey)] rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[var(--charcoal)] mb-2">
              Join Our Editorial Platform
            </h3>
            <p className="text-[var(--charcoal)]/70 text-sm mb-4">
              Submit your work, share discoveries, or pitch feature ideas to our editorial team.
            </p>
            <Button 
              onClick={() => setShowSubmissionForm(true)}
              className="w-full bg-[var(--editorial)] hover:bg-[var(--editorial)]/90 text-white font-medium"
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </div>
      
      
      {/* Editorial Submission Form */}
      {showSubmissionForm && (
        <ProgressiveSubmissionForm onClose={() => setShowSubmissionForm(false)} />
      )}
    </div>
  );
}