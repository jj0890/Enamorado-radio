import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckCircle, Music2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import StickyRadioPlayer from "@/components/StickyRadioPlayer";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { insertPlaylistSubmissionSchema } from "@shared/schema";

const formSchema = z.object({
  curatorName: z.string().min(1, 'Curator name is required'),
  title: z.string().min(1, 'Title is required'),
  playlistUrl: z.string().url('Must be a valid URL'),
  description: z.string().optional().nullable(),
  tags: z.string().optional().nullable(),
  artworkUrl: z.string().url().optional().nullable().or(z.literal('')),
  curatorEmail: z.string().email().optional().nullable().or(z.literal('')),
}).refine((data) => {
  const url = data.playlistUrl.toLowerCase();
  return url.includes('spotify.com') || 
         url.includes('apple.com') || 
         url.includes('music.apple') || 
         url.includes('youtube.com') || 
         url.includes('youtu.be') ||
         url.includes('soundcloud.com');
}, {
  message: "Please use a Spotify, Apple Music, YouTube, or SoundCloud playlist URL",
  path: ["playlistUrl"],
});

type FormData = z.infer<typeof formSchema>;

export default function SubmitPlaylist() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showSuccess, setShowSuccess] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      curatorName: "",
      title: "",
      playlistUrl: "",
      description: "",
      tags: "",
      artworkUrl: "",
      curatorEmail: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const tagsArray = data.tags 
        ? data.tags.split(',').map(t => t.trim()).filter(t => t.length > 0)
        : null;
      
      return apiRequest('POST', '/api/public/playlists', {
        curatorName: data.curatorName,
        title: data.title,
        playlistUrl: data.playlistUrl,
        description: data.description || null,
        tags: tagsArray,
        artworkUrl: data.artworkUrl || null,
        curatorEmail: data.curatorEmail || null,
      });
    },
    onSuccess: () => {
      setShowSuccess(true);
      
      toast({
        title: "Playlist Submitted Successfully!",
        description: "We'll review your submission and feature it soon.",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/community"] });
      
      setTimeout(() => {
        setLocation('/community');
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.output<typeof formSchema>) => {
    submitMutation.mutate(data);
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <StickyRadioPlayer />
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-500" />
            </div>
            <h1 className="text-4xl font-bold">Playlist Submitted!</h1>
            <p className="text-lg text-muted-foreground">
              Thank you for sharing your playlist with the community. Our editors will review it soon.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Button asChild variant="default" data-testid="button-view-community">
                <Link href="/community">
                  <Music2 className="w-4 h-4 mr-2" />
                  View Community
                </Link>
              </Button>
              <Button asChild variant="outline" data-testid="button-submit-another">
                <Link href="/submit-playlist">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Submit Another
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <StickyRadioPlayer />
      
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <Button asChild variant="ghost" size="sm" className="mb-4" data-testid="button-back">
            <Link href="/community">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Community
            </Link>
          </Button>
          
          <h1 className="text-4xl font-bold mb-2">Submit a Playlist</h1>
          <p className="text-lg text-muted-foreground">
            Share your curated playlists from Spotify, Apple Music, YouTube, or SoundCloud with the community.
          </p>
        </div>

        {/* Submission Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-card border rounded-lg p-6">
            {/* Curator Name */}
            <FormField
              control={form.control}
              name="curatorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name *</FormLabel>
                  <FormControl>
                    <Input
                      data-testid="input-curator-name"
                      placeholder="e.g., DJ Shadow, Curator Name"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>How should we credit you?</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Playlist Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Playlist Title *</FormLabel>
                  <FormControl>
                    <Input
                      data-testid="input-playlist-title"
                      placeholder="e.g., Late Night Vibes, Sunday Morning Jazz"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Playlist URL */}
            <FormField
              control={form.control}
              name="playlistUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Playlist URL *</FormLabel>
                  <FormControl>
                    <Input
                      data-testid="input-playlist-url"
                      type="url"
                      placeholder="https://open.spotify.com/playlist/..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Spotify, Apple Music, YouTube, or SoundCloud playlist link
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      data-testid="input-playlist-description"
                      placeholder="Tell us about your playlist - what's the vibe, when to listen, etc."
                      {...field}
                      value={field.value || ""}
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags */}
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input
                      data-testid="input-playlist-tags"
                      placeholder="e.g., house, techno, chill, 90s"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>Separate tags with commas</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Optional: Custom Artwork URL */}
            <FormField
              control={form.control}
              name="artworkUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Artwork URL (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      data-testid="input-artwork-url"
                      type="url"
                      placeholder="https://..."
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Override the default playlist artwork (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Optional: Email */}
            <FormField
              control={form.control}
              name="curatorEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      data-testid="input-curator-email"
                      type="email"
                      placeholder="your@email.com"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    For updates about your submission (we won't spam you)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                data-testid="button-submit-playlist"
                disabled={submitMutation.isPending}
                className="w-full"
                size="lg"
              >
                {submitMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Submit Playlist
                  </>
                )}
              </Button>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              By submitting, you confirm this playlist is yours to share. We'll review it and feature it on the community page.
            </p>
          </form>
        </Form>
      </div>
    </div>
  );
}
