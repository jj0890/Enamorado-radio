import { useState } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, FileText, Camera, Music, Lightbulb, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

export default function EditorialSubmissions() {
  const [selectedType, setSelectedType] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [workSamples, setWorkSamples] = useState('');

  const submissionTypes = [
    {
      id: 'essay',
      title: 'Essays & Writing',
      icon: <FileText className="w-6 h-6" />,
      description: 'Cultural criticism, artist profiles, scene reports',
      examples: 'Think pieces on music scenes, artist interviews, cultural essays'
    },
    {
      id: 'photography',
      title: 'Photography',
      icon: <Camera className="w-6 h-6" />,
      description: 'Concert photography, artist portraits, scene documentation',
      examples: 'Live show photos, artist portraits, behind-the-scenes documentation'
    },
    {
      id: 'creative',
      title: 'Creative Projects',
      icon: <Lightbulb className="w-6 h-6" />,
      description: 'Art, design, creative writing, experimental work',
      examples: 'Zine design, creative writing, art projects, experimental media'
    },
    {
      id: 'music',
      title: 'Music Features',
      icon: <Music className="w-6 h-6" />,
      description: 'Album reviews, artist features, scene coverage',
      examples: 'Album reviews, artist deep-dives, genre explorations'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle submission - would connect to API
    console.log('Editorial submission:', { selectedType, title, description, contactInfo, workSamples });
  };

  return (
    <div className="bg-white text-black min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 border-b-2 border-black pb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/">
              <button className="flex items-center gap-2 text-black hover:text-gray-600 transition-colors">
                <ArrowLeft className="w-5 h-5" />
                Back to Home
              </button>
            </Link>
          </div>
          
          <h1 className="text-4xl font-bold uppercase tracking-wide mb-4">
            SUBMIT FOR PRINT
          </h1>
          <p className="text-lg mb-4">
            Pitch work for consideration in our print magazine and editorial features
          </p>
          
          <div className="bg-gray-50 p-4 border border-gray-200">
            <p className="text-sm text-gray-700 leading-relaxed">
              <strong>What we're looking for:</strong> Thoughtful work that adds to the conversation around music, 
              culture, and creativity. We work with contributors to develop pieces that fit our editorial vision 
              while honoring your voice and perspective.
            </p>
          </div>
        </div>

        {!selectedType ? (
          /* Type Selection */
          <div>
            <h2 className="text-xl font-bold mb-6">WHAT ARE YOU PITCHING?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-2 border-black">
              {submissionTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className="border-r-2 border-b-2 border-black p-6 hover:bg-gray-50 transition-colors text-left group"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="text-black group-hover:scale-110 transition-transform">
                      {type.icon}
                    </div>
                    <h3 className="font-bold text-lg uppercase tracking-wide">
                      {type.title}
                    </h3>
                  </div>
                  
                  <p className="text-sm text-gray-600 leading-relaxed mb-3">
                    {type.description}
                  </p>
                  
                  <p className="text-xs text-gray-500 italic">
                    {type.examples}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Submission Form */
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <button
                type="button"
                onClick={() => setSelectedType('')}
                className="text-gray-600 hover:text-black transition-colors"
              >
                ← Change type
              </button>
              <div className="flex items-center gap-2">
                {submissionTypes.find(t => t.id === selectedType)?.icon}
                <span className="font-bold text-lg">
                  {submissionTypes.find(t => t.id === selectedType)?.title}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-mono font-bold mb-2">
                PITCH TITLE
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Working title for your piece"
                className="w-full border-2 border-black focus:ring-0 focus:border-gray-600"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-mono font-bold mb-2">
                PITCH DESCRIPTION
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us about your idea, approach, and what makes it worth covering. What's your angle? Why now?"
                className="w-full border-2 border-black focus:ring-0 focus:border-gray-600 min-h-32"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-mono font-bold mb-2">
                WORK SAMPLES / LINKS
              </label>
              <Textarea
                value={workSamples}
                onChange={(e) => setWorkSamples(e.target.value)}
                placeholder="Share links to previous work, portfolio, or relevant samples that show your style and approach"
                className="w-full border-2 border-black focus:ring-0 focus:border-gray-600"
                rows={4}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-mono font-bold mb-2">
                CONTACT INFO
              </label>
              <Input
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="Email, Instagram, or preferred contact method"
                className="w-full border-2 border-black focus:ring-0 focus:border-gray-600"
                required
              />
            </div>

            <div className="flex gap-4 pt-6">
              <Button
                type="submit"
                className="bg-black text-white hover:bg-gray-800 px-8 py-3 font-medium flex-1"
              >
                <Send className="w-4 h-4 mr-2" />
                Submit Pitch
              </Button>
              
              <Link href="/share">
                <Button
                  type="button"
                  variant="outline"
                  className="border-2 border-black hover:bg-gray-50 px-8 py-3 font-medium"
                >
                  Share Casually Instead
                </Button>
              </Link>
            </div>

            <div className="bg-gray-50 p-4 border border-gray-200">
              <p className="text-xs text-gray-600 leading-relaxed">
                <strong>What happens next:</strong> We review pitches monthly and get back to everyone. 
                If we're interested, we'll work with you to develop the piece. We believe in collaboration 
                and fair compensation for published work.
              </p>
            </div>
          </form>
        )}

        {/* Recent Editorial Examples */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h3 className="font-bold text-lg mb-4">RECENT EDITORIAL</h3>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4" />
                <span className="font-medium text-sm">ISSUE #03</span>
              </div>
              <p className="text-sm text-gray-600">
                "The Underground Electronic Scene in Austin" - Deep dive into local producers and venues
              </p>
            </div>
            
            <div className="p-4 bg-gray-50 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Camera className="w-4 h-4" />
                <span className="font-medium text-sm">PHOTO ESSAY</span>
              </div>
              <p className="text-sm text-gray-600">
                Behind-the-scenes documentation of recording sessions at local studios
              </p>
            </div>
          </div>
        </div>

        {/* Guidelines */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="font-bold text-lg mb-4">SUBMISSION GUIDELINES</h3>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">ESSAYS & WRITING</h4>
              <p className="text-gray-600">800-2500 words. We edit collaboratively and maintain your voice.</p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">PHOTOGRAPHY</h4>
              <p className="text-gray-600">High-res files required. We handle layout and design.</p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">COMPENSATION</h4>
              <p className="text-gray-600">We pay contributors for published work. Rates discussed during acceptance.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}