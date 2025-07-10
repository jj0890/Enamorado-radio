import { useState } from "react";
import { Link } from "wouter";
import { Upload, X, CheckCircle, AlertCircle } from "lucide-react";

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
    agreeTerms: false,
  });

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);

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

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

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
        agreeTerms: false,
      });
      setUploadedFiles([]);
      setShowSuccess(false);
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-orange-500 hover:text-orange-400 mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-2">Join Our DJ Collective</h1>
          <p className="text-gray-300 text-lg">Share your sound with our community</p>
        </div>

        {/* Intro Section */}
        <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-lg p-6 mb-8 border border-orange-500/20">
          <h3 className="text-xl font-semibold mb-3 text-center">Ready to broadcast?</h3>
          <p className="text-gray-300 text-center">
            We're looking for passionate DJs who want to share their unique sound with our listeners. 
            Whether you're spinning experimental beats, deep cuts, or genre-defying mixes, we want to hear from you.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-8 space-y-8">
          {/* Personal Information */}
          <div>
            <h3 className="text-xl font-semibold mb-4 pb-2 border-b-2 border-orange-500">About You</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="djName" className="block text-sm font-medium mb-2">
                  DJ Name / Artist Name *
                </label>
                <input
                  type="text"
                  id="djName"
                  value={formData.djName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="realName" className="block text-sm font-medium mb-2">
                  Real Name *
                </label>
                <input
                  type="text"
                  id="realName"
                  value={formData.realName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium mb-2">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="City, State/Country"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Show Concept */}
          <div>
            <h3 className="text-xl font-semibold mb-4 pb-2 border-b-2 border-orange-500">Your Show Concept</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="showTitle" className="block text-sm font-medium mb-2">
                  Proposed Show Title *
                </label>
                <input
                  type="text"
                  id="showTitle"
                  value={formData.showTitle}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="showDescription" className="block text-sm font-medium mb-2">
                  Show Description *
                </label>
                <textarea
                  id="showDescription"
                  value={formData.showDescription}
                  onChange={handleInputChange}
                  placeholder="Describe your show concept, the vibe you want to create, and what makes it unique..."
                  required
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="primaryGenre" className="block text-sm font-medium mb-2">
                    Primary Genre/Style *
                  </label>
                  <select
                    id="primaryGenre"
                    value={formData.primaryGenre}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select primary genre...</option>
                    <option value="electronic">Electronic</option>
                    <option value="experimental">Experimental</option>
                    <option value="ambient">Ambient</option>
                    <option value="techno">Techno</option>
                    <option value="house">House</option>
                    <option value="hip-hop">Hip-Hop</option>
                    <option value="jazz">Jazz</option>
                    <option value="indie">Indie</option>
                    <option value="world">World Music</option>
                    <option value="classical">Classical</option>
                    <option value="punk">Punk</option>
                    <option value="metal">Metal</option>
                    <option value="folk">Folk</option>
                    <option value="soul">Soul/R&B</option>
                    <option value="reggae">Reggae</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="showLength" className="block text-sm font-medium mb-2">
                    Preferred Show Length
                  </label>
                  <select
                    id="showLength"
                    value={formData.showLength}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="90">1.5 hours</option>
                    <option value="120">2 hours</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="additionalGenres" className="block text-sm font-medium mb-2">
                  Additional Genres/Tags
                </label>
                <input
                  type="text"
                  id="additionalGenres"
                  value={formData.additionalGenres}
                  onChange={handleInputChange}
                  placeholder="downtempo, lo-fi, acid, breakbeat, etc."
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Background */}
          <div>
            <h3 className="text-xl font-semibold mb-4 pb-2 border-b-2 border-orange-500">Your Background</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="djExperience" className="block text-sm font-medium mb-2">
                  DJ Experience
                </label>
                <textarea
                  id="djExperience"
                  value={formData.djExperience}
                  onChange={handleInputChange}
                  placeholder="Tell us about your DJ background, how long you've been mixing, notable gigs, etc."
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="musicDiscovery" className="block text-sm font-medium mb-2">
                  Music Discovery
                </label>
                <textarea
                  id="musicDiscovery"
                  value={formData.musicDiscovery}
                  onChange={handleInputChange}
                  placeholder="How do you discover new music? What sources inspire your selections?"
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="socialMedia" className="block text-sm font-medium mb-2">
                  Social Media / Website
                </label>
                <input
                  type="url"
                  id="socialMedia"
                  value={formData.socialMedia}
                  onChange={handleInputChange}
                  placeholder="Your SoundCloud, Instagram, website, etc."
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Demo Mix Upload */}
          <div>
            <h3 className="text-xl font-semibold mb-4 pb-2 border-b-2 border-orange-500">Demo Mix</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="demoMixTitle" className="block text-sm font-medium mb-2">
                  Mix Title
                </label>
                <input
                  type="text"
                  id="demoMixTitle"
                  value={formData.demoMixTitle}
                  onChange={handleInputChange}
                  placeholder="Title of your demo mix"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="demoMixDescription" className="block text-sm font-medium mb-2">
                  Mix Description
                </label>
                <textarea
                  id="demoMixDescription"
                  value={formData.demoMixDescription}
                  onChange={handleInputChange}
                  placeholder="Describe your mix, the journey you're taking listeners on, and any special tracks or techniques..."
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* File Upload Area */}
              <div>
                <label className="block text-sm font-medium mb-2">Upload Files</label>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                    dragOver 
                      ? 'border-blue-500 bg-blue-500/10' 
                      : 'border-gray-600 hover:border-blue-500 hover:bg-blue-500/5'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('fileInput')?.click()}
                >
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-lg font-medium mb-1">Click to upload or drag and drop</p>
                  <p className="text-sm text-gray-400">MP3, WAV, FLAC • Max 100MB per file</p>
                </div>
                <input
                  type="file"
                  id="fileInput"
                  multiple
                  accept="audio/*,.pdf,image/*"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  className="hidden"
                />
              </div>

              {/* Uploaded Files */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Uploaded Files:</h4>
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-900 p-3 rounded-md">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                          <span className="text-xs font-bold">{file.name.split('.').pop()?.toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="agreeTerms"
              checked={formData.agreeTerms}
              onChange={handleInputChange}
              required
              className="mt-1"
            />
            <label htmlFor="agreeTerms" className="text-sm text-gray-300">
              I agree to the terms and conditions and confirm that I have the rights to all submitted content. 
              I understand that submissions will be reviewed and I may be contacted for additional information.
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !formData.agreeTerms}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 px-6 rounded-md font-semibold transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Submitting...</span>
              </div>
            ) : (
              'Submit Application'
            )}
          </button>

          {/* Success Message */}
          {showSuccess && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-4 rounded-md flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>Application submitted successfully! We'll review your submission and get back to you soon.</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}