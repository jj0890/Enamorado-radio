import { useState } from "react";
import { Link } from "wouter";
import { Search, Filter, Download, Eye, Calendar, User, ArrowRight } from "lucide-react";

interface ZineIssue {
  id: string;
  title: string;
  issue: string;
  date: string;
  description: string;
  category: string;
  author: string;
  tags: string[];
  featured: boolean;
  downloadUrl?: string;
}

export default function ZineArchive() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string>("all");

  const issues: ZineIssue[] = [
    {
      id: '1',
      title: 'The Underground Renaissance',
      issue: 'Issue #12 - Winter 2024',
      date: '2024-12-15',
      description: 'Exploring the resurgence of underground music scenes across major cities',
      category: 'Culture',
      author: 'Marcus Rivera',
      tags: ['underground', 'music', 'culture', 'scenes'],
      featured: true,
      downloadUrl: '/downloads/issue-12.pdf'
    },
    {
      id: '2',
      title: 'Digital vs. Analog',
      issue: 'Issue #11 - Fall 2024',
      date: '2024-09-20',
      description: 'The ongoing debate between digital and analog music production',
      category: 'Technology',
      author: 'Alex Stone',
      tags: ['digital', 'analog', 'production', 'debate'],
      featured: false,
      downloadUrl: '/downloads/issue-11.pdf'
    },
    {
      id: '3',
      title: 'Community Voices',
      issue: 'Issue #10 - Summer 2024',
      date: '2024-06-15',
      description: 'Highlighting local artists and their impact on community culture',
      category: 'Community',
      author: 'Luna Park',
      tags: ['community', 'artists', 'local', 'culture'],
      featured: true,
      downloadUrl: '/downloads/issue-10.pdf'
    },
    {
      id: '4',
      title: 'The Art of Curation',
      issue: 'Issue #9 - Spring 2024',
      date: '2024-03-10',
      description: 'How DJs and radio hosts curate the perfect listening experience',
      category: 'Arts',
      author: 'David Chen',
      tags: ['curation', 'dj', 'radio', 'experience'],
      featured: false,
      downloadUrl: '/downloads/issue-9.pdf'
    },
    {
      id: '5',
      title: 'Sound and Space',
      issue: 'Issue #8 - Winter 2023',
      date: '2023-12-05',
      description: 'The relationship between architectural spaces and acoustic environments',
      category: 'Architecture',
      author: 'Sarah Johnson',
      tags: ['sound', 'space', 'architecture', 'acoustics'],
      featured: false,
      downloadUrl: '/downloads/issue-8.pdf'
    },
    {
      id: '6',
      title: 'Global Rhythms',
      issue: 'Issue #7 - Fall 2023',
      date: '2023-09-15',
      description: 'Exploring world music traditions and their modern interpretations',
      category: 'Culture',
      author: 'Maria Santos',
      tags: ['world music', 'traditions', 'global', 'rhythms'],
      featured: true,
      downloadUrl: '/downloads/issue-7.pdf'
    }
  ];

  const categories = [...new Set(issues.map(issue => issue.category))];
  const allTags = [...new Set(issues.flatMap(issue => issue.tags))];

  const filteredIssues = issues.filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         issue.author.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || issue.category === selectedCategory;
    const matchesTag = selectedTag === "all" || issue.tags.includes(selectedTag);
    
    return matchesSearch && matchesCategory && matchesTag;
  });

  const featuredIssues = filteredIssues.filter(issue => issue.featured);
  const regularIssues = filteredIssues.filter(issue => !issue.featured);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold">
              ENAMORADO
            </Link>
            <div className="flex items-center space-x-6">
              <Link href="/" className="text-white/80 hover:text-white transition-colors">
                Home
              </Link>
              <Link href="/radio" className="text-white/80 hover:text-white transition-colors">
                Radio
              </Link>
              <Link href="/zine" className="text-blue-400 font-medium">
                Zine
              </Link>
              <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/20 rounded-full px-3 py-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-400 text-sm font-medium">LIVE</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-blue-400 font-semibold text-sm tracking-wider uppercase">
              Digital Culture Magazine
            </span>
            <h1 className="text-6xl font-bold mt-4 mb-6">ENAMORADO</h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
              Community-driven culture magazine showcasing art, fashion, photography, and creative voices
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                href="/zine/submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Submit Work
              </Link>
              <Link
                href="/zine/latest"
                className="border border-white/20 text-white hover:bg-white/10 px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Latest Issue
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-16">
        {/* Search and Filters */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search articles, authors, or topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex space-x-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Tags</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Featured Stories */}
        {featuredIssues.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center">Featured Stories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {featuredIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-blue-500/30 transition-all duration-300 cursor-pointer group"
                >
                  <div className="aspect-video bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg mb-4 flex items-center justify-center">
                    <div className="text-center">
                      <Calendar className="w-12 h-12 mx-auto mb-2 text-white/60" />
                      <div className="text-sm font-medium text-white/60">{issue.issue}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
                      {issue.category}
                    </span>
                    <span className="text-gray-400 text-sm">{formatDate(issue.date)}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">
                    {issue.title}
                  </h3>
                  <p className="text-gray-300 mb-4 line-clamp-3">{issue.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-400 text-sm">{issue.author}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      {issue.downloadUrl && (
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Archive Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Archive</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularIssues.map((issue) => (
              <div
                key={issue.id}
                className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-white/10 hover:border-blue-500/30 transition-all duration-300 cursor-pointer group"
              >
                <div className="aspect-square bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-lg mb-4 flex items-center justify-center">
                  <div className="text-center">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-white/40" />
                    <div className="text-xs font-medium text-white/40">{issue.issue}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs font-medium">
                    {issue.category}
                  </span>
                  <span className="text-gray-400 text-xs">{formatDate(issue.date)}</span>
                </div>
                <h3 className="font-bold mb-2 group-hover:text-blue-400 transition-colors">
                  {issue.title}
                </h3>
                <p className="text-gray-300 text-sm mb-3 line-clamp-2">{issue.description}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {issue.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="bg-gray-600/30 text-gray-300 px-2 py-1 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-400 text-xs">{issue.author}</span>
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-1 hover:bg-white/10 rounded transition-colors">
                      <Eye className="w-3 h-3" />
                    </button>
                    {issue.downloadUrl && (
                      <button className="p-1 hover:bg-white/10 rounded transition-colors">
                        <Download className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Section */}
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-8 border border-white/10">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Submit to Our Next Issue</h2>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              We're always looking for fresh voices and perspectives. Share your art, photography, 
              writing, or creative work with our community.
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                href="/zine/submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
              >
                <span>Submit Work</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/zine/guidelines"
                className="border border-white/20 text-white hover:bg-white/10 px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Guidelines
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}