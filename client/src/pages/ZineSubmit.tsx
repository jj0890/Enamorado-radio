import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { insertZineSubmissionSchema } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

const formSchema = insertZineSubmissionSchema.extend({
  contentType: z.enum(['article', 'interview', 'review', 'photo-essay', 'mixtape-notes']),
  category: z.enum(['music', 'culture', 'art', 'technology', 'politics']),
});

type FormData = z.infer<typeof formSchema>;

export default function ZineSubmit() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      authorName: '',
      authorEmail: '',
      authorBio: '',
      title: '',
      subtitle: '',
      contentType: 'article',
      category: 'music',
      content: '',
      excerpt: '',
      tags: '',
      imageUrls: '',
      audioUrls: '',
      externalLinks: '',
      collaborators: '',
      submissionNotes: '',
    },
  });

  const watchedValues = watch();

  const createSubmission = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest('/api/zine-submissions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      setIsSubmitted(true);
      reset();
      queryClient.invalidateQueries({ queryKey: ['/api/zine-submissions'] });
    },
  });

  const onSubmit = (data: FormData) => {
    createSubmission.mutate(data);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center py-16">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
              <h1 className="text-4xl font-bold mb-4">Submission Received!</h1>
              <p className="text-xl text-gray-300 mb-8">
                Thank you for your submission. We'll review it and get back to you soon.
              </p>
              <div className="space-y-4">
                <Link href="/zine" className="inline-block">
                  <Button variant="outline" className="mr-4">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Zine
                  </Button>
                </Link>
                <Button 
                  onClick={() => setIsSubmitted(false)}
                  variant="default"
                >
                  Submit Another
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/zine" className="inline-flex items-center text-gray-400 hover:text-white mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Zine
            </Link>
            <h1 className="text-4xl font-bold mb-4">Submit Your Work</h1>
            <p className="text-xl text-gray-300">
              Share your creative work with the Enamorado Radio community
            </p>
          </div>

          {/* Toggle Preview */}
          <div className="mb-6">
            <Button
              variant={previewMode ? "default" : "outline"}
              onClick={() => setPreviewMode(!previewMode)}
              className="mr-4"
            >
              {previewMode ? "Edit" : "Preview"}
            </Button>
          </div>

          {previewMode ? (
            /* Preview Mode */
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-2xl">{watchedValues.title || "Untitled"}</CardTitle>
                {watchedValues.subtitle && (
                  <CardDescription className="text-lg text-gray-300">
                    {watchedValues.subtitle}
                  </CardDescription>
                )}
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <span>by {watchedValues.authorName || "Anonymous"}</span>
                  <span>•</span>
                  <span className="capitalize">{watchedValues.contentType}</span>
                  <span>•</span>
                  <span className="capitalize">{watchedValues.category}</span>
                </div>
              </CardHeader>
              <CardContent>
                {watchedValues.excerpt && (
                  <p className="text-gray-300 italic mb-4">{watchedValues.excerpt}</p>
                )}
                <div className="prose prose-invert max-w-none">
                  {watchedValues.content ? (
                    <div className="whitespace-pre-wrap">{watchedValues.content}</div>
                  ) : (
                    <p className="text-gray-500">No content yet...</p>
                  )}
                </div>
                {watchedValues.tags && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {watchedValues.tags.split(',').map((tag, index) => (
                      <span
                        key={index}
                        className="bg-gray-800 text-gray-300 px-2 py-1 rounded-full text-sm"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            /* Form Mode */
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Author Information */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle>Author Information</CardTitle>
                  <CardDescription>Tell us about yourself</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="authorName">Name *</Label>
                      <Input
                        id="authorName"
                        {...register('authorName')}
                        className="bg-gray-800 border-gray-700 text-white"
                        placeholder="Your name"
                      />
                      {errors.authorName && (
                        <p className="text-red-400 text-sm mt-1">{errors.authorName.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="authorEmail">Email *</Label>
                      <Input
                        id="authorEmail"
                        type="email"
                        {...register('authorEmail')}
                        className="bg-gray-800 border-gray-700 text-white"
                        placeholder="your.email@example.com"
                      />
                      {errors.authorEmail && (
                        <p className="text-red-400 text-sm mt-1">{errors.authorEmail.message}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="authorBio">Bio</Label>
                    <Textarea
                      id="authorBio"
                      {...register('authorBio')}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Content Details */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle>Content Details</CardTitle>
                  <CardDescription>What are you submitting?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contentType">Content Type *</Label>
                      <Select onValueChange={(value) => setValue('contentType', value as any)}>
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                          <SelectValue placeholder="Select content type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="article">Article</SelectItem>
                          <SelectItem value="interview">Interview</SelectItem>
                          <SelectItem value="review">Review</SelectItem>
                          <SelectItem value="photo-essay">Photo Essay</SelectItem>
                          <SelectItem value="mixtape-notes">Mixtape Notes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select onValueChange={(value) => setValue('category', value as any)}>
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="music">Music</SelectItem>
                          <SelectItem value="culture">Culture</SelectItem>
                          <SelectItem value="art">Art</SelectItem>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="politics">Politics</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      {...register('title')}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="Your piece title"
                    />
                    {errors.title && (
                      <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="subtitle">Subtitle</Label>
                    <Input
                      id="subtitle"
                      {...register('subtitle')}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="Optional subtitle"
                    />
                  </div>
                  <div>
                    <Label htmlFor="excerpt">Excerpt</Label>
                    <Textarea
                      id="excerpt"
                      {...register('excerpt')}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="Brief description or teaser..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Main Content */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle>Main Content</CardTitle>
                  <CardDescription>Your article, story, or creative work</CardDescription>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label htmlFor="content">Content *</Label>
                    <Textarea
                      id="content"
                      {...register('content')}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="Write your content here..."
                      rows={15}
                    />
                    {errors.content && (
                      <p className="text-red-400 text-sm mt-1">{errors.content.message}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Additional Information */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle>Additional Information</CardTitle>
                  <CardDescription>Optional media and metadata</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="tags">Tags</Label>
                    <Input
                      id="tags"
                      {...register('tags')}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="comma, separated, tags"
                    />
                  </div>
                  <div>
                    <Label htmlFor="imageUrls">Image URLs</Label>
                    <Input
                      id="imageUrls"
                      {...register('imageUrls')}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                    />
                  </div>
                  <div>
                    <Label htmlFor="audioUrls">Audio URLs</Label>
                    <Input
                      id="audioUrls"
                      {...register('audioUrls')}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="https://soundcloud.com/your-mix"
                    />
                  </div>
                  <div>
                    <Label htmlFor="externalLinks">External Links</Label>
                    <Input
                      id="externalLinks"
                      {...register('externalLinks')}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="https://example.com/related-content"
                    />
                  </div>
                  <div>
                    <Label htmlFor="collaborators">Collaborators</Label>
                    <Input
                      id="collaborators"
                      {...register('collaborators')}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="Co-authors, photographers, etc."
                    />
                  </div>
                  <div>
                    <Label htmlFor="submissionNotes">Notes to Editors</Label>
                    <Textarea
                      id="submissionNotes"
                      {...register('submissionNotes')}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="Any additional notes or context for our editors..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Error Display */}
              {createSubmission.error && (
                <Alert className="bg-red-900 border-red-700">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    Failed to submit. Please check your information and try again.
                  </AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => reset()}
                  disabled={createSubmission.isPending}
                >
                  Clear Form
                </Button>
                <Button
                  type="submit"
                  disabled={createSubmission.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createSubmission.isPending ? 'Submitting...' : 'Submit for Review'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}