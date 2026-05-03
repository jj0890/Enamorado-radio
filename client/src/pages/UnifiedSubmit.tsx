import { useState } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Music, ListMusic, Image, FileText, Link as LinkIcon, BookOpen, Disc } from "lucide-react";
import { Link } from "wouter";

type SubmissionType = 'mix' | 'playlist' | 'artwork' | 'writing' | 'link' | 'album' | null;

export default function UnifiedSubmit() {
  const [selectedType, setSelectedType] = useState<SubmissionType>(null);

  const submissionTypes = [
    {
      id: 'mix' as const,
      title: 'DJ Mix',
      description: 'Share your recorded DJ set or mix',
      icon: Music,
      color: 'bg-olive-500'
    },
    {
      id: 'playlist' as const,
      title: 'Playlist',
      description: 'Curate a playlist from Spotify, Apple Music, or YouTube',
      icon: ListMusic,
      color: 'bg-terracotta-500'
    },
    {
      id: 'artwork' as const,
      title: 'Artwork / Visual',
      description: 'Submit photography, illustrations, or visual art',
      icon: Image,
      color: 'bg-burnt-orange-500'
    },
    {
      id: 'writing' as const,
      title: 'Writing',
      description: 'Share poems, essays, reviews, or creative writing',
      icon: BookOpen,
      color: 'bg-charcoal-800'
    },
    {
      id: 'link' as const,
      title: 'Link / Video',
      description: 'Share interesting links, videos, or web content',
      icon: LinkIcon,
      color: 'bg-burnt-orange-400'
    },
    {
      id: 'album' as const,
      title: 'Album Suggestion',
      description: 'Nominate an album for our Album of the Month',
      icon: Disc,
      color: 'bg-terracotta-400'
    }
  ];

  if (selectedType) {
    // Redirect to specific submission forms based on type
    const redirectMap = {
      'mix': '/submit-mix',
      'playlist': '/submit-playlist',
      'album': '/submit-album',
      'artwork': '/submit-editorial?type=art',
      'writing': '/submit-editorial?type=writing',
      'link': '/submit-editorial?type=link'
    };

    window.location.href = redirectMap[selectedType];
    return null;
  }

  return (
    <div className="min-h-screen bg-cream-100">
      <Navigation />

      <div className="pt-20 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-charcoal-900 mb-4 font-display">
              Submit to Enamorado
            </h1>
            <p className="text-xl text-charcoal-600 max-w-3xl mx-auto font-body">
              Share your creativity with our community. All submissions are reviewed by our editorial team and become part of our living archive.
            </p>
          </div>

          {/* How It Works */}
          <Card className="mb-12 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
            <CardHeader>
              <CardTitle className="text-2xl text-charcoal-900 font-display">How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-burnt-orange-500 text-white rounded-full flex items-center justify-center font-bold text-lg mb-3 mx-auto">
                    1
                  </div>
                  <h4 className="font-semibold mb-2 text-charcoal-900 font-accent">Choose Type</h4>
                  <p className="text-sm text-charcoal-600 font-body">
                    Select what you'd like to submit
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-burnt-orange-500 text-white rounded-full flex items-center justify-center font-bold text-lg mb-3 mx-auto">
                    2
                  </div>
                  <h4 className="font-semibold mb-2 text-charcoal-900 font-accent">Fill Form</h4>
                  <p className="text-sm text-charcoal-600 font-body">
                    Provide details and upload files
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-burnt-orange-500 text-white rounded-full flex items-center justify-center font-bold text-lg mb-3 mx-auto">
                    3
                  </div>
                  <h4 className="font-semibold mb-2 text-charcoal-900 font-accent">Editorial Review</h4>
                  <p className="text-sm text-charcoal-600 font-body">
                    Our team reviews your submission
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-burnt-orange-500 text-white rounded-full flex items-center justify-center font-bold text-lg mb-3 mx-auto">
                    4
                  </div>
                  <h4 className="font-semibold mb-2 text-charcoal-900 font-accent">Get Featured</h4>
                  <p className="text-sm text-charcoal-600 font-body">
                    Approved work joins our archive
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submission Type Selection */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-charcoal-900 mb-6 text-center font-display">
              What would you like to submit?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {submissionTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <Card
                    key={type.id}
                    className="cursor-pointer bg-white transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)] hover:-translate-y-1"
                    onClick={() => setSelectedType(type.id)}
                  >
                    <CardContent className="p-6">
                      <div className={`w-14 h-14 ${type.color} rounded-lg flex items-center justify-center mb-4`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-charcoal-900 mb-2 font-accent">
                        {type.title}
                      </h3>
                      <p className="text-charcoal-600 text-sm font-body">
                        {type.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Guidelines */}
          <Card className="bg-white shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
            <CardHeader>
              <CardTitle className="text-xl text-charcoal-900 font-display">Submission Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-charcoal-600 font-body">
              <div>
                <h4 className="font-semibold text-charcoal-900 mb-2 font-accent">Quality Standards</h4>
                <p className="text-sm">
                  We value authentic, original work. Ensure your submissions are high quality and properly credited.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-charcoal-900 mb-2 font-accent">Rights & Attribution</h4>
                <p className="text-sm">
                  You retain all rights to your work. By submitting, you grant us permission to feature it on our platform with proper attribution.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-charcoal-900 mb-2 font-accent">Review Process</h4>
                <p className="text-sm">
                  Our editorial team reviews all submissions. We aim to respond within 1-2 weeks. Not all submissions will be accepted, but we appreciate every contribution.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-charcoal-900 mb-2 font-accent">Community Standards</h4>
                <p className="text-sm">
                  We welcome diverse voices and perspectives. Submissions should be respectful and aligned with our community values.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
