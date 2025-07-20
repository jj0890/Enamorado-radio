import { Link } from 'wouter';
import { ArrowLeft, MapPin, Users, Music, Heart } from 'lucide-react';

export default function About() {
  return (
    <div className="bg-white text-black min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-8">
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
            ABOUT ENAMORADO RADIO
          </h1>
          <p className="text-lg">
            A curated radio platform celebrating underground music and authentic voices
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
          {/* Our Story */}
          <div>
            <h2 className="text-2xl font-bold uppercase tracking-wide mb-6 flex items-center gap-2">
              <Heart className="w-6 h-6" />
              OUR STORY
            </h2>
            <div className="space-y-4 text-base leading-relaxed">
              <p>
                Enamorado Radio emerged from a passion for discovering and sharing music that doesn't fit into mainstream categories. We're dedicated to providing a platform for artists, DJs, and creators who push boundaries and challenge conventional sound.
              </p>
              <p>
                Our name "Enamorado" means "in love" in Spanish, reflecting our deep love for music and the communities that create it. We believe in fair compensation, artist ownership, and consent-focused collaboration.
              </p>
              <p>
                From underground hip-hop to experimental jazz, ambient soundscapes to electronic explorations, we curate content that represents authentic artistic expression.
              </p>
            </div>
          </div>

          {/* Location & Mission */}
          <div>
            <h2 className="text-2xl font-bold uppercase tracking-wide mb-6 flex items-center gap-2">
              <MapPin className="w-6 h-6" />
              BASED IN TEXAS
            </h2>
            <div className="space-y-4 text-base leading-relaxed">
              <p>
                Broadcasting from Texas, we're rooted in a region with rich musical heritage spanning country, blues, hip-hop, and electronic music. This diversity influences our curatorial approach.
              </p>
              <p>
                We work with local and international artists, creating bridges between communities and scenes. Our editorial team includes music enthusiasts, former radio professionals, and cultural curators.
              </p>
              <p>
                Every guide, episode, and recommendation comes from genuine passion and deep knowledge of the music we feature.
              </p>
            </div>
          </div>
        </div>

        {/* Values Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold uppercase tracking-wide mb-8 flex items-center gap-2">
            <Users className="w-6 h-6" />
            OUR VALUES
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-2 border-black">
            <div className="border-r-2 border-b-2 border-black p-6">
              <h3 className="font-bold text-lg uppercase tracking-wide mb-3">ARTIST FIRST</h3>
              <p className="text-sm leading-relaxed">
                We prioritize artist ownership, fair compensation, and consent in all collaborations. Your music, your terms.
              </p>
            </div>
            
            <div className="border-r-2 border-b-2 border-black p-6">
              <h3 className="font-bold text-lg uppercase tracking-wide mb-3">AUTHENTIC CURATION</h3>
              <p className="text-sm leading-relaxed">
                Every recommendation comes from genuine listening and appreciation. No algorithmic playlists, just passionate human curation.
              </p>
            </div>
            
            <div className="border-b-2 border-black p-6">
              <h3 className="font-bold text-lg uppercase tracking-wide mb-3">COMMUNITY DRIVEN</h3>
              <p className="text-sm leading-relaxed">
                We're building a platform by and for music lovers. Community feedback shapes our content and direction.
              </p>
            </div>
          </div>
        </div>

        {/* Editorial Team */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold uppercase tracking-wide mb-8 flex items-center gap-2">
            <Music className="w-6 h-6" />
            EDITORIAL TEAM
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-2 border-black">
            <div className="border-r-2 border-b-2 border-black p-6">
              <h3 className="font-bold text-lg mb-2">JARRAD</h3>
              <p className="text-sm text-gray-600 mb-3">MUSIC DIRECTOR</p>
              <p className="text-sm leading-relaxed">
                Specializes in underground hip-hop and experimental beats. Curator of our "Guide to Earl Sweatshirt" series.
              </p>
            </div>
            
            <div className="border-b-2 border-black p-6">
              <h3 className="font-bold text-lg mb-2">LAUREN</h3>
              <p className="text-sm text-gray-600 mb-3">JAZZ CURATOR</p>
              <p className="text-sm leading-relaxed">
                Former radio station professional with deep jazz knowledge. Leads our jazz essentials programming.
              </p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="text-center">
          <h2 className="text-2xl font-bold uppercase tracking-wide mb-6">
            GET INVOLVED
          </h2>
          <p className="text-lg mb-6">
            Have music to share? Want to collaborate? We'd love to hear from you.
          </p>
          <div className="flex justify-center gap-6">
            <Link href="/mix-upload">
              <button className="bg-black text-white px-6 py-3 font-mono text-sm hover:bg-gray-800 transition-colors">
                SUBMIT A MIX
              </button>
            </Link>
            <Link href="/albums">
              <button className="border-2 border-black px-6 py-3 font-mono text-sm hover:bg-gray-50 transition-colors">
                VIEW EDITORIAL
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}