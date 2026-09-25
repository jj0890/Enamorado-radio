import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ExternalLink } from "lucide-react";
import { format } from "date-fns";

type OpenCall = {
  id: number;
  title: string;
  slug: string;
  description: string;
  guidelines?: string;
  targetDate?: string;
  status: string;
  coverImageUrl?: string;
  publishedAt?: string;
};

export default function OpenCallsPage() {
  const { data: openCalls = [], isLoading } = useQuery<OpenCall[]>({
    queryKey: ["/api/public-open-calls"],
  });

  return (
    <div className="min-h-screen bg-[var(--cream)]">
      <Navigation />
      <div className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="pt-16 pb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3" data-testid="text-page-title">
              Open Calls
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl" data-testid="text-page-description">
              Explore our active submission opportunities. Each open call invites contributors to share work around a specific theme or topic.
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              <span className="ml-3 text-gray-600">Loading open calls...</span>
            </div>
          ) : openCalls.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-600" data-testid="text-no-calls">
                  No active open calls at this time. Check back soon for new opportunities!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {openCalls.map((call) => (
                <Link
                  key={call.id}
                  href={`/open-calls/${call.slug}`}
                  data-testid={`card-open-call-${call.slug}`}
                >
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full group">
                    <CardContent className="p-0">
                      {call.coverImageUrl && (
                        <div className="w-full aspect-video bg-gray-100 overflow-hidden">
                          <img
                            src={call.coverImageUrl}
                            alt={call.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            data-testid={`img-cover-${call.slug}`}
                          />
                        </div>
                      )}
                      <div className="p-6">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors" data-testid={`text-title-${call.slug}`}>
                            {call.title}
                          </h3>
                          <Badge variant="secondary" className="shrink-0" data-testid={`badge-status-${call.slug}`}>
                            Active
                          </Badge>
                        </div>
                        
                        <p className="text-gray-700 mb-4 line-clamp-3" data-testid={`text-description-${call.slug}`}>
                          {call.description}
                        </p>

                        {call.targetDate && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span data-testid={`text-target-date-${call.slug}`}>
                              Target: {format(new Date(call.targetDate), "MMMM d, yyyy")}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-1 text-sm text-orange-600 mt-4 group-hover:gap-2 transition-all">
                          <span>View details</span>
                          <ExternalLink className="w-4 h-4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── Spotlight bridge ── */}
        <div className="mt-16 pt-12 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-1">
              Already featured
            </p>
            <p className="text-neutral-700 font-medium">
              See who's been featured in a Spotlight before applying.
            </p>
          </div>
          <Link href="/spotlight">
            <button className="shrink-0 inline-flex items-center gap-2 border border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white transition-colors font-mono text-xs uppercase tracking-widest px-6 py-2.5">
              View Spotlight archive
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
