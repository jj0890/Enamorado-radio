import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Clock, Users, BarChart3, Plus, Edit, Trash2, Eye, Upload, FileText, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Show {
  id: string;
  title: string;
  host: string;
  startTime: string;
  duration: number;
  category: string;
  description: string;
  tags: string[];
  artwork?: string;
  recurring: string;
  isLive: boolean;
}

interface DJSubmission {
  id: number;
  djName: string;
  realName: string;
  email: string;
  location: string;
  showTitle: string;
  showDescription: string;
  primaryGenre: string;
  showLength: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedBy?: string;
  notes?: string;
}

interface ZineSubmission {
  id: number;
  authorName: string;
  authorEmail: string;
  title: string;
  subtitle?: string;
  contentType: string;
  category: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedBy?: string;
  notes?: string;
}

export default function ScheduleAdmin() {
  const [activeSection, setActiveSection] = useState<'add-show' | 'manage-shows' | 'dj-submissions' | 'zine-submissions' | 'analytics'>('dj-submissions');
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState({
    title: '',
    host: '',
    startTime: '',
    duration: 60,
    category: 'live',
    description: '',
    tags: '',
    recurring: 'none'
  });

  const [shows] = useState<Show[]>([
    {
      id: '1',
      title: 'Deep Routes',
      host: 'Marcus Rivera',
      startTime: '2025-01-15T20:00:00',
      duration: 120,
      category: 'live',
      description: 'Deep house specialist with 15+ years digging through Detroit\'s underground',
      tags: ['house', 'deep', 'underground'],
      recurring: 'weekly',
      isLive: true
    },
    {
      id: '2',
      title: 'Experimental Sounds',
      host: 'Alex Stone',
      startTime: '2025-01-16T18:00:00',
      duration: 90,
      category: 'experimental',
      description: 'Pushing boundaries with avant-garde and experimental music',
      tags: ['experimental', 'avant-garde', 'ambient'],
      recurring: 'monthly',
      isLive: false
    }
  ]);

  // Fetch DJ submissions
  const { data: djSubmissions = [], isLoading: djSubmissionsLoading } = useQuery({
    queryKey: ['/api/dj-submissions'],
    queryFn: () => apiRequest('/api/dj-submissions'),
  });

  // Fetch Zine submissions
  const { data: zineSubmissions = [], isLoading: zineSubmissionsLoading } = useQuery({
    queryKey: ['/api/zine-submissions'],
    queryFn: () => apiRequest('/api/zine-submissions'),
  });

  // Update DJ submission status
  const updateDjSubmissionStatus = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: string; notes?: string }) => {
      return await apiRequest(`/api/dj-submissions/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes, reviewedBy: 'Admin' }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dj-submissions'] });
    },
  });

  // Update Zine submission status
  const updateZineSubmissionStatus = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: string; notes?: string }) => {
      return await apiRequest(`/api/zine-submissions/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes, reviewedBy: 'Admin' }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/zine-submissions'] });
    },
  });

  const analytics = {
    totalShows: shows.length,
    liveShows: shows.filter(s => s.isLive).length,
    pendingDjSubmissions: djSubmissions.filter((s: DJSubmission) => s.status === 'pending').length,
    pendingZineSubmissions: zineSubmissions.filter((s: ZineSubmission) => s.status === 'pending').length,
    totalHours: shows.reduce((acc, show) => acc + show.duration, 0) / 60
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Adding new show:', showForm);
    // Reset form
    setShowForm({
      title: '',
      host: '',
      startTime: '',
      duration: 60,
      category: 'live',
      description: '',
      tags: '',
      recurring: 'none'
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setShowForm(prev => ({
      ...prev,
      [name]: name === 'duration' ? parseInt(value) : value
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'approved': return 'bg-green-500/20 text-green-400';
      case 'rejected': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-orange-500 hover:text-orange-400 mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-2">Schedule Admin Panel</h1>
          <p className="text-gray-300">Manage shows, DJ submissions, and schedule content</p>
        </div>

        {/* Navigation */}
        <div className="flex justify-center space-x-4 mb-8 flex-wrap">
          <button
            onClick={() => setActiveSection('add-show')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeSection === 'add-show'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-blue-500/20 hover:text-blue-400'
            }`}
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Add Show
          </button>
          <button
            onClick={() => setActiveSection('manage-shows')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeSection === 'manage-shows'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-blue-500/20 hover:text-blue-400'
            }`}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            Manage Shows
          </button>
          <button
            onClick={() => setActiveSection('dj-submissions')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeSection === 'dj-submissions'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-blue-500/20 hover:text-blue-400'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            DJ Submissions
          </button>
          <button
            onClick={() => setActiveSection('zine-submissions')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeSection === 'zine-submissions'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-blue-500/20 hover:text-blue-400'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Zine Submissions
          </button>
          <button
            onClick={() => setActiveSection('analytics')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeSection === 'analytics'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-blue-500/20 hover:text-blue-400'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Analytics
          </button>
          <Link href="/admin/editorial-workflow">
            <button className="px-6 py-3 rounded-lg font-medium bg-purple-600 text-white hover:bg-purple-700 transition-all">
              <FileText className="w-4 h-4 inline mr-2" />
              Editorial Workflow
            </button>
          </Link>
        </div>

        {/* Add Show Section */}
        {activeSection === 'add-show' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Add New Show</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Show Title</label>
                  <input
                    type="text"
                    name="title"
                    value={showForm.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Host Name</label>
                  <input
                    type="text"
                    name="host"
                    value={showForm.host}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    name="startTime"
                    value={showForm.startTime}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
                  <input
                    type="number"
                    name="duration"
                    value={showForm.duration}
                    onChange={handleInputChange}
                    min="15"
                    max="240"
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Recurring</label>
                  <select
                    name="recurring"
                    value={showForm.recurring}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="none">One-time only</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    name="category"
                    value={showForm.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="live">Live Show</option>
                    <option value="residency">Residency</option>
                    <option value="guest">Guest Mix</option>
                    <option value="experimental">Experimental</option>
                    <option value="interview">Interview</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  name="description"
                  value={showForm.description}
                  onChange={handleInputChange}
                  placeholder="Describe the show, its vibe, and what listeners can expect..."
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
                <input
                  type="text"
                  name="tags"
                  value={showForm.tags}
                  onChange={handleInputChange}
                  placeholder="electronic, ambient, experimental"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Artwork Upload</label>
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>Click to upload artwork</p>
                  <p className="text-sm text-gray-400 mt-1">JPG, PNG • Max 5MB • 1:1 ratio recommended</p>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-md font-semibold transition-all duration-300 transform hover:scale-105"
              >
                Add Show
              </button>
            </form>
          </div>
        )}

        {/* Manage Shows Section */}
        {activeSection === 'manage-shows' && (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold">Manage Shows</h2>
            </div>
            <div className="space-y-4 p-6">
              {shows.map((show) => (
                <div key={show.id} className="bg-gray-900 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-20 bg-gray-700 rounded-lg flex items-center justify-center">
                        <Calendar className="w-8 h-8 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{show.title}</h3>
                        <p className="text-gray-400">{show.host} • {formatDate(show.startTime)}</p>
                        <p className="text-gray-400">{show.duration} min • {show.category}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          {show.tags.map((tag, index) => (
                            <span key={index} className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                          {show.isLive && (
                            <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs">LIVE</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DJ Submissions Section */}
        {activeSection === 'dj-submissions' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-6">DJ Submissions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {djSubmissionsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                  </div>
                ) : djSubmissions.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No DJ submissions yet</p>
                  </div>
                ) : (
                  djSubmissions.map((submission: DJSubmission) => (
                    <div key={submission.id} className="bg-gray-900 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(submission.status)}`}>
                          {submission.status.toUpperCase()}
                        </span>
                        <span className="text-gray-400 text-sm">{formatDate(submission.submittedAt)}</span>
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{submission.showTitle}</h3>
                      <p className="text-gray-400 mb-1">DJ: {submission.djName} ({submission.realName})</p>
                      <p className="text-gray-400 mb-1">Genre: {submission.primaryGenre}</p>
                      <p className="text-gray-400 mb-1">Location: {submission.location}</p>
                      <p className="text-gray-400 mb-1">Show Length: {submission.showLength} minutes</p>
                      <p className="text-gray-400 mb-4">{submission.email}</p>
                      
                      {submission.showDescription && (
                        <p className="text-gray-300 mb-4 text-sm italic">"{submission.showDescription}"</p>
                      )}
                      
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => updateDjSubmissionStatus.mutate({ id: submission.id, status: 'approved' })}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors flex items-center"
                          disabled={updateDjSubmissionStatus.isPending}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </button>
                        <button 
                          onClick={() => updateDjSubmissionStatus.mutate({ id: submission.id, status: 'rejected' })}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors flex items-center"
                          disabled={updateDjSubmissionStatus.isPending}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </button>
                        <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors">
                          <Eye className="w-4 h-4 inline mr-1" />
                          View Details
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Zine Submissions Section */}
        {activeSection === 'zine-submissions' && (
          <div className="space-y-6">
            {/* Google Docs & Adobe InDesign Integration */}
            <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-lg p-6 border border-purple-500/30">
              <h2 className="text-2xl font-bold mb-4 flex items-center">
                <FileText className="w-6 h-6 mr-2 text-purple-400" />
                Publishing Tools Integration
              </h2>
              <p className="text-gray-300 mb-4">
                Connect with essential writing and publishing apps to streamline your editorial workflow.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-blue-500 rounded mr-3 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-semibold">Google Docs</h3>
                  </div>
                  <p className="text-sm text-gray-300 mb-3">
                    Import drafts directly from Google Docs with collaborative editing features.
                  </p>
                  <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm transition-colors">
                    Connect Google Docs
                  </button>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-pink-500 rounded mr-3 flex items-center justify-center">
                      <Upload className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-semibold">Adobe InDesign</h3>
                  </div>
                  <p className="text-sm text-gray-300 mb-3">
                    Export layouts and designs directly to magazine production workflow.
                  </p>
                  <button className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded text-sm transition-colors">
                    Connect InDesign
                  </button>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-6">Zine Submissions</h2>
              <div className="space-y-4">
                {zineSubmissionsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                  </div>
                ) : zineSubmissions.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No zine submissions yet</p>
                  </div>
                ) : (
                  zineSubmissions.map((submission: ZineSubmission) => (
                    <div key={submission.id} className="bg-gray-900 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(submission.status)}`}>
                          {submission.status.toUpperCase()}
                        </span>
                        <span className="text-gray-400 text-sm">{formatDate(submission.submittedAt)}</span>
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{submission.title}</h3>
                      {submission.subtitle && (
                        <p className="text-gray-400 mb-2 italic">{submission.subtitle}</p>
                      )}
                      <p className="text-gray-400 mb-1">Author: {submission.authorName}</p>
                      <p className="text-gray-400 mb-1">Type: {submission.contentType} • Category: {submission.category}</p>
                      <p className="text-gray-400 mb-2">Email: {submission.authorEmail}</p>
                      
                      {submission.content && (
                        <p className="text-gray-300 mb-4 text-sm">
                          "{submission.content.substring(0, 150)}..."
                        </p>
                      )}
                      
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => updateZineSubmissionStatus.mutate({ id: submission.id, status: 'approved' })}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors flex items-center"
                          disabled={updateZineSubmissionStatus.isPending}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </button>
                        <button 
                          onClick={() => updateZineSubmissionStatus.mutate({ id: submission.id, status: 'rejected' })}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors flex items-center"
                          disabled={updateZineSubmissionStatus.isPending}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </button>
                        <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors">
                          <Eye className="w-4 h-4 inline mr-1" />
                          Review
                        </button>
                        <button className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm transition-colors">
                          Publish to Issuu
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Submission Stats */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-900 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-500 mb-1">
                    {zineSubmissions.filter((s: ZineSubmission) => s.status === 'pending').length}
                  </div>
                  <div className="text-gray-400 text-sm">Pending Review</div>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-500 mb-1">
                    {zineSubmissions.filter((s: ZineSubmission) => s.status === 'approved').length}
                  </div>
                  <div className="text-gray-400 text-sm">Approved</div>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-500 mb-1">
                    {zineSubmissions.filter((s: ZineSubmission) => s.status === 'published').length}
                  </div>
                  <div className="text-gray-400 text-sm">Published</div>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-500 mb-1">
                    {zineSubmissions.length}
                  </div>
                  <div className="text-gray-400 text-sm">Total Submissions</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Section */}
        {activeSection === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gray-800 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-blue-500 mb-2">{analytics.totalShows}</div>
                <div className="text-gray-400">Total Shows</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-green-500 mb-2">{analytics.liveShows}</div>
                <div className="text-gray-400">Live Shows</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-yellow-500 mb-2">{analytics.pendingDjSubmissions + analytics.pendingZineSubmissions}</div>
                <div className="text-gray-400">Total Pending</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-purple-500 mb-2">{analytics.totalHours.toFixed(1)}</div>
                <div className="text-gray-400">Total Hours</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}