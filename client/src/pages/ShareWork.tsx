import { useState } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Upload, FileText, Music, Camera, Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

export default function ShareWork() {
  const [selectedType, setSelectedType] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [links, setLinks] = useState('');

  const workTypes = [
    {
      id: 'mix',
      title: 'Mix/Music',
      icon: <Music className="w-6 h-6" />,
      description: 'SoundCloud links, Bandcamp, or file uploads',
      placeholder: 'What have you been working on musically?'
    },
    {
      id: 'writing',
      title: 'Writing',
      icon: <FileText className="w-6 h-6" />,
      description: 'Essays, reviews, stories, thoughts',
      placeholder: 'Share something you wrote or want to discuss'
    },
    {
      id: 'visual',
      title: 'Visual Art',
      icon: <Camera className="w-6 h-6" />,
      description: 'Photos, drawings, designs, videos',
      placeholder: 'Show us what you created visually'
    },
    {
      id: 'discovery',
      title: 'Discovery',
      icon: <Sparkles className="w-6 h-6" />,
      description: 'Something cool you found worth sharing',
      placeholder: 'What have you been enamored with lately?'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle submission - would connect to API
    console.log('Sharing:', { selectedType, title, description, links });
  };

  return (
    <div className="bg-white text-black min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-8">
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
            SHARE YOUR WORK
          </h1>
          <p className="text-lg">
            Show us what you've been creating - essays, art, photos, discoveries, whatever
          </p>
        </div>

        {!selectedType ? (
          /* Type Selection */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-2 border-black">
            {workTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className="border-r-2 border-b-2 border-black p-8 hover:bg-gray-50 transition-colors text-left group"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-black group-hover:scale-110 transition-transform">
                    {type.icon}
                  </div>
                  <h3 className="font-bold text-lg uppercase tracking-wide">
                    {type.title}
                  </h3>
                </div>
                
                <p className="text-sm text-gray-600 leading-relaxed">
                  {type.description}
                </p>
              </button>
            ))}
          </div>
        ) : (
          /* Sharing Form */
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
                {workTypes.find(t => t.id === selectedType)?.icon}
                <span className="font-bold text-lg">
                  {workTypes.find(t => t.id === selectedType)?.title}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-mono font-bold mb-2">
                WHAT IS IT?
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give it a title or quick description"
                className="w-full border-2 border-black focus:ring-0 focus:border-gray-600"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-mono font-bold mb-2">
                TELL US ABOUT IT
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={workTypes.find(t => t.id === selectedType)?.placeholder}
                className="w-full border-2 border-black focus:ring-0 focus:border-gray-600 min-h-32"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-mono font-bold mb-2">
                LINKS/FILES
              </label>
              <Textarea
                value={links}
                onChange={(e) => setLinks(e.target.value)}
                placeholder="Paste links to your work, or mention if you have files to share"
                className="w-full border-2 border-black focus:ring-0 focus:border-gray-600"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-2">
                SoundCloud, Bandcamp, Google Drive, whatever works
              </p>
            </div>

            <div className="flex gap-4 pt-6">
              <Button
                type="submit"
                className="bg-black text-white hover:bg-gray-800 px-8 py-3 font-medium flex-1"
              >
                <Heart className="w-4 h-4 mr-2" />
                Share It
              </Button>
              
              <Link href="/zine/submit">
                <Button
                  type="button"
                  variant="outline"
                  className="border-2 border-black hover:bg-gray-50 px-8 py-3 font-medium"
                >
                  Submit for Print Instead
                </Button>
              </Link>
            </div>

            <p className="text-xs text-gray-500 text-center">
              This goes to real people who genuinely care about what you're creating. 
              No algorithms, no gatekeeping, just celebration of good work.
            </p>
          </form>
        )}

        {/* Community Examples */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h3 className="font-bold text-lg mb-4">RECENTLY SHARED</h3>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Music className="w-4 h-4" />
                <span className="font-medium text-sm">Alex shared a mix</span>
              </div>
              <p className="text-sm text-gray-600">
                "Been working on this late-night jazz set - hoping it hits right for studying/working"
              </p>
            </div>
            
            <div className="p-4 bg-gray-50 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4" />
                <span className="font-medium text-sm">Maya shared writing</span>
              </div>
              <p className="text-sm text-gray-600">
                "Essay about how Detroit techno influenced my understanding of community..."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}