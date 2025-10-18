import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { Upload, ArrowLeft, CheckCircle2, AlertCircle, FileAudio } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

const episodeSchema = z.object({
  residentId: z.string().optional(),
  residentName: z.string().min(1, "Your name is required"),
  title: z.string().min(1, "Episode title is required"),
  genre: z.string().min(1, "Genre is required"),
  description: z.string().optional(),
  showNotes: z.string().optional(),
  seriesTitle: z.string().optional(),
  episodeNumber: z.string().optional(),
  tags: z.string().optional(),
  coverArtUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type EpisodeFormData = z.infer<typeof episodeSchema>;

export default function ResidentEpisodeSubmit() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const form = useForm<EpisodeFormData>({
    resolver: zodResolver(episodeSchema),
    defaultValues: {
      residentId: "",
      residentName: "",
      title: "",
      genre: "",
      description: "",
      showNotes: "",
      seriesTitle: "",
      episodeNumber: "",
      tags: "",
      coverArtUrl: "",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('audio/') && !file.name.endsWith('.mp3')) {
        toast({
          title: "Invalid file type",
          description: "Please upload an MP3 audio file",
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > 500 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 500MB",
          variant: "destructive",
        });
        return;
      }
      
      setAudioFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith('audio/') && !file.name.endsWith('.mp3')) {
        toast({
          title: "Invalid file type",
          description: "Please upload an MP3 audio file",
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > 500 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 500MB",
          variant: "destructive",
        });
        return;
      }
      
      setAudioFile(file);
    }
  };

  const onSubmit = async (data: EpisodeFormData) => {
    if (!audioFile) {
      toast({
        title: "Missing audio file",
        description: "Please upload an MP3 file for your episode",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('audioFile', audioFile);
      formData.append('residentId', data.residentId || '');
      formData.append('residentName', data.residentName);
      formData.append('title', data.title);
      formData.append('genre', data.genre);
      if (data.description) formData.append('description', data.description);
      if (data.showNotes) formData.append('showNotes', data.showNotes);
      if (data.seriesTitle) formData.append('seriesTitle', data.seriesTitle);
      if (data.episodeNumber) formData.append('episodeNumber', data.episodeNumber);
      if (data.tags) formData.append('tags', data.tags);
      if (data.coverArtUrl) formData.append('coverArtUrl', data.coverArtUrl);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percent);
        }
      });

      const response = await new Promise<any>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        };
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.open('POST', '/api/resident/episode/submit');
        xhr.send(formData);
      });

      if (response.success) {
        setUploadSuccess(true);
        toast({
          title: "Episode submitted!",
          description: "Your episode has been submitted for review. We'll notify you when it's approved.",
        });
        
        // Reset form
        form.reset();
        setAudioFile(null);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload episode. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  if (uploadSuccess) {
    return (
      <div className="min-h-screen bg-black pt-16 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-white">Episode Submitted!</h2>
                <p className="text-zinc-400">
                  Your episode has been submitted for review. Our team will review it and you'll receive a notification once it's approved.
                </p>
                <div className="flex gap-4 justify-center pt-4">
                  <Button
                    onClick={() => setUploadSuccess(false)}
                    variant="outline"
                    className="border-zinc-700 hover:bg-zinc-800"
                    data-testid="button-submit-another"
                  >
                    Submit Another
                  </Button>
                  <Link href="/resident">
                    <Button className="bg-red-600 hover:bg-red-700" data-testid="link-dashboard">
                      Go to Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-16 pb-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/resident">
          <Button
            variant="ghost"
            className="mb-6 text-zinc-400 hover:text-white hover:bg-zinc-900"
            data-testid="link-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Submit Your Episode</h1>
          <p className="text-zinc-400">
            Upload your pre-recorded episode for admin review and scheduling
          </p>
        </div>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Episode Details</CardTitle>
            <CardDescription className="text-zinc-400">
              Fill in the details for your episode and upload your audio file
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Audio File Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">
                    Audio File <span className="text-red-500">*</span>
                  </label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDragging
                        ? 'border-red-500 bg-red-500/10'
                        : 'border-zinc-700 hover:border-zinc-600'
                    } ${audioFile ? 'bg-zinc-800/50' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    {audioFile ? (
                      <div className="space-y-2">
                        <FileAudio className="w-12 h-12 text-green-500 mx-auto" />
                        <p className="text-white font-medium">{audioFile.name}</p>
                        <p className="text-sm text-zinc-400">
                          {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setAudioFile(null)}
                          className="border-zinc-700 hover:bg-zinc-800 mt-2"
                          data-testid="button-remove-file"
                        >
                          Remove File
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
                        <p className="text-white mb-2">
                          Drag and drop your MP3 file here, or click to browse
                        </p>
                        <p className="text-sm text-zinc-500">
                          Maximum file size: 500MB
                        </p>
                        <input
                          type="file"
                          accept="audio/mpeg,audio/mp3,.mp3"
                          onChange={handleFileChange}
                          className="hidden"
                          id="audio-upload"
                          data-testid="input-audio-file"
                        />
                        <label htmlFor="audio-upload">
                          <Button
                            type="button"
                            variant="outline"
                            className="mt-4 border-zinc-700 hover:bg-zinc-800"
                            asChild
                          >
                            <span>Browse Files</span>
                          </Button>
                        </label>
                      </>
                    )}
                  </div>
                </div>

                {/* Resident Name */}
                <FormField
                  control={form.control}
                  name="residentName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">
                        Your Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="DJ Name / Artist Name"
                          className="bg-zinc-800 border-zinc-700 text-white"
                          data-testid="input-resident-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Episode Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">
                        Episode Title <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Late Night Sessions #12"
                          className="bg-zinc-800 border-zinc-700 text-white"
                          data-testid="input-title"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Genre */}
                <FormField
                  control={form.control}
                  name="genre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">
                        Genre <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white" data-testid="select-genre">
                            <SelectValue placeholder="Select a genre" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="House">House</SelectItem>
                          <SelectItem value="Techno">Techno</SelectItem>
                          <SelectItem value="Hip Hop">Hip Hop</SelectItem>
                          <SelectItem value="R&B">R&B</SelectItem>
                          <SelectItem value="Electronic">Electronic</SelectItem>
                          <SelectItem value="Jazz">Jazz</SelectItem>
                          <SelectItem value="Funk">Funk</SelectItem>
                          <SelectItem value="Soul">Soul</SelectItem>
                          <SelectItem value="Disco">Disco</SelectItem>
                          <SelectItem value="Ambient">Ambient</SelectItem>
                          <SelectItem value="Experimental">Experimental</SelectItem>
                          <SelectItem value="Mixed">Mixed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Series Title */}
                <FormField
                  control={form.control}
                  name="seriesTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Series Title (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Late Night Sessions"
                          className="bg-zinc-800 border-zinc-700 text-white"
                          data-testid="input-series-title"
                        />
                      </FormControl>
                      <FormDescription className="text-zinc-500">
                        If this episode is part of a series
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Episode Number */}
                <FormField
                  control={form.control}
                  name="episodeNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Episode Number (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          placeholder="e.g., 12"
                          className="bg-zinc-800 border-zinc-700 text-white"
                          data-testid="input-episode-number"
                        />
                      </FormControl>
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
                      <FormLabel className="text-white">Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Brief description of your episode..."
                          className="bg-zinc-800 border-zinc-700 text-white min-h-[80px]"
                          data-testid="textarea-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Show Notes */}
                <FormField
                  control={form.control}
                  name="showNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Show Notes / Tracklist (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Full tracklist, timestamps, links, etc..."
                          className="bg-zinc-800 border-zinc-700 text-white min-h-[120px]"
                          data-testid="textarea-show-notes"
                        />
                      </FormControl>
                      <FormDescription className="text-zinc-500">
                        Include full tracklist, timestamps, or any additional notes
                      </FormDescription>
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
                      <FormLabel className="text-white">Tags (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., deep house, melodic, sunset vibes"
                          className="bg-zinc-800 border-zinc-700 text-white"
                          data-testid="input-tags"
                        />
                      </FormControl>
                      <FormDescription className="text-zinc-500">
                        Separate tags with commas
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Cover Art URL */}
                <FormField
                  control={form.control}
                  name="coverArtUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Cover Art URL (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="url"
                          placeholder="https://example.com/cover.jpg"
                          className="bg-zinc-800 border-zinc-700 text-white"
                          data-testid="input-cover-art-url"
                        />
                      </FormControl>
                      <FormDescription className="text-zinc-500">
                        Link to your episode artwork
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Upload Progress */}
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white">Uploading...</span>
                      <span className="text-zinc-400">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="bg-zinc-800" />
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={isUploading || !audioFile}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50"
                    data-testid="button-submit"
                  >
                    {isUploading ? (
                      <>Uploading... {uploadProgress}%</>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Submit Episode
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
