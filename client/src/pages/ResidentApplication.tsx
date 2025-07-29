import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Music, Calendar, Clock, Users } from "lucide-react";

const applicationSchema = z.object({
  djName: z.string().min(1, "DJ name is required"),
  realName: z.string().min(1, "Real name is required"),
  email: z.string().email("Valid email is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  location: z.string().min(1, "Location is required"),
  bio: z.string().min(50, "Bio must be at least 50 characters"),
  experience: z.string().min(1, "Experience level is required"),
  preferredGenres: z.string().min(1, "Preferred genres are required"),
  showConcept: z.string().min(100, "Show concept must be at least 100 characters"),
  availableDays: z.string().min(1, "Available days are required"),
  preferredTimeSlot: z.string().min(1, "Preferred time slot is required"),
  showLength: z.string().min(1, "Show length preference is required"),
  techSetup: z.string().min(1, "Technical setup description is required"),
  pastWork: z.string().optional(),
  socialMedia: z.string().optional(),
  additionalInfo: z.string().optional(),
  mixSampleUrl: z.string().url().optional().or(z.literal("")),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

export default function ResidentApplication() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      djName: "",
      realName: "",
      email: "",
      phoneNumber: "",
      location: "",
      bio: "",
      experience: "",
      preferredGenres: "",
      showConcept: "",
      availableDays: "",
      preferredTimeSlot: "",
      showLength: "",
      techSetup: "",
      pastWork: "",
      socialMedia: "",
      additionalInfo: "",
      mixSampleUrl: "",
    },
  });

  const submitApplication = useMutation({
    mutationFn: async (data: ApplicationFormData) => {
      return await apiRequest("/api/resident-applications", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted!",
        description: "Thank you for applying to be a resident DJ. We'll review your application and get back to you soon.",
      });
      form.reset();
      setIsSubmitting(false);
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: ApplicationFormData) => {
    setIsSubmitting(true);
    submitApplication.mutate(data);
  };

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-2xl font-bold tracking-tight font-mono text-red-500">
                ENAMORADO
              </Link>
              <nav className="hidden md:flex items-center space-x-6 text-sm font-mono">
                <Link href="/" className="text-gray-600 hover:text-red-500 transition-colors">
                  LATEST
                </Link>
                <Link href="/guides" className="text-gray-600 hover:text-red-500 transition-colors">
                  EXPLORE
                </Link>
                <Link href="/dj-submit" className="text-gray-600 hover:text-red-500 transition-colors">
                  SUBMIT
                </Link>
                <Link href="/albums" className="text-gray-600 hover:text-red-500 transition-colors">
                  ALBUMS
                </Link>
                <Link href="/mixes" className="text-gray-600 hover:text-red-500 transition-colors">
                  MIXES
                </Link>
                <Link href="/episodes" className="text-gray-600 hover:text-red-500 transition-colors">
                  RADIO
                </Link>
                <Link href="/schedule" className="text-red-500 hover:text-red-600 transition-colors font-medium">
                  SCHEDULE
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-32 px-4 max-w-4xl mx-auto">
        {/* Back to Home */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-red-500 transition-colors font-mono text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-red-500 rounded-full mx-auto mb-6 flex items-center justify-center">
            <Users className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4 font-mono text-red-500">RESIDENT DJ APPLICATION</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 font-mono leading-relaxed">
            Join Season 1 as a resident DJ at Enamorado Radio. We're looking for passionate DJs to host regular shows and become part of our programming lineup.
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-2xl mx-auto">
            <h3 className="font-mono text-lg font-semibold mb-3 text-gray-900">What We're Looking For:</h3>
            <ul className="text-left text-gray-600 font-mono text-sm space-y-2">
              <li>• Passionate DJs with unique musical perspectives</li>
              <li>• Commitment to regular weekly or bi-weekly slots</li>
              <li>• Strong curation skills and deep genre knowledge</li>
              <li>• Ability to engage with our radio community</li>
              <li>• Professional attitude and reliability</li>
            </ul>
          </div>
        </div>

        {/* Application Form */}
        <div className="bg-white border border-gray-200 rounded-lg p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Personal Information */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold font-mono text-gray-900 border-b border-red-500 pb-2">
                  Personal Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="djName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono font-medium">DJ Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Your DJ alias" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="realName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono font-medium">Real Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Your legal name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono font-medium">Email *</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="your@email.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono font-medium">Phone Number *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="(123) 456-7890" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono font-medium">Location *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="City, State/Country" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* DJ Background */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold font-mono text-gray-900 border-b border-red-500 pb-2">
                  DJ Background
                </h2>

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono font-medium">DJ Bio *</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Tell us about yourself as a DJ, your musical journey, and what drives your passion for music..."
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="experience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono font-medium">Experience Level *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select experience level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner (0-2 years)</SelectItem>
                            <SelectItem value="intermediate">Intermediate (2-5 years)</SelectItem>
                            <SelectItem value="experienced">Experienced (5-10 years)</SelectItem>
                            <SelectItem value="veteran">Veteran (10+ years)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="preferredGenres"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono font-medium">Preferred Genres *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="House, Techno, Jazz, etc." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Show Concept */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold font-mono text-gray-900 border-b border-red-500 pb-2">
                  Show Concept
                </h2>

                <FormField
                  control={form.control}
                  name="showConcept"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono font-medium">Show Concept & Vision *</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Describe your show concept, format, and what makes it unique. What kind of experience do you want to create for listeners?"
                          rows={5}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="availableDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono font-medium">Available Days *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Mon, Wed, Fri" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="preferredTimeSlot"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono font-medium">Preferred Time *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select time slot" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="morning">Morning (6AM-12PM)</SelectItem>
                            <SelectItem value="afternoon">Afternoon (12PM-6PM)</SelectItem>
                            <SelectItem value="evening">Evening (6PM-12AM)</SelectItem>
                            <SelectItem value="latenight">Late Night (12AM-6AM)</SelectItem>
                            <SelectItem value="flexible">Flexible</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="showLength"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono font-medium">Show Length *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select duration" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1hour">1 Hour</SelectItem>
                            <SelectItem value="2hours">2 Hours</SelectItem>
                            <SelectItem value="3hours">3 Hours</SelectItem>
                            <SelectItem value="flexible">Flexible</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Technical & Experience */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold font-mono text-gray-900 border-b border-red-500 pb-2">
                  Technical Setup & Experience
                </h2>

                <FormField
                  control={form.control}
                  name="techSetup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono font-medium">Technical Setup *</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Describe your DJ setup, software, hardware, and broadcast capabilities..."
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pastWork"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono font-medium">Past Work & Experience</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Previous radio shows, events, releases, or other relevant experience..."
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="socialMedia"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono font-medium">Social Media / Website</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Instagram, SoundCloud, website, etc." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mixSampleUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono font-medium">Sample Mix URL</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Link to a representative mix" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="additionalInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono font-medium">Additional Information</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Anything else you'd like us to know about your application..."
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Submit Button */}
              <div className="pt-6 border-t border-gray-200">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full md:w-auto px-8 py-3 bg-red-500 hover:bg-red-600 text-white font-mono font-medium"
                >
                  {isSubmitting ? "SUBMITTING..." : "SUBMIT APPLICATION"}
                </Button>
                
                <p className="mt-4 text-sm text-gray-600 font-mono">
                  By submitting this application, you confirm that all information provided is accurate and you're committed to being a reliable resident DJ for Enamorado Radio.
                </p>
              </div>
            </form>
          </Form>
        </div>
      </main>
    </div>
  );
}