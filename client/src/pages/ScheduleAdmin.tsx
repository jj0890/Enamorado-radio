import { useState } from "react";
import { Link } from "wouter";
import { Calendar, Clock, Users, BarChart3, Plus, Edit, Trash2, Eye, Upload, FileText } from "lucide-react";

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
  id: string;
  djName: string;
  realName: string;
  email: string;
  showTitle: string;
  genre: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

export default function ScheduleAdmin() {
  const [activeSection, setActiveSection] = useState<'add-show' | 'manage-shows' | 'dj-submissions' | 'zine-submissions' | 'analytics'>('add-show');
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

  const [submissions] = useState<DJSubmission[]>([
    {
      id: '1',
      djName: 'Luna Park',
      realName: 'Luna Martinez',
      email: 'luna@example.com',
      showTitle: 'Midnight Sessions',
      genre: 'ambient',
      status: 'pending',
      submittedAt: '2025-01-10T14:30:00'
    },
    {
      id: '2',
      djName: 'Vinyl Junkie',
      realName: 'David Chen',
      email: 'david@example.com',
      showTitle: 'Rare Grooves',
      genre: 'soul',
      status: 'approved',
      submittedAt: '2025-01-08T09:15:00'
    }
  ]);

  const analytics = {
    totalShows: shows.length,
    liveShows: shows.filter(s => s.isLive).length,
    pendingSubmissions: submissions.filter(s => s.status === 'pending').length,
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
                {submissions.map((submission) => (
                  <div key={submission.id} className="bg-gray-900 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(submission.status)}`}>
                        {submission.status.toUpperCase()}
                      </span>
                      <span className="text-gray-400 text-sm">{formatDate(submission.submittedAt)}</span>
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{submission.showTitle}</h3>
                    <p className="text-gray-400 mb-1">DJ: {submission.djName} ({submission.realName})</p>
                    <p className="text-gray-400 mb-1">Genre: {submission.genre}</p>
                    <p className="text-gray-400 mb-4">{submission.email}</p>
                    <div className="flex space-x-2">
                      <button className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors">
                        Approve
                      </button>
                      <button className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors">
                        Reject
                      </button>
                      <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors">
                        <Eye className="w-4 h-4 inline mr-1" />
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Zine Submissions Section */}
        {activeSection === 'zine-submissions' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-6">Zine Submissions</h2>
              <div className="space-y-4">
                {/* Sample zine submissions - in production, fetch from API */}
                <div className="bg-gray-900 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-500/20 text-yellow-400">
                      PENDING
                    </span>
                    <span className="text-gray-400 text-sm">2 days ago</span>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">The Underground Renaissance</h3>
                  <p className="text-gray-400 mb-1">Author: Alex Rivera</p>
                  <p className="text-gray-400 mb-1">Type: Article • Category: Culture</p>
                  <p className="text-gray-400 mb-2">Email: alex@example.com</p>
                  <p className="text-gray-300 mb-4 text-sm">
                    "Exploring the resurgence of underground music scenes and their impact on modern culture..."
                  </p>
                  <div className="flex space-x-2">
                    <button className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors">
                      Approve
                    </button>
                    <button className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors">
                      Reject
                    </button>
                    <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors">
                      <Eye className="w-4 h-4 inline mr-1" />
                      Review
                    </button>
                    <button className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm transition-colors">
                      Publish
                    </button>
                  </div>
                </div>

                <div className="bg-gray-900 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-400">
                      APPROVED
                    </span>
                    <span className="text-gray-400 text-sm">5 days ago</span>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Frequency Diaries</h3>
                  <p className="text-gray-400 mb-1">Author: Luna Park</p>
                  <p className="text-gray-400 mb-1">Type: Mixtape Notes • Category: Music</p>
                  <p className="text-gray-400 mb-2">Email: luna@example.com</p>
                  <p className="text-gray-300 mb-4 text-sm">
                    "Detailed track-by-track notes from my latest ambient mix..."
                  </p>
                  <div className="flex space-x-2">
                    <button className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm transition-colors">
                      Publish
                    </button>
                    <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors">
                      <Eye className="w-4 h-4 inline mr-1" />
                      Review
                    </button>
                    <button className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors">
                      Archive
                    </button>
                  </div>
                </div>

                <div className="bg-gray-900 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-400">
                      PUBLISHED
                    </span>
                    <span className="text-gray-400 text-sm">1 week ago</span>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Digital Vinyl Revolution</h3>
                  <p className="text-gray-400 mb-1">Author: Sarah Chen</p>
                  <p className="text-gray-400 mb-1">Type: Article • Category: Technology</p>
                  <p className="text-gray-400 mb-2">Views: 1,250 • Featured</p>
                  <p className="text-gray-300 mb-4 text-sm">
                    "An in-depth look at how streaming platforms are reshaping music discovery..."
                  </p>
                  <div className="flex space-x-2">
                    <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors">
                      <Eye className="w-4 h-4 inline mr-1" />
                      View Published
                    </button>
                    <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm transition-colors">
                      Edit
                    </button>
                    <button className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm transition-colors">
                      Feature
                    </button>
                  </div>
                </div>
              </div>

              {/* Submission Stats */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-900 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-500 mb-1">5</div>
                  <div className="text-gray-400 text-sm">Pending Review</div>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-500 mb-1">12</div>
                  <div className="text-gray-400 text-sm">Approved</div>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-500 mb-1">8</div>
                  <div className="text-gray-400 text-sm">Published</div>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-500 mb-1">3</div>
                  <div className="text-gray-400 text-sm">Featured</div>
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
                <div className="text-3xl font-bold text-yellow-500 mb-2">{analytics.pendingSubmissions}</div>
                <div className="text-gray-400">Pending Submissions</div>
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