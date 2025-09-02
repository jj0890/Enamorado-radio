import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { X, Upload, Link as LinkIcon, Music } from 'lucide-react';
import { ObjectUploader } from '@/components/ObjectUploader';
import type { UploadResult } from '@uppy/core';

const mixSubmissionSchema = z.object({
  djName: z.string().min(1, 'DJ name is required'),
  realName: z.string().min(1, 'Real name is required'),
  email: z.string().email('Valid email is required'),
  location: z.string().min(1, 'Location is required'),
  demoMixTitle: z.string().min(1, 'Mix title is required'),
  demoMixDescription: z.string().min(10, 'Description must be at least 10 characters'),
  primaryGenre: z.string().min(1, 'Primary genre is required'),
  showLength: z.number().min(1).max(240, 'Show length must be between 1-240 minutes'),
  
  // Platform URLs (at least one required)
  soundcloudUrl: z.string().url('Invalid SoundCloud URL').optional().or(z.literal('')),
  mixcloudUrl: z.string().url('Invalid Mixcloud URL').optional().or(z.literal('')),
  audiocomUrl: z.string().url('Invalid Audio.com URL').optional().or(z.literal('')),
  otherUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  
  // Optional fields
  additionalGenres: z.string().optional(),
  djExperience: z.string().optional(),
  musicDiscovery: z.string().optional(),
  socialMedia: z.string().optional()
});

type MixSubmissionForm = z.infer<typeof mixSubmissionSchema>;

interface MixSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MixSubmissionModal({ isOpen, onClose }: MixSubmissionModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [fileUrl, setFileUrl] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<MixSubmissionForm>({
    resolver: zodResolver(mixSubmissionSchema),
    defaultValues: {
      showLength: 60
    }
  });

  // Helper functions for upload process
  const handleGetUploadParameters = async () => {
    const response = await fetch('/api/objects/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    return {
      method: 'PUT' as const,
      url: data.uploadURL,
    };
  };

  const handleUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      setFileUrl(uploadedFile.uploadURL || '');
      console.log('File uploaded successfully:', uploadedFile.uploadURL);
      toast({
        title: "File Uploaded",
        description: "Your mix file has been uploaded successfully.",
      });
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: MixSubmissionForm) => {
      const response = await fetch('/api/dj-submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit mix');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Mix Submitted Successfully!",
        description: "Your mix has been submitted for review. We'll notify you when it's approved."
      });
      
      // Invalidate and refetch submissions
      queryClient.invalidateQueries({ queryKey: ['/api/dj-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dj-submissions/featured'] });
      
      reset();
      setCurrentStep(1);
      setFileUrl('');
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit mix. Please try again.",
        variant: "destructive"
      });
    }
  });

  const validateUrl = (url: string, platform: string): boolean => {
    if (!url) return true; // Optional field
    
    switch (platform) {
      case 'soundcloud':
        return url.includes('soundcloud.com');
      case 'mixcloud':
        return url.includes('mixcloud.com');
      case 'audiocom':
        return url.includes('audio.com');
      default:
        return true;
    }
  };

  const onSubmit = (data: MixSubmissionForm) => {
    // Validate that we have either a file upload OR a platform URL
    const hasFileUpload = fileUrl && fileUrl.trim() !== '';
    const hasPlatformUrl = data.soundcloudUrl || data.mixcloudUrl || data.audiocomUrl || data.otherUrl;
    
    if (!hasFileUpload && !hasPlatformUrl) {
      toast({
        title: "Missing Mix Source",
        description: "Please either upload a file or provide at least one platform URL.",
        variant: "destructive"
      });
      return;
    }

    // Include file URL in submission if available
    const submissionData = {
      ...data,
      fileUrl: hasFileUpload ? fileUrl : undefined
    };
    
    mutation.mutate(submissionData);
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-mono text-red-500 flex items-center gap-2">
            <Music className="w-6 h-6" />
            SUBMIT MIX TO ENAMORADO RADIO
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-mono font-bold text-red-500">Step 1: Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="djName" className="font-mono">DJ Name *</Label>
                  <Input 
                    id="djName" 
                    {...register('djName')}
                    placeholder="Your DJ name"
                    className="font-mono"
                  />
                  {errors.djName && (
                    <p className="text-red-500 text-xs mt-1 font-mono">{errors.djName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="realName" className="font-mono">Real Name *</Label>
                  <Input 
                    id="realName" 
                    {...register('realName')}
                    placeholder="Your real name"
                    className="font-mono"
                  />
                  {errors.realName && (
                    <p className="text-red-500 text-xs mt-1 font-mono">{errors.realName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email" className="font-mono">Email *</Label>
                  <Input 
                    id="email" 
                    type="email"
                    {...register('email')}
                    placeholder="your@email.com"
                    className="font-mono"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1 font-mono">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="location" className="font-mono">Location *</Label>
                  <Input 
                    id="location" 
                    {...register('location')}
                    placeholder="City, Country"
                    className="font-mono"
                  />
                  {errors.location && (
                    <p className="text-red-500 text-xs mt-1 font-mono">{errors.location.message}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="button" onClick={nextStep} className="bg-red-500 hover:bg-red-600 font-mono">
                  Next Step →
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Mix Details */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-mono font-bold text-red-500">Step 2: Mix Details</h3>
              
              <div>
                <Label htmlFor="demoMixTitle" className="font-mono">Mix Title *</Label>
                <Input 
                  id="demoMixTitle" 
                  {...register('demoMixTitle')}
                  placeholder="The name of your mix"
                  className="font-mono"
                />
                {errors.demoMixTitle && (
                  <p className="text-red-500 text-xs mt-1 font-mono">{errors.demoMixTitle.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="demoMixDescription" className="font-mono">Mix Description *</Label>
                <Textarea 
                  id="demoMixDescription" 
                  {...register('demoMixDescription')}
                  placeholder="Describe your mix, the vibe, genres, or story behind it..."
                  className="font-mono min-h-[100px]"
                />
                {errors.demoMixDescription && (
                  <p className="text-red-500 text-xs mt-1 font-mono">{errors.demoMixDescription.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primaryGenre" className="font-mono">Primary Genre *</Label>
                  <Select onValueChange={(value) => setValue('primaryGenre', value)}>
                    <SelectTrigger className="font-mono">
                      <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Electronic">Electronic</SelectItem>
                      <SelectItem value="House">House</SelectItem>
                      <SelectItem value="Techno">Techno</SelectItem>
                      <SelectItem value="Footwork">Footwork</SelectItem>
                      <SelectItem value="Juke">Juke</SelectItem>
                      <SelectItem value="Ambient">Ambient</SelectItem>
                      <SelectItem value="Experimental">Experimental</SelectItem>
                      <SelectItem value="Hip-Hop">Hip-Hop</SelectItem>
                      <SelectItem value="Jazz">Jazz</SelectItem>
                      <SelectItem value="World">World</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.primaryGenre && (
                    <p className="text-red-500 text-xs mt-1 font-mono">{errors.primaryGenre.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="showLength" className="font-mono">Mix Length (minutes) *</Label>
                  <Input 
                    id="showLength" 
                    type="number"
                    min="1"
                    max="240"
                    {...register('showLength', { valueAsNumber: true })}
                    className="font-mono"
                  />
                  {errors.showLength && (
                    <p className="text-red-500 text-xs mt-1 font-mono">{errors.showLength.message}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-between">
                <Button type="button" onClick={prevStep} variant="outline" className="font-mono">
                  ← Previous
                </Button>
                <Button type="button" onClick={nextStep} className="bg-red-500 hover:bg-red-600 font-mono">
                  Next Step →
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Mix Upload & Links */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-mono font-bold text-red-500">Step 3: Upload Mix or Provide Links</h3>
              <p className="text-sm text-gray-600 font-mono">Upload your mix file directly or provide streaming platform links</p>
              
              {/* File Upload Section */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-6">
                <h4 className="font-mono font-bold text-gray-700 mb-2">Option 1: Upload MP3 File</h4>
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={50 * 1024 * 1024} // 50MB
                  allowedFileTypes={['.mp3', '.wav', '.m4a']}
                  onGetUploadParameters={handleGetUploadParameters}
                  onComplete={handleUploadComplete}
                  buttonClassName="w-full bg-red-500 hover:bg-red-600 text-white font-mono py-3 px-4 rounded-lg"
                >
                  {fileUrl ? '✓ File Uploaded - Upload Another' : '📁 Upload Mix File (MP3, WAV, M4A)'}
                </ObjectUploader>
                {fileUrl && (
                  <p className="text-green-600 font-mono text-sm mt-2">
                    ✓ File uploaded successfully
                  </p>
                )}
              </div>

              <div className="text-center font-mono text-gray-500 text-sm">
                --- OR ---
              </div>

              <div className="mt-4">
                <h4 className="font-mono font-bold text-gray-700 mb-4">Option 2: Streaming Platform Links</h4></div>
              
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="soundcloudUrl" className="font-mono flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" />
                    SoundCloud URL
                  </Label>
                  <Input 
                    id="soundcloudUrl" 
                    {...register('soundcloudUrl')}
                    placeholder="https://soundcloud.com/artist/track"
                    className="font-mono"
                  />
                  {errors.soundcloudUrl && (
                    <p className="text-red-500 text-xs mt-1 font-mono">{errors.soundcloudUrl.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="mixcloudUrl" className="font-mono flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" />
                    Mixcloud URL
                  </Label>
                  <Input 
                    id="mixcloudUrl" 
                    {...register('mixcloudUrl')}
                    placeholder="https://mixcloud.com/artist/mix"
                    className="font-mono"
                  />
                  {errors.mixcloudUrl && (
                    <p className="text-red-500 text-xs mt-1 font-mono">{errors.mixcloudUrl.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="audiocomUrl" className="font-mono flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" />
                    Audio.com URL
                  </Label>
                  <Input 
                    id="audiocomUrl" 
                    {...register('audiocomUrl')}
                    placeholder="https://audio.com/artist/track"
                    className="font-mono"
                  />
                </div>

                <div>
                  <Label htmlFor="otherUrl" className="font-mono flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" />
                    Other Platform URL
                  </Label>
                  <Input 
                    id="otherUrl" 
                    {...register('otherUrl')}
                    placeholder="https://other-platform.com/your-mix"
                    className="font-mono"
                  />
                </div>

                <div>
                  <Label htmlFor="socialMedia" className="font-mono">Social Media (optional)</Label>
                  <Input 
                    id="socialMedia" 
                    {...register('socialMedia')}
                    placeholder="Your Instagram, Twitter, etc."
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-between">
                <Button type="button" onClick={prevStep} variant="outline" className="font-mono">
                  ← Previous
                </Button>
                <Button 
                  type="submit" 
                  disabled={mutation.isPending}
                  className="bg-red-500 hover:bg-red-600 font-mono"
                >
                  {mutation.isPending ? 'Submitting...' : 'Submit Mix'}
                </Button>
              </div>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}