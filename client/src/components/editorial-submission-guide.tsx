import { FileText, Image, Link2, Music, Video, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function EditorialSubmissionGuide() {
  const contentTypes = [
    {
      icon: Image,
      title: "Visual Art & Photography",
      description: "Share original artwork, illustrations, photography, or visual projects",
      examples: "Digital art, analog photography, graphic design, collage, mixed media",
      color: "text-pink-400"
    },
    {
      icon: FileText,
      title: "Writing & Essays",
      description: "Creative writing, essays, poetry, cultural commentary, or interviews",
      examples: "Personal essays, music criticism, poetry, short stories, interviews",
      color: "text-blue-400"
    },
    {
      icon: Music,
      title: "DJ Mixes & Audio",
      description: "Share your recorded DJ sets, mixes, or audio creations",
      examples: "DJ mixes, radio shows, podcasts, field recordings, sound collages",
      color: "text-orange-400"
    },
    {
      icon: Video,
      title: "Video Content",
      description: "Video art, documentaries, performances, or visual storytelling",
      examples: "Short films, music videos, video essays, performance documentation",
      color: "text-purple-400"
    },
    {
      icon: Link2,
      title: "Curated Links",
      description: "Share playlists, articles, or content that resonates with you",
      examples: "Spotify playlists, Substack articles, YouTube videos, SoundCloud tracks",
      color: "text-green-400"
    },
    {
      icon: BookOpen,
      title: "Community Moments",
      description: "Document local scenes, events, or community happenings",
      examples: "Event recaps, local scene reports, photo essays, venue profiles",
      color: "text-cyan-400"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-bold text-white">Editorial Submission Guidelines</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          We're looking for authentic voices and genuine passion. Share what you're enamored with -
          the things that have your attention, spark your curiosity, or resonate with your experience.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contentTypes.map((type) => {
          const Icon = type.icon;
          return (
            <Card key={type.title} className="bg-[var(--navy)]/50 border-border hover:border-editorial/50 transition-colors">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center space-x-3">
                  <Icon className={`w-6 h-6 ${type.color}`} />
                  <h3 className="text-white font-semibold">{type.title}</h3>
                </div>
                <p className="text-muted-foreground text-sm">{type.description}</p>
                <div className="pt-2 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-white">Examples:</span> {type.examples}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="space-y-4">
        <Card className="bg-gradient-to-r from-pink-500/10 to-blue-500/10 border-pink-500/20">
          <CardContent className="p-6 space-y-3">
            <h3 className="text-white font-semibold text-lg">What We're Looking For</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start space-x-2">
                <span className="text-pink-400 mt-1">•</span>
                <span><strong className="text-white">Authenticity</strong> - Share your genuine perspective, not what you think we want to hear</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-pink-400 mt-1">•</span>
                <span><strong className="text-white">Context</strong> - Help us understand why this matters to you right now</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-pink-400 mt-1">•</span>
                <span><strong className="text-white">Quality</strong> - Take time to craft your submission thoughtfully</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-pink-400 mt-1">•</span>
                <span><strong className="text-white">Originality</strong> - For creative work, we prioritize original content over reposts</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-[var(--navy)]/50 border-border">
          <CardContent className="p-6 space-y-3">
            <h3 className="text-white font-semibold text-lg">Editorial Review Process</h3>
            <ol className="space-y-2 text-muted-foreground list-decimal list-inside">
              <li>Submit your work through the submission form</li>
              <li>Our editorial team reviews all submissions carefully</li>
              <li>Selected works are featured on the homepage and in community zines</li>
              <li>You'll receive an email notification about your submission status</li>
            </ol>
            <p className="text-sm text-muted-foreground pt-2 border-t border-border/50">
              We review submissions on a rolling basis. Not every submission will be published,
              but we read and appreciate every one. Quality over quantity is our guiding principle.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardContent className="p-6 space-y-3">
            <h3 className="text-white font-semibold text-lg">File Formats & Technical Requirements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-white font-medium mb-2">Images</p>
                <p className="text-muted-foreground">JPG, PNG, GIF, WEBP - up to 25MB</p>
              </div>
              <div>
                <p className="text-white font-medium mb-2">Documents</p>
                <p className="text-muted-foreground">PDF, TXT, DOCX - up to 10MB</p>
              </div>
              <div>
                <p className="text-white font-medium mb-2">Audio</p>
                <p className="text-muted-foreground">MP3, WAV, FLAC - or SoundCloud/Mixcloud links</p>
              </div>
              <div>
                <p className="text-white font-medium mb-2">Video</p>
                <p className="text-muted-foreground">YouTube, Vimeo, or direct upload (MP4, up to 100MB)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <p className="text-blue-300 text-sm">
            <strong className="text-blue-200">Note:</strong> By submitting work, you confirm you have the rights to share it
            and grant us permission to feature it on our platform. You retain full ownership of your work.
          </p>
        </div>
      </div>
    </div>
  );
}
