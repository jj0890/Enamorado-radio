import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import ArchiveSection from "@/components/archive-section";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, Clock, Globe, Calendar, Users, Archive as ArchiveIcon } from "lucide-react";
import { Link } from "wouter";
import type { Issue } from "@/../../shared/schema";

export default function Archive() {
  const { data: issues } = useQuery<Issue[]>({
    queryKey: ['/api/issues'],
  });

  // Set page title and meta description
  useEffect(() => {
    document.title = "Archive - Enamorado Magazine | Past Issues and Collections";
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 
        'Browse the complete archive of Enamorado Magazine issues. Discover past collections of independent culture, creative work, and community voices.'
      );
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Browse the complete archive of Enamorado Magazine issues. Discover past collections of independent culture, creative work, and community voices.';
      document.head.appendChild(meta);
    }
  }, []);

  const publishedIssuesCount = issues?.length || 0;
  const totalContent = issues?.reduce((acc, issue) => acc + (issue.featured ? 1 : 0), 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <div className="pt-20 pb-12 bg-gradient-to-br from-background via-background/95 to-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link href="/">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground mb-6 group">
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to Home
              </Button>
            </Link>
            
            <div className="max-w-4xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-editorial/10 rounded-lg">
                  <ArchiveIcon className="w-6 h-6 text-editorial" />
                </div>
                <Badge variant="outline" className="border-editorial/30 text-editorial">
                  Magazine Archive
                </Badge>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                Past Issues & Collections
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
                Explore our complete archive of published magazine issues. Each issue represents 
                a curated collection of independent culture, featuring the best creative work from 
                our community of artists, writers, and cultural contributors.
              </p>
              
              {publishedIssuesCount > 0 && (
                <div className="flex flex-wrap items-center gap-6 mt-8 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-editorial" />
                    <span><strong className="text-foreground">{publishedIssuesCount}</strong> Published Issues</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-editorial" />
                    <span>Since 2024</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-editorial" />
                    <span>Community Driven</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Archive Features */}
      <div className="py-12 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-border/50 hover:border-editorial/30 transition-colors group">
              <CardContent className="pt-8 pb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-editorial/10 rounded-lg group-hover:bg-editorial/20 transition-colors">
                    <BookOpen className="w-5 h-5 text-editorial" />
                  </div>
                  <h3 className="text-foreground font-semibold text-lg">Complete Issues</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Full magazine issues featuring curated editorial content, community submissions, 
                  and cultural commentary, available to read online.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-border/50 hover:border-editorial/30 transition-colors group">
              <CardContent className="pt-8 pb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-editorial/10 rounded-lg group-hover:bg-editorial/20 transition-colors">
                    <Clock className="w-5 h-5 text-editorial" />
                  </div>
                  <h3 className="text-foreground font-semibold text-lg">Seasonal Collections</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Themed quarterly releases that capture the zeitgeist of independent culture 
                  and showcase emerging voices in our creative community.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-border/50 hover:border-editorial/30 transition-colors group">
              <CardContent className="pt-8 pb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-editorial/10 rounded-lg group-hover:bg-editorial/20 transition-colors">
                    <Globe className="w-5 h-5 text-editorial" />
                  </div>
                  <h3 className="text-foreground font-semibold text-lg">Open Access</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  All issues are freely accessible to readers worldwide, supporting our mission 
                  to democratize independent cultural publishing.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Archive Grid */}
      <div className="py-16">
        <ArchiveSection showHeader={false} />
      </div>
      
      {/* Call to Action */}
      {publishedIssuesCount > 0 && (
        <div className="py-16 bg-editorial/5">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Be Part of Our Next Issue
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              We're always looking for fresh voices and creative work. Submit your poetry, 
              art, music, or cultural commentary to be featured in upcoming issues.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/submit">
                <Button size="lg" className="bg-editorial hover:bg-editorial/90 text-white px-8">
                  Submit Your Work
                </Button>
              </Link>
              <Link href="/guides">
                <Button size="lg" variant="outline" className="border-editorial text-editorial hover:bg-editorial hover:text-white px-8">
                  Submission Guidelines
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}