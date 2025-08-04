import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Clock, Users, BarChart3, Plus, Edit, Trash2, Eye, Upload, FileText, CheckCircle, XCircle, AlertCircle, Music } from "lucide-react";
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
  demoMixTitle?: string;
  demoMixDescription?: string;
  soundcloudUrl?: string;
  mixcloudUrl?: string;
  audiocomUrl?: string;
  otherUrl?: string;
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

interface MixSubmission {
  id: number;
  name: string;
  title: string;
  genre: string;
  about: string;
  soundcloudUrl?: string;
  mixcloudUrl?: string;
  audiocomUrl?: string;
  status: 'pending' | 'approved' | 'featured';
  submittedAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

export default function ScheduleAdmin() {
  const [activeSection, setActiveSection] = useState<'add-show' | 'manage-shows' | 'dj-submissions' | 'resident-applications' | 'mix-submissions' | 'analytics'>('mix-submissions');
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

  const [shows] = useState<Show[]>([]);

  // Fetch DJ submissions
  const { data: djSubmissions = [], isLoading: djSubmissionsLoading } = useQuery({
    queryKey: ['/api/dj-submissions'],
    queryFn: () => apiRequest('/api/dj-submissions'),
  });

  // Fetch Mix submissions for management
  const { data: mixSubmissions = [], isLoading: mixSubmissionsLoading } = useQuery({
    queryKey: ['/api/admin/mix-submissions'],
    queryFn: () => apiRequest('/api/admin/mix-submissions'),
  });

  // Fetch Resident applications
  const { data: residentApplications = [], isLoading: residentApplicationsLoading } = useQuery({
    queryKey: ['/api/resident-applications'],
    queryFn: () => apiRequest('/api/resident-applications'),
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

  // Approve mix submission
  const approveMixSubmission = useMutation({
    mutationFn: async ({ submissionId, status }: { submissionId: number; status: 'approved' | 'featured' }) => {
      return await apiRequest('/api/approveMix', {
        method: 'POST',
        body: JSON.stringify({ submissionId, status, approvedBy: 'admin' }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/mix-submissions'] });
    },
  });

  // Delete mix submission
  const deleteMixSubmission = useMutation({
    mutationFn: async (submissionId: number) => {
      return await apiRequest(`/api/admin/mix-submissions/${submissionId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/mix-submissions'] });
    },
  });

  // Update Resident application status
  const updateResidentApplicationStatus = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: string; notes?: string }) => {
      return await apiRequest(`/api/resident-applications/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes, reviewedBy: 'Admin' }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/resident-applications'] });
    },
  });

  const analytics = {
    totalShows: shows.length,
    liveShows: shows.filter(s => s.isLive).length,
    pendingDjSubmissions: djSubmissions.filter((s: DJSubmission) => s.status === 'pending').length,
    pendingResidentApplications: residentApplications.filter((s: any) => s.status === 'pending').length,
    pendingMixSubmissions: mixSubmissions.filter((s: MixSubmission) => s.status === 'pending').length,
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
    <div className="min-h-screen bg-white text-black">
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-red-500 hover:text-red-600 mb-4 inline-block font-mono">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-2 font-mono text-red-500">Radio Admin Panel</h1>
          <p className="text-gray-600 font-mono">Manage radio shows and DJ submissions</p>
        </div>

        {/* Navigation */}
        <div className="flex justify-center space-x-4 mb-8 flex-wrap">
          <button
            onClick={() => setActiveSection('add-show')}
            className={`px-6 py-3 font-mono font-medium transition-all ${
              activeSection === 'add-show'
                ? 'bg-red-500 text-white'
                : 'bg-white text-red-500 border border-red-500 hover:bg-red-50'
            }`}
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Add Show
          </button>
          <button
            onClick={() => setActiveSection('manage-shows')}
            className={`px-6 py-3 font-mono font-medium transition-all ${
              activeSection === 'manage-shows'
                ? 'bg-red-500 text-white'
                : 'bg-white text-red-500 border border-red-500 hover:bg-red-50'
            }`}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            Manage Shows
          </button>
          <button
            onClick={() => setActiveSection('dj-submissions')}
            className={`px-6 py-3 font-mono font-medium transition-all ${
              activeSection === 'dj-submissions'
                ? 'bg-red-500 text-white'
                : 'bg-white text-red-500 border border-red-500 hover:bg-red-50'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            DJ Applications
          </button>
          <button
            onClick={() => setActiveSection('resident-applications')}
            className={`px-6 py-3 font-mono font-medium transition-all ${
              activeSection === 'resident-applications'
                ? 'bg-red-500 text-white'
                : 'bg-white text-red-500 border border-red-500 hover:bg-red-50'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Resident Apps
          </button>
          <button
            onClick={() => setActiveSection('mix-submissions')}
            className={`px-6 py-3 font-mono font-medium transition-all ${
              activeSection === 'mix-submissions'
                ? 'bg-red-500 text-white'
                : 'bg-white text-red-500 border border-red-500 hover:bg-red-50'
            }`}
          >
            <Music className="w-4 h-4 inline mr-2" />
            Mix Submissions
          </button>
          <button
            onClick={() => setActiveSection('analytics')}
            className={`px-6 py-3 font-mono font-medium transition-all ${
              activeSection === 'analytics'
                ? 'bg-red-500 text-white'
                : 'bg-white text-red-500 border border-red-500 hover:bg-red-50'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Analytics
          </button>
        </div>

        {/* Add Show Section */}
        {activeSection === 'add-show' && (
          <div className="bg-red-50 border-2 border-red-500 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-6 font-mono text-red-500">Add New Show</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2 font-mono text-gray-600">Show Title</label>
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
                      
                      {/* Demo Mix Information */}
                      {submission.demoMixTitle && (
                        <div className="bg-gray-800 rounded p-3 mb-4">
                          <h4 className="font-semibold text-purple-400 mb-2">Demo Mix: {submission.demoMixTitle}</h4>
                          {submission.demoMixDescription && (
                            <p className="text-gray-300 text-sm mb-2">"{submission.demoMixDescription}"</p>
                          )}
                          
                          {/* Streaming Platform Links */}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {submission.soundcloudUrl && (
                              <a 
                                href={submission.soundcloudUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded text-xs hover:bg-orange-500/30 transition-colors"
                              >
                                SoundCloud
                              </a>
                            )}
                            {submission.mixcloudUrl && (
                              <a 
                                href={submission.mixcloudUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs hover:bg-blue-500/30 transition-colors"
                              >
                                Mixcloud
                              </a>
                            )}
                            {submission.audiocomUrl && (
                              <a 
                                href={submission.audiocomUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs hover:bg-green-500/30 transition-colors"
                              >
                                Audio.com
                              </a>
                            )}
                            {submission.otherUrl && (
                              <a 
                                href={submission.otherUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-xs hover:bg-purple-500/30 transition-colors"
                              >
                                Other Platform
                              </a>
                            )}
                          </div>
                        </div>
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

        {/* Resident Applications Section */}
        {activeSection === 'resident-applications' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-6 font-mono text-blue-500">Resident Applications</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {residentApplicationsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : residentApplications.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No resident applications yet</p>
                  </div>
                ) : (
                  residentApplications.map((application: any) => (
                    <div key={application.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium font-mono ${
                          application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          application.status === 'approved' ? 'bg-green-100 text-green-800' :
                          application.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {application.status.toUpperCase()}
                        </span>
                        <span className="text-gray-500 text-sm font-mono">{new Date(application.submittedAt).toLocaleDateString()}</span>
                      </div>
                      <h3 className="font-bold text-lg mb-2 text-black font-mono">{application.djName}</h3>
                      <p className="text-gray-600 mb-1 font-mono">Real Name: {application.realName}</p>
                      <p className="text-gray-600 mb-1 font-mono">Email: {application.email}</p>
                      <p className="text-gray-600 mb-1 font-mono">Location: {application.location}</p>
                      <p className="text-gray-600 mb-1 font-mono">Genres: {application.preferredGenres}</p>
                      <p className="text-gray-600 mb-1 font-mono">Show Length: {application.showLength}</p>
                      <p className="text-gray-600 mb-4 text-sm">Show Concept: {application.showConcept.length > 100 ? application.showConcept.substring(0, 100) + '...' : application.showConcept}</p>
                      
                      {/* Mix Sample Link */}
                      {application.mixSampleUrl && (
                        <div className="mb-4">
                          <a 
                            href={application.mixSampleUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs hover:bg-orange-200 transition-colors font-mono"
                          >
                            Mix Sample
                          </a>
                        </div>
                      )}
                      
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => updateResidentApplicationStatus.mutate({ id: application.id, status: 'approved' })}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors flex items-center font-mono"
                          disabled={updateResidentApplicationStatus.isPending}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </button>
                        <button 
                          onClick={() => updateResidentApplicationStatus.mutate({ id: application.id, status: 'rejected' })}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors flex items-center font-mono"
                          disabled={updateResidentApplicationStatus.isPending}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </button>
                        <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors font-mono">
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

        {/* Mix Submissions Section */}
        {activeSection === 'mix-submissions' && (
          <div className="space-y-6">
            <div className="bg-red-50 border-2 border-red-500 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-6 font-mono text-red-500">Mix Submissions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mixSubmissionsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                  </div>
                ) : mixSubmissions.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">
                    <Music className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No mix submissions yet</p>
                  </div>
                ) : (
                  mixSubmissions.map((submission: MixSubmission) => (
                    <div key={submission.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium font-mono ${
                          submission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          submission.status === 'approved' ? 'bg-green-100 text-green-800' :
                          submission.status === 'featured' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {submission.status.toUpperCase()}
                        </span>
                        <span className="text-gray-500 text-sm font-mono">{new Date(submission.submittedAt).toLocaleDateString()}</span>
                      </div>
                      <h3 className="font-bold text-lg mb-2 text-black font-mono">{submission.title}</h3>
                      <p className="text-gray-600 mb-1 font-mono">DJ: {submission.name}</p>
                      <p className="text-gray-600 mb-1 font-mono">Genre: {submission.genre}</p>
                      <p className="text-gray-600 mb-4 text-sm">{submission.about}</p>
                      
                      {/* Platform Links */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {submission.soundcloudUrl && (
                          <a 
                            href={submission.soundcloudUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs hover:bg-orange-200 transition-colors font-mono"
                          >
                            SoundCloud
                          </a>
                        )}
                        {submission.mixcloudUrl && (
                          <a 
                            href={submission.mixcloudUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs hover:bg-blue-200 transition-colors font-mono"
                          >
                            Mixcloud
                          </a>
                        )}
                        {submission.audiocomUrl && (
                          <a 
                            href={submission.audiocomUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs hover:bg-green-200 transition-colors font-mono"
                          >
                            Audio.com
                          </a>
                        )}
                      </div>
                      
                      {submission.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => approveMixSubmission.mutate({ submissionId: submission.id, status: 'approved' })}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors flex items-center font-mono"
                            disabled={approveMixSubmission.isPending}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </button>
                          <button 
                            onClick={() => approveMixSubmission.mutate({ submissionId: submission.id, status: 'featured' })}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors flex items-center font-mono"
                            disabled={approveMixSubmission.isPending}
                          >
                            <AlertCircle className="w-4 h-4 mr-1" />
                            Feature
                          </button>
                          <button 
                            onClick={() => deleteMixSubmission.mutate(submission.id)}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors flex items-center font-mono"
                            disabled={deleteMixSubmission.isPending}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </button>
                        </div>
                      )}
                      
                      {submission.status !== 'pending' && (
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => deleteMixSubmission.mutate(submission.id)}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors flex items-center font-mono"
                            disabled={deleteMixSubmission.isPending}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </button>
                        </div>
                      )}
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
                <div className="text-3xl font-bold text-yellow-500 mb-2">{analytics.pendingDjSubmissions + analytics.pendingResidentApplications + analytics.pendingMixSubmissions}</div>
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