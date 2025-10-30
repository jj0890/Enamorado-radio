import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Disc, CheckCircle } from "lucide-react";

export default function SubmitAlbum() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [artist, setArtist] = useState("");
  const [title, setTitle] = useState("");
  const [releaseYear, setReleaseYear] = useState("");
  const [suggestedBy, setSuggestedBy] = useState("");
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/albums/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artist,
          title,
          releaseYear: releaseYear ? parseInt(releaseYear) : undefined,
          suggestedBy,
          reason,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to submit suggestion");
      }

      return res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Album Suggestion Submitted!",
        description: "Thank you for your suggestion. Our team will review it soon.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate();
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#FEFCF9] flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold font-mono text-gray-900 mb-2">
            Thank You!
          </h1>
          <p className="font-mono text-gray-600 mb-6">
            Your album suggestion has been submitted successfully. Our editorial team will review it
            for inclusion in an upcoming Albums of the Month pick.
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => {
                setSubmitted(false);
                setArtist("");
                setTitle("");
                setReleaseYear("");
                setSuggestedBy("");
                setReason("");
              }}
              className="w-full font-mono"
              data-testid="button-submit-another"
            >
              Submit Another Album
            </Button>
            <Link href="/albums">
              <a className="block w-full">
                <Button variant="outline" className="w-full font-mono" data-testid="button-view-picks">
                  View Albums of the Month
                </Button>
              </a>
            </Link>
            <Link href="/">
              <a className="text-navy hover:underline font-mono inline-block mt-2">
                ← Back home
              </a>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FEFCF9]">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Disc className="w-8 h-8 text-navy" />
            <h1 className="text-4xl font-bold font-mono text-navy">
              Suggest an Album
            </h1>
          </div>
          <p className="font-mono text-gray-600">
            Help us discover great music by suggesting albums for our monthly picks
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-mono">Album Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium font-mono mb-1">
                  Artist Name *
                </label>
                <Input
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="e.g., Radiohead"
                  required
                  className="font-mono"
                  data-testid="input-artist"
                />
              </div>

              <div>
                <label className="block text-sm font-medium font-mono mb-1">
                  Album Title *
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., OK Computer"
                  required
                  className="font-mono"
                  data-testid="input-title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium font-mono mb-1">
                  Release Year (optional)
                </label>
                <Input
                  type="number"
                  value={releaseYear}
                  onChange={(e) => setReleaseYear(e.target.value)}
                  placeholder="e.g., 1997"
                  min="1900"
                  max={new Date().getFullYear()}
                  className="font-mono"
                  data-testid="input-year"
                />
              </div>

              <div>
                <label className="block text-sm font-medium font-mono mb-1">
                  Your Name *
                </label>
                <Input
                  value={suggestedBy}
                  onChange={(e) => setSuggestedBy(e.target.value)}
                  placeholder="e.g., John Smith"
                  required
                  className="font-mono"
                  data-testid="input-suggested-by"
                />
              </div>

              <div>
                <label className="block text-sm font-medium font-mono mb-1">
                  Why this album? (optional)
                </label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Tell us what makes this album special or why it deserves to be featured..."
                  rows={4}
                  className="font-mono"
                  data-testid="textarea-reason"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="flex-1 font-mono"
                  data-testid="button-submit-suggestion"
                >
                  {submitMutation.isPending ? "Submitting..." : "Submit Suggestion"}
                </Button>
                <Link href="/albums">
                  <a>
                    <Button variant="outline" type="button" className="font-mono" data-testid="button-cancel">
                      Cancel
                    </Button>
                  </a>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-white rounded border">
          <h3 className="font-mono font-bold text-sm mb-2">What happens next?</h3>
          <ul className="text-sm font-mono text-gray-600 space-y-1 list-disc list-inside">
            <li>Our editorial team reviews all submissions</li>
            <li>Albums with strong support may be featured in monthly picks</li>
            <li>You'll see your suggestion in Albums of the Month if selected</li>
          </ul>
        </div>

        <div className="mt-8 text-center">
          <Link href="/">
            <a className="text-navy hover:underline font-mono">← Back home</a>
          </Link>
        </div>
      </div>
    </div>
  );
}
