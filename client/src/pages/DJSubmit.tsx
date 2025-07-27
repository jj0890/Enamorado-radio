import { useState } from "react";
import { Link } from "wouter";
import { Upload, X, CheckCircle, AlertCircle, Music, Radio, Headphones, Mic, Sparkles, Plus, Tag } from "lucide-react";

export default function DJSubmit() {
  const [formData, setFormData] = useState({
    djName: "",
    realName: "",
    email: "",
    location: "",
    showTitle: "",
    showDescription: "",
    primaryGenre: "",
    showLength: "60",
    additionalGenres: "",
    djExperience: "",
    musicDiscovery: "",
    socialMedia: "",
    demoMixTitle: "",
    demoMixDescription: "",
    soundcloudUrl: "",
    mixcloudUrl: "",
    audiocomUrl: "",
    otherUrl: "",
    agreeTerms: false,
  });

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [isLive, setIsLive] = useState(false);
  const [artworkPreview, setArtworkPreview] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleFileUpload = (files: FileList) => {
    const newFiles = Array.from(files).filter(file => 
      file.type.startsWith('audio/') || 
      file.type === 'application/pdf' ||
      file.type.startsWith('image/')
    );
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleArtworkUpload = (files: FileList) => {
    const file = files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setArtworkPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !tags.includes(tag.trim())) {
      setTags([...tags, tag.trim()]);
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(currentTag);
    }
  };

  const quickActionButtons = [
    { label: "Live Show", icon: Radio, color: "from-red-500 to-pink-500" },
    { label: "Mix Series", icon: Music, color: "from-blue-500 to-purple-500" },
    { label: "Experimental", icon: Sparkles, color: "from-green-500 to-teal-500" },
    { label: "Interview", icon: Mic, color: "from-orange-500 to-yellow-500" },
  ];

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Submit to actual API
      const response = await fetch('/api/dj-submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit application');
      }

      setIsSubmitting(false);
      setShowSuccess(true);
      
      // Reset form after success
      setTimeout(() => {
        setFormData({
          djName: "",
          realName: "",
          email: "",
          location: "",
          showTitle: "",
          showDescription: "",
          primaryGenre: "",
          showLength: "60",
          additionalGenres: "",
          djExperience: "",
          musicDiscovery: "",
          socialMedia: "",
          demoMixTitle: "",
          demoMixDescription: "",
          soundcloudUrl: "",
          mixcloudUrl: "",
          audiocomUrl: "",
          otherUrl: "",
          agreeTerms: false,
        });
        setUploadedFiles([]);
        setTags([]);
        setShowSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Error submitting application:', error);
      setIsSubmitting(false);
      // Could add error state here
    }
  };

  return (
    <div className="min-h-screen bg-white relative">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold tracking-tight font-mono text-red-500">
              ENAMORADO
            </Link>
            <Link href="/" className="text-gray-600 hover:text-red-500 transition-colors text-sm font-mono">
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>
      
      <div className="pt-24 max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="relative flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-3"></div>
              <span className="text-red-500 font-semibold uppercase text-sm tracking-wide font-mono">
                ACCEPTING SUBMISSIONS
              </span>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold mb-4 font-mono text-gray-900">
            Submit a Mix
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed font-mono">
            Share your work with our community for potential featuring, 
            airplay, or collaboration opportunities.
          </p>
          <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200 max-w-3xl mx-auto">
            <p className="text-sm text-red-600 font-mono">
              <strong>Important:</strong> By submitting, you maintain full ownership of your work. 
              We only feature content with explicit artist consent.
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {quickActionButtons.map((button, index) => {
            const Icon = button.icon;
            return (
              <button
                key={index}
                onClick={() => setFormData(prev => ({ ...prev, primaryGenre: button.label.toLowerCase() }))}
                className={`relative group p-6 rounded-2xl bg-gradient-to-r ${button.color} bg-opacity-10 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl`}
              >
                <div className="flex flex-col items-center text-center">
                  <Icon className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-semibold">{button.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-8 md:p-12 space-y-12 shadow-lg">
          {/* Personal Information */}
          <div className="space-y-8">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">1</span>
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Tell us about yourself
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label htmlFor="djName" className="block text-sm font-semibold text-gray-300 uppercase tracking-wide">
                  Artist Name *
                </label>
                <input
                  type="text"
                  id="djName"
                  value={formData.djName}
                  onChange={handleInputChange}
                  required
                  placeholder="What do you call yourself?"
                  className="w-full px-6 py-4 bg-black/20 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm text-white placeholder-gray-400 text-lg transition-all duration-300"
                />
              </div>
              <div className="space-y-3">
                <label htmlFor="realName" className="block text-sm font-semibold text-gray-300 uppercase tracking-wide">
                  Real Name *
                </label>
                <input
                  type="text"
                  id="realName"
                  value={formData.realName}
                  onChange={handleInputChange}
                  required
                  placeholder="Your given name"
                  className="w-full px-6 py-4 bg-black/20 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm text-white placeholder-gray-400 text-lg transition-all duration-300"
                />
              </div>
              <div className="space-y-3">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-300 uppercase tracking-wide">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="your@email.com"
                  className="w-full px-6 py-4 bg-black/20 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm text-white placeholder-gray-400 text-lg transition-all duration-300"
                />
              </div>
              <div className="space-y-3">
                <label htmlFor="location" className="block text-sm font-semibold text-gray-300 uppercase tracking-wide">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Where are you broadcasting from?"
                  className="w-full px-6 py-4 bg-black/20 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm text-white placeholder-gray-400 text-lg transition-all duration-300"
                />
              </div>
            </div>
          </div>

          {/* Show Concept */}
          <div className="space-y-8">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">2</span>
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
                Your sonic vision
              </h3>
            </div>
            
            <div className="space-y-8">
              <div className="space-y-3">
                <label htmlFor="showTitle" className="block text-sm font-semibold text-gray-300 uppercase tracking-wide">
                  Show Title *
                </label>
                <input
                  type="text"
                  id="showTitle"
                  value={formData.showTitle}
                  onChange={handleInputChange}
                  required
                  placeholder="What's your show called?"
                  className="w-full px-6 py-4 bg-black/20 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm text-white placeholder-gray-400 text-lg transition-all duration-300"
                />
              </div>
              
              <div className="space-y-3">
                <label htmlFor="showDescription" className="block text-sm font-semibold text-gray-300 uppercase tracking-wide">
                  Show Description *
                </label>
                <textarea
                  id="showDescription"
                  value={formData.showDescription}
                  onChange={handleInputChange}
                  placeholder="Paint us a picture... What atmosphere will you create? What journey will you take listeners on? What makes your sonic vision unique?"
                  required
                  rows={5}
                  className="w-full px-6 py-4 bg-black/20 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm text-white placeholder-gray-400 text-lg transition-all duration-300 resize-none"
                />
              </div>
              
              {/* Artwork Upload */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-300 uppercase tracking-wide">
                  Show Artwork
                </label>
                <div
                  className={`relative border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-300 ${
                    dragOver 
                      ? 'border-purple-400 bg-purple-500/10' 
                      : 'border-white/20 hover:border-white/40'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    handleArtworkUpload(e.dataTransfer.files);
                  }}
                >
                  {artworkPreview ? (
                    <div className="relative">
                      <img 
                        src={artworkPreview} 
                        alt="Show artwork" 
                        className="w-32 h-32 object-cover rounded-2xl mx-auto mb-4"
                      />
                      <button
                        type="button"
                        onClick={() => setArtworkPreview(null)}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto">
                        <Upload className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <p className="text-xl font-semibold text-white mb-2">Drop your artwork here</p>
                        <p className="text-gray-400">or click to browse</p>
                      </div>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files && handleArtworkUpload(e.target.files)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label htmlFor="primaryGenre" className="block text-sm font-semibold text-gray-300 uppercase tracking-wide">
                    Primary Genre/Style *
                  </label>
                  <select
                    id="primaryGenre"
                    value={formData.primaryGenre}
                    onChange={handleInputChange}
                    required
                    className="w-full px-6 py-4 bg-black/20 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm text-white text-lg transition-all duration-300"
                  >
                    <option value="">Select primary genre...</option>
                    <option value="electronic">Electronic</option>
                    <option value="experimental">Experimental</option>
                    <option value="ambient">Ambient</option>
                    <option value="drone">Drone</option>
                    <option value="techno">Techno</option>
                    <option value="house">House</option>
                    <option value="breakbeat">Breakbeat</option>
                    <option value="hip-hop">Hip-Hop</option>
                    <option value="jazz">Jazz</option>
                    <option value="indie">Indie</option>
                    <option value="world">World Music</option>
                    <option value="classical">Classical</option>
                    <option value="noise">Noise</option>
                    <option value="punk">Punk</option>
                    <option value="metal">Metal</option>
                    <option value="folk">Folk</option>
                    <option value="soul">Soul/R&B</option>
                    <option value="reggae">Reggae</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label htmlFor="showLength" className="block text-sm font-semibold text-gray-300 uppercase tracking-wide">
                    Show Length
                  </label>
                  <select
                    id="showLength"
                    value={formData.showLength}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 bg-black/20 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm text-white text-lg transition-all duration-300"
                  >
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="90">1.5 hours</option>
                    <option value="120">2 hours</option>
                  </select>
                </div>
              </div>
              {/* Visual Tag System */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-300 uppercase tracking-wide">
                  Additional Tags & Genres
                </label>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-500/30 rounded-full px-4 py-2 text-sm font-medium"
                      >
                        <Tag className="w-3 h-3" />
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="w-4 h-4 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      onKeyPress={handleTagKeyPress}
                      placeholder="Add tags like: downtempo, lo-fi, acid, breakbeat..."
                      className="flex-1 px-6 py-4 bg-black/20 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm text-white placeholder-gray-400 text-lg transition-all duration-300"
                    />
                    <button
                      type="button"
                      onClick={() => addTag(currentTag)}
                      className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center hover:scale-105 transition-transform"
                    >
                      <Plus className="w-6 h-6 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Background */}
          <div className="space-y-8">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">3</span>
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                Your musical journey
              </h3>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label htmlFor="djExperience" className="block text-sm font-semibold text-gray-300 uppercase tracking-wide">
                  DJ Experience
                </label>
                <textarea
                  id="djExperience"
                  value={formData.djExperience}
                  onChange={handleInputChange}
                  placeholder="Share your story... How did you start? What drives your passion for DJing? Any notable moments or venues?"
                  rows={4}
                  className="w-full px-6 py-4 bg-black/20 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent backdrop-blur-sm text-white placeholder-gray-400 text-lg transition-all duration-300 resize-none"
                />
              </div>
              
              <div className="space-y-3">
                <label htmlFor="musicDiscovery" className="block text-sm font-semibold text-gray-300 uppercase tracking-wide">
                  Music Discovery
                </label>
                <textarea
                  id="musicDiscovery"
                  value={formData.musicDiscovery}
                  onChange={handleInputChange}
                  placeholder="Where do you hunt for sounds? Record stores, SoundCloud, Bandcamp, late-night YouTube rabbit holes?"
                  rows={4}
                  className="w-full px-6 py-4 bg-black/20 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent backdrop-blur-sm text-white placeholder-gray-400 text-lg transition-all duration-300 resize-none"
                />
              </div>
              
              <div className="space-y-3">
                <label htmlFor="socialMedia" className="block text-sm font-semibold text-gray-300 uppercase tracking-wide">
                  Online Presence
                </label>
                <input
                  type="url"
                  id="socialMedia"
                  value={formData.socialMedia}
                  onChange={handleInputChange}
                  placeholder="Your SoundCloud, Instagram, website, or wherever you share your work"
                  className="w-full px-6 py-4 bg-black/20 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent backdrop-blur-sm text-white placeholder-gray-400 text-lg transition-all duration-300"
                />
              </div>
            </div>
          </div>

          {/* Demo Mix Upload */}
          <div className="space-y-8">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">4</span>
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                Show us your sound
              </h3>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label htmlFor="demoMixTitle" className="block text-sm font-semibold text-gray-300 uppercase tracking-wide">
                  Mix Title
                </label>
                <input
                  type="text"
                  id="demoMixTitle"
                  value={formData.demoMixTitle}
                  onChange={handleInputChange}
                  placeholder="What's your demo mix called?"
                  className="w-full px-6 py-4 bg-black/20 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent backdrop-blur-sm text-white placeholder-gray-400 text-lg transition-all duration-300"
                />
              </div>
              
              <div className="space-y-3">
                <label htmlFor="demoMixDescription" className="block text-sm font-semibold text-gray-300 uppercase tracking-wide">
                  Mix Description
                </label>
                <textarea
                  id="demoMixDescription"
                  value={formData.demoMixDescription}
                  onChange={handleInputChange}
                  placeholder="Tell the story of your mix... What journey are you taking us on? Any special tracks or techniques that make it unique?"
                  rows={4}
                  className="w-full px-6 py-4 bg-black/20 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent backdrop-blur-sm text-white placeholder-gray-400 text-lg transition-all duration-300 resize-none"
                />
              </div>

              {/* Streaming Platform Links */}
              <div className="bg-black/20 backdrop-blur-sm rounded-3xl p-6 border border-white/10 space-y-4">
                <h4 className="text-lg font-semibold text-orange-300 flex items-center">
                  <Music className="w-5 h-5 mr-2" />
                  Streaming Platform Links
                </h4>
                <p className="text-sm text-gray-400 mb-4">
                  Share your mix from SoundCloud, Mixcloud, Audio.com, or any platform where you host MP3s
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300 flex items-center">
                      <div className="w-4 h-4 bg-orange-500 rounded mr-2"></div>
                      SoundCloud
                    </label>
                    <input
                      type="url"
                      name="soundcloudUrl"
                      value={formData.soundcloudUrl || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="https://soundcloud.com/your-mix"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300 flex items-center">
                      <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                      Mixcloud
                    </label>
                    <input
                      type="url"
                      name="mixcloudUrl"
                      value={formData.mixcloudUrl || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://mixcloud.com/your-mix"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300 flex items-center">
                      <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                      Audio.com
                    </label>
                    <input
                      type="url"
                      name="audiocomUrl"
                      value={formData.audiocomUrl || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="https://audio.com/your-mix"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300 flex items-center">
                      <div className="w-4 h-4 bg-purple-500 rounded mr-2"></div>
                      Other Platform
                    </label>
                    <input
                      type="url"
                      name="otherUrl"
                      value={formData.otherUrl || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Any other platform URL"
                    />
                  </div>
                </div>
              </div>
              
              {/* File Upload Area */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-300 uppercase tracking-wide">
                  Upload MP3 Files (Optional)
                </label>
                <p className="text-sm text-gray-400 mb-2">
                  Upload your mix files directly, or use the streaming platform links above
                </p>
                <div
                  className={`border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-300 ${
                    dragOver 
                      ? 'border-orange-400 bg-orange-500/10 scale-105' 
                      : 'border-white/20 hover:border-orange-400 hover:bg-orange-500/5'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('fileInput')?.click()}
                >
                  <div className="space-y-6">
                    <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
                      <Headphones className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white mb-2">Drop your MP3 files here</p>
                      <p className="text-gray-400 text-lg">or click to browse your files</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">
                        <span className="font-semibold">MP3, WAV, FLAC, M4A</span> • Max 100MB per file
                      </p>
                    </div>
                  </div>
                </div>
                <input
                  type="file"
                  id="fileInput"
                  multiple
                  accept=".mp3,.wav,.flac,.m4a,.aac"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  className="hidden"
                />
              </div>

              {/* Uploaded Files */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-300">Uploaded Files:</h4>
                  <div className="space-y-3">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-black/20 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold">{file.name.split('.').pop()?.toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-white">{file.name}</p>
                            <p className="text-sm text-gray-400">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center hover:bg-red-500/30 transition-colors"
                        >
                          <X className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Terms */}
          <div className="bg-black/20 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
            <div className="flex items-start space-x-4">
              <input
                type="checkbox"
                id="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleInputChange}
                required
                className="mt-1 w-5 h-5 rounded border-2 border-white/20 bg-black/20 checked:bg-purple-500 checked:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <label htmlFor="agreeTerms" className="text-gray-300 leading-relaxed">
                I confirm that I have the rights to all submitted content and agree to Enamorado Radio's terms. 
                I understand that submissions will be reviewed by our team and I may be contacted for additional information.
                <br />
                <span className="text-sm text-gray-500 mt-2 block">
                  By submitting, you're joining our collective of boundary-pushing artists.
                </span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row gap-4 pt-8">
            <button
              type="submit"
              disabled={isSubmitting || !formData.agreeTerms}
              className="flex-1 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 disabled:from-gray-600 disabled:via-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white py-6 px-8 rounded-3xl font-bold text-lg transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-2xl"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  <span>Transmitting your frequency...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-3">
                  <Radio className="w-6 h-6" />
                  <span>JOIN THE COLLECTIVE</span>
                </div>
              )}
            </button>
            
            <Link 
              href="/"
              className="flex-1 sm:flex-none bg-black/20 backdrop-blur-sm border border-white/20 hover:border-white/40 text-white py-6 px-8 rounded-3xl font-semibold text-lg transition-all duration-300 hover:bg-black/30 text-center"
            >
              Back to Home
            </Link>
          </div>

          {/* Success Message */}
          {showSuccess && (
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-green-500/30 text-green-400 p-6 rounded-3xl flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-1">Frequency received!</h4>
                <p className="text-green-300">Your application has been transmitted to our collective. We'll review your sonic vision and get back to you soon.</p>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}