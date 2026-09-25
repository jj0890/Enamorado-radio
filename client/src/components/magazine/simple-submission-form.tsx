import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Send } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SimpleSubmissionFormProps {
  onClose: () => void;
}

export default function SimpleSubmissionForm({ onClose }: SimpleSubmissionFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    submitterHandle: '',
    submitterEmail: '',
    socialHandle: '',
    category: 'art' as 'art' | 'fashion' | 'photography' | 'mixed',
    contentType: 'text',
    substackUrl: '',
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createSubmissionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/submissions', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Submission Successful!",
        description: "Your work has been submitted and will be reviewed by our editorial team.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/submissions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/community-submissions'] });
      onClose();
      
      // Redirect to home page after successful submission
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submissionData = {
      ...formData,
      files: [],
      collaborationLinks: formData.substackUrl ? [formData.substackUrl] : [],
    };
    
    createSubmissionMutation.mutate(submissionData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background border-border">
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-foreground">Submit Your Work</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="What do you call this?"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value: 'art' | 'fashion' | 'photography' | 'mixed') => 
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="art">Art</SelectItem>
                    <SelectItem value="fashion">Fashion</SelectItem>
                    <SelectItem value="photography">Photography</SelectItem>
                    <SelectItem value="mixed">Mixed Media</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Tell us about your work. What inspired you? What does it mean to you?"
                className="min-h-[120px] resize-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="submitterHandle">Your Name/Handle *</Label>
                <Input
                  id="submitterHandle"
                  value={formData.submitterHandle}
                  onChange={(e) => setFormData({ ...formData, submitterHandle: e.target.value })}
                  placeholder="@yourname or Your Name"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="socialHandle">Social Handle (Optional)</Label>
                <Input
                  id="socialHandle"
                  value={formData.socialHandle}
                  onChange={(e) => setFormData({ ...formData, socialHandle: e.target.value })}
                  placeholder="@yourhandle"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="submitterEmail">Email (Optional)</Label>
              <Input
                id="submitterEmail"
                type="email"
                value={formData.submitterEmail}
                onChange={(e) => setFormData({ ...formData, submitterEmail: e.target.value })}
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <Label htmlFor="substackUrl">Link to Your Work (Optional)</Label>
              <Input
                id="substackUrl"
                value={formData.substackUrl}
                onChange={(e) => setFormData({ ...formData, substackUrl: e.target.value })}
                placeholder="Instagram post, Substack article, portfolio link..."
              />
            </div>

            <Button 
              type="submit"
              className="w-full bg-[var(--editorial)] hover:bg-[var(--editorial)]/90 text-white font-medium"
              size="lg"
              disabled={createSubmissionMutation.isPending}
            >
              <Send className="w-4 h-4 mr-2" />
              {createSubmissionMutation.isPending ? 'Submitting...' : 'Submit Your Work'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}