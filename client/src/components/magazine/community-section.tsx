import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Grid, Plus } from "lucide-react";
import { Link } from "wouter";
import CommunityGrid from "./community-grid";
import ContentModal from "./content-modal";

type Row = {
  id: string;
  kind: "art" | "playlist" | "writing" | "link";
  title: string;
  subtitle?: string;
  author?: string;
  authorHandle?: string;
  createdAt?: string;
  thumbnail?: string | null;
  files?: { url: string; type: string }[];
  externalUrl?: string | null;
  likes?: number;
};

export default function CommunitySection() {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  
  const { data: submissions = [], isLoading } = useQuery<Row[]>({
    queryKey: ['/api/community-submissions'],
  });

  const handleCardClick = (submission: Row) => {
    setSelectedSlug(submission.id);
  };

  const handleCloseModal = () => {
    setSelectedSlug(null);
  };

  if (isLoading) {
    return (
      <section id="community" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-1 w-16 bg-[var(--editorial)]"></div>
              <p className="text-[var(--editorial)] font-semibold text-sm tracking-[0.2em] uppercase">
                Community Archive
              </p>
              <div className="h-1 w-16 bg-[var(--editorial)]"></div>
            </div>
            <h2 className="text-5xl lg:text-6xl font-bold text-[var(--charcoal)] mb-6 tracking-tight">What We're Enamored With</h2>
            <div className="col-span-full text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--editorial)]" data-testid="loading-community"></div>
              <p className="text-[var(--charcoal)]/60 mt-4">Loading community submissions...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="community" className="py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-1 w-16 bg-[var(--editorial)]"></div>
            <p className="text-[var(--editorial)] font-semibold text-sm tracking-[0.2em] uppercase">
              Community Archive
            </p>
            <div className="h-1 w-16 bg-[var(--editorial)]"></div>
          </div>
          <h2 className="text-5xl lg:text-6xl font-bold text-[var(--charcoal)] mb-6 tracking-tight">What We're Enamored With</h2>
          <p className="text-xl text-[var(--charcoal)]/60 max-w-2xl mx-auto leading-relaxed">
            Poetry, art, playlists, and discoveries from our community — the spontaneous, the thoughtful, the beautiful
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          {submissions.length === 0 ? (
            <div className="space-y-12">
              <Card className="border-dashed border-2 border-border/50">
                <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6">
                    <Grid className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Community Feed is Empty</h3>
                  <p className="text-muted-foreground max-w-md mb-6 leading-relaxed">
                    No community submissions yet. This is where approved poems, art, playlists, and discoveries will appear.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200">
                <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
                  <div className="w-16 h-16 bg-[var(--editorial)]/10 rounded-full flex items-center justify-center mb-6">
                    <Plus className="w-8 h-8 text-[var(--editorial)]" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Be the First to Share</h3>
                  <p className="text-muted-foreground max-w-md mb-6 leading-relaxed">
                    Share your poems, art, playlists, or discoveries. Help build our community archive of beautiful moments and creative work.
                  </p>
                  <Link href="/submit">
                    <Button className="bg-[var(--editorial)] hover:bg-[var(--editorial)]/90 text-white">
                      Submit Your Work
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-12">
              <div className="relative">
                <CommunityGrid 
                  submissions={submissions}
                  onCardClick={handleCardClick}
                />
                {submissions.length > 6 && (
                  <div className="mt-12 text-center">
                    <Link href="/community">
                      <Button className="bg-[var(--editorial)] text-white hover:bg-[var(--editorial)]/90" size="lg">
                        View All {submissions.length} Submissions →
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
              
              {/* Modal for detailed view */}
              <ContentModal 
                open={!!selectedSlug}
                onClose={handleCloseModal}
                contentSlug={selectedSlug}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
