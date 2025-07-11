import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  Edit, 
  Globe, 
  Printer,
  Smartphone,
  QrCode,
  ArrowLeft,
  Calendar,
  User,
  Tag,
  Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";

interface WorkflowSubmission {
  id: number;
  title: string;
  authorName: string;
  authorEmail: string;
  contentType: string;
  category: string;
  content: string;
  excerpt: string;
  tags: string;
  submittedAt: string;
  workflowStage: string;
  assignedEditor: string;
  copyEditorNotes: string;
  webEditorNotes: string;
  publisherNotes: string;
  priority: string;
  estimatedPublishDate: string;
  issuuDraftId: string;
  issuuPublicationId: string;
}

export default function EditorialWorkflow() {
  const [activeStage, setActiveStage] = useState<string>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<WorkflowSubmission | null>(null);
  const [editorNotes, setEditorNotes] = useState('');
  const queryClient = useQueryClient();

  const { data: submissions = [], isLoading } = useQuery<WorkflowSubmission[]>({
    queryKey: ['/api/editorial-workflow'],
  });

  const updateWorkflowMutation = useMutation({
    mutationFn: async ({ id, stage, notes }: { id: number; stage: string; notes: string }) => {
      return await apiRequest(`/api/editorial-workflow/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ workflowStage: stage, editorNotes: notes }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/editorial-workflow'] });
      setSelectedSubmission(null);
      setEditorNotes('');
    },
  });

  const createIssuuDraftMutation = useMutation({
    mutationFn: async (submissionId: number) => {
      return await apiRequest(`/api/editorial-workflow/${submissionId}/issuu-draft`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/editorial-workflow'] });
    },
  });

  const publishToIssuuMutation = useMutation({
    mutationFn: async (submissionId: number) => {
      return await apiRequest(`/api/editorial-workflow/${submissionId}/issuu-publish`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/editorial-workflow'] });
    },
  });

  const generatePhysicalMediaMutation = useMutation({
    mutationFn: async ({ submissionId, mediaType }: { submissionId: number; mediaType: string }) => {
      return await apiRequest(`/api/physical-media`, {
        method: 'POST',
        body: JSON.stringify({ submissionId, mediaType }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/physical-media'] });
    },
  });

  const filteredSubmissions = submissions.filter(sub => 
    activeStage === 'all' || sub.workflowStage === activeStage
  );

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'submitted': return 'bg-blue-500/20 text-blue-400';
      case 'copy_ready': return 'bg-yellow-500/20 text-yellow-400';
      case 'web_ready': return 'bg-green-500/20 text-green-400';
      case 'published': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'submitted': return <FileText className="w-4 h-4" />;
      case 'copy_ready': return <Edit className="w-4 h-4" />;
      case 'web_ready': return <Globe className="w-4 h-4" />;
      case 'published': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/20 text-red-400';
      case 'high': return 'bg-orange-500/20 text-orange-400';
      case 'normal': return 'bg-blue-500/20 text-blue-400';
      case 'low': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-8 h-8 mx-auto mb-4 animate-spin" />
          <p>Loading editorial workflow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin" className="inline-flex items-center text-gray-400 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </Link>
          <h1 className="text-4xl font-bold mb-4">Editorial Workflow</h1>
          <p className="text-xl text-gray-300">
            Manage submissions through the editorial process to Issuu publication
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-500 mb-2">
                {submissions.filter(s => s.workflowStage === 'submitted').length}
              </div>
              <div className="text-gray-400">Submitted</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-yellow-500 mb-2">
                {submissions.filter(s => s.workflowStage === 'copy_ready').length}
              </div>
              <div className="text-gray-400">Copy Ready</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-500 mb-2">
                {submissions.filter(s => s.workflowStage === 'web_ready').length}
              </div>
              <div className="text-gray-400">Web Ready</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-500 mb-2">
                {submissions.filter(s => s.workflowStage === 'published').length}
              </div>
              <div className="text-gray-400">Published</div>
            </CardContent>
          </Card>
        </div>

        {/* Stage Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['all', 'submitted', 'copy_ready', 'web_ready', 'published'].map(stage => (
            <Button
              key={stage}
              variant={activeStage === stage ? "default" : "outline"}
              onClick={() => setActiveStage(stage)}
              className="capitalize"
            >
              {stage === 'all' ? 'All Stages' : stage.replace('_', ' ')}
            </Button>
          ))}
        </div>

        {/* Submissions List */}
        <div className="space-y-4">
          {filteredSubmissions.map((submission) => (
            <Card key={submission.id} className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${getStageColor(submission.workflowStage)}`}>
                      {getStageIcon(submission.workflowStage)}
                    </div>
                    <div>
                      <CardTitle className="text-xl">{submission.title}</CardTitle>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          {submission.authorName}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(submission.submittedAt)}
                        </span>
                        <span className="flex items-center">
                          <Tag className="w-4 h-4 mr-1" />
                          {submission.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getPriorityColor(submission.priority)}>
                      {submission.priority}
                    </Badge>
                    <Badge className={getStageColor(submission.workflowStage)}>
                      {submission.workflowStage.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 mb-4">{submission.excerpt}</p>
                
                <div className="flex flex-wrap gap-2">
                  {/* Stage Progression Buttons */}
                  {submission.workflowStage === 'submitted' && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedSubmission(submission);
                        setEditorNotes('');
                      }}
                      className="bg-yellow-500 hover:bg-yellow-600"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Mark Copy Ready
                    </Button>
                  )}
                  
                  {submission.workflowStage === 'copy_ready' && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedSubmission(submission);
                        setEditorNotes('');
                      }}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <Globe className="w-4 h-4 mr-1" />
                      Mark Web Ready
                    </Button>
                  )}
                  
                  {submission.workflowStage === 'web_ready' && (
                    <Button
                      size="sm"
                      onClick={() => createIssuuDraftMutation.mutate(submission.id)}
                      disabled={createIssuuDraftMutation.isPending}
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      Create Issuu Draft
                    </Button>
                  )}
                  
                  {submission.issuuDraftId && !submission.issuuPublicationId && (
                    <Button
                      size="sm"
                      onClick={() => publishToIssuuMutation.mutate(submission.id)}
                      disabled={publishToIssuuMutation.isPending}
                      className="bg-purple-500 hover:bg-purple-600"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Publish to Issuu
                    </Button>
                  )}
                  
                  {/* Physical Media Generation */}
                  {submission.workflowStage === 'published' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => generatePhysicalMediaMutation.mutate({
                          submissionId: submission.id,
                          mediaType: 'nfc_card'
                        })}
                        disabled={generatePhysicalMediaMutation.isPending}
                      >
                        <Smartphone className="w-4 h-4 mr-1" />
                        Generate NFC Card
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => generatePhysicalMediaMutation.mutate({
                          submissionId: submission.id,
                          mediaType: 'qr_sticker'
                        })}
                        disabled={generatePhysicalMediaMutation.isPending}
                      >
                        <QrCode className="w-4 h-4 mr-1" />
                        Generate QR Sticker
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => generatePhysicalMediaMutation.mutate({
                          submissionId: submission.id,
                          mediaType: 'mini_cd'
                        })}
                        disabled={generatePhysicalMediaMutation.isPending}
                      >
                        <Printer className="w-4 h-4 mr-1" />
                        Generate Mini CD
                      </Button>
                    </>
                  )}
                  
                  <Button size="sm" variant="outline">
                    <Eye className="w-4 h-4 mr-1" />
                    Preview
                  </Button>
                </div>
                
                {/* Issuu Links */}
                {submission.issuuPublicationId && (
                  <div className="mt-4 p-3 bg-purple-500/20 rounded-lg">
                    <p className="text-purple-400 font-medium">
                      Published to Issuu: 
                      <a 
                        href={`https://issuu.com/publication/${submission.issuuPublicationId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 underline hover:text-purple-300"
                      >
                        View Publication
                      </a>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Editor Notes Modal */}
        {selectedSubmission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="bg-gray-800 border-gray-700 max-w-lg w-full">
              <CardHeader>
                <CardTitle>Update Editorial Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400 mb-2">Submission:</p>
                  <p className="font-medium">{selectedSubmission.title}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Editor Notes:</label>
                  <Textarea
                    value={editorNotes}
                    onChange={(e) => setEditorNotes(e.target.value)}
                    placeholder="Add notes about the editorial review..."
                    rows={4}
                    className="bg-gray-900 border-gray-600 text-white"
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedSubmission(null);
                      setEditorNotes('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      const nextStage = selectedSubmission.workflowStage === 'submitted' 
                        ? 'copy_ready' 
                        : selectedSubmission.workflowStage === 'copy_ready' 
                        ? 'web_ready' 
                        : 'published';
                      
                      updateWorkflowMutation.mutate({
                        id: selectedSubmission.id,
                        stage: nextStage,
                        notes: editorNotes
                      });
                    }}
                    disabled={updateWorkflowMutation.isPending}
                  >
                    Update Status
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {filteredSubmissions.length === 0 && (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">No submissions found</h3>
              <p className="text-gray-400">
                {activeStage === 'all' 
                  ? 'There are no submissions in the editorial workflow yet.' 
                  : `No submissions in the ${activeStage.replace('_', ' ')} stage.`}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}