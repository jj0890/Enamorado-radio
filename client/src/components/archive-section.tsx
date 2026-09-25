import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Calendar } from "lucide-react";

interface ArchiveSectionProps {
  showHeader?: boolean;
}

interface Issue {
  id: number;
  title: string;
  slug: string;
  description?: string;
  coverImageUrl?: string;
  publishedAt?: string;
  featured?: boolean;
  status?: string;
}

export default function ArchiveSection({ showHeader = true }: ArchiveSectionProps) {
  const { data: issues = [], isLoading } = useQuery<Issue[]>({
    queryKey: ["/api/issues"],
  });

  const published = issues.filter(i => i.status === "published" || !i.status);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {showHeader && (
        <h2 className="text-2xl font-bold mb-8">Archive</h2>
      )}

      {published.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No published issues yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {published.map(issue => (
            <Link key={issue.id} href={`/issue/${issue.slug}`}>
              <Card className="h-full cursor-pointer hover:shadow-md transition-shadow group">
                {issue.coverImageUrl ? (
                  <div className="aspect-[3/4] overflow-hidden rounded-t-lg">
                    <img
                      src={issue.coverImageUrl}
                      alt={issue.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="aspect-[3/4] bg-editorial/10 flex items-center justify-center rounded-t-lg">
                    <BookOpen className="w-16 h-16 text-editorial/30" />
                  </div>
                )}
                <CardHeader className="pb-2">
                  {issue.featured && (
                    <Badge className="w-fit mb-2 bg-editorial text-white">Featured</Badge>
                  )}
                  <CardTitle className="text-lg group-hover:text-editorial transition-colors">
                    {issue.title}
                  </CardTitle>
                </CardHeader>
                {(issue.description || issue.publishedAt) && (
                  <CardContent className="pt-0">
                    {issue.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {issue.description}
                      </p>
                    )}
                    {issue.publishedAt && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {new Date(issue.publishedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                        })}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
