import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Radio, 
  Calendar, 
  Users, 
  Star, 
  Archive, 
  Clock,
  MapPin,
  Heart
} from 'lucide-react';

// Real radio content data
const staffSelections = [
  {
    id: 1,
    date: "DECEMBER 15, 2024",
    title: "Post-Punk Revival",
    description: "Rediscovering the angular sounds of early 80s UK underground",
    host: "Marcus Rivera",
    artwork: "/api/placeholder/600/400",
    tags: ["POST PUNK", "REVIVAL", "UK"],
    duration: "2h 15m"
  },
  {
    id: 2,
    date: "DECEMBER 10, 2024", 
    title: "Detroit Techno Origins",
    description: "Juan Atkins, Derrick May, and Kevin Saunderson's revolutionary sound",
    host: "Luna Park",
    artwork: "/api/placeholder/600/400",
    tags: ["TECHNO", "DETROIT", "ORIGINALS"],
    duration: "1h 45m"
  },
  {
    id: 3,
    date: "DECEMBER 5, 2024",
    title: "Afrobeat Explorations", 
    description: "From Fela Kuti to contemporary African electronic fusion",
    host: "Sarah Moon",
    artwork: "/api/placeholder/600/400",
    tags: ["AFROBEAT", "FUSION", "CONTEMPORARY"],
    duration: "2h 30m"
  },
  {
    id: 4,
    date: "NOVEMBER 28, 2024",
    title: "Ambient Architectures",
    description: "Building soundscapes: from Brian Eno to Tim Hecker",
    host: "Alex Volta",
    artwork: "/api/placeholder/600/400", 
    tags: ["AMBIENT", "SOUNDSCAPE", "EXPERIMENTAL"],
    duration: "2h 00m"
  }
];

const residents = [
  {
    id: 1,
    name: "MARCUS RIVERA",
    location: "LONDON",
    bio: "Deep house specialist with 15+ years digging through Detroit's underground",
    showTitle: "Deep Routes",
    schedule: "Every Tuesday 8-10 PM GMT",
    tags: ["DEEP HOUSE", "DETROIT", "UNDERGROUND"],
    artwork: "/api/placeholder/300/300"
  },
  {
    id: 2,
    name: "LUNA PARK", 
    location: "BERLIN",
    bio: "Techno archeologist exploring the connections between past and future",
    showTitle: "Temporal Mechanics",
    schedule: "Every Friday 11 PM-1 AM CET",
    tags: ["TECHNO", "EXPERIMENTAL", "ARCHIVE"],
    artwork: "/api/placeholder/300/300"
  },
  {
    id: 3,
    name: "SARAH MOON",
    location: "NEW YORK",
    bio: "Bridging cultures through sound - from Accra to Brooklyn",
    showTitle: "Global Frequencies",
    schedule: "Every Sunday 6-8 PM EST",
    tags: ["WORLD", "FUSION", "CULTURE"],
    artwork: "/api/placeholder/300/300"
  },
  {
    id: 4,
    name: "ALEX VOLTA",
    location: "TOKYO",
    bio: "Ambient and drone specialist crafting atmospheric journeys",
    showTitle: "Atmospheric Pressure",
    schedule: "Every Wednesday 10 PM-12 AM JST",
    tags: ["AMBIENT", "DRONE", "ATMOSPHERIC"],
    artwork: "/api/placeholder/300/300"
  }
];

const schedule = [
  { time: "6:00 PM", show: "Deep Routes", host: "Marcus Rivera", type: "live" },
  { time: "8:00 PM", show: "Global Frequencies", host: "Sarah Moon", type: "live" },
  { time: "10:00 PM", show: "Temporal Mechanics", host: "Luna Park", type: "live" },
  { time: "12:00 AM", show: "Atmospheric Pressure", host: "Alex Volta", type: "live" },
  { time: "2:00 AM", show: "Night Archive", host: "Various", type: "archive" },
  { time: "4:00 AM", show: "Dawn Transmissions", host: "Various", type: "archive" }
];

const communityPicks = [
  {
    id: 1,
    title: "UK Garage Revival",
    submittedBy: "listener_kerry",
    votes: 247,
    description: "The return of 2-step and shuffle beats in 2024",
    tags: ["UK GARAGE", "REVIVAL", "2024"],
    date: "3 days ago"
  },
  {
    id: 2,
    title: "Brazilian Bass Experiments",
    submittedBy: "bass_explorer",
    votes: 189,
    description: "São Paulo's underground electronic scene",
    tags: ["BRAZILIAN", "BASS", "UNDERGROUND"],
    date: "1 week ago"
  },
  {
    id: 3,
    title: "Minimal Techno Selections",
    submittedBy: "minimal_mind",
    votes: 156,
    description: "Stripped-down tracks from Berlin's warehouse scene",
    tags: ["MINIMAL", "TECHNO", "BERLIN"],
    date: "2 weeks ago"
  }
];

export default function RadioLanding() {
  const [activeTab, setActiveTab] = useState("staff-selections");

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <h1 className="text-2xl font-bold tracking-tight">RADIO</h1>
              <p className="text-white/70 text-sm">
                Tune in live or listen back to our music archive of radio and mixes.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-white/80">LIVE NOW</span>
              </div>
              <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                <Play className="w-4 h-4 mr-2" />
                Listen Live
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-white/5 border border-white/10 rounded-lg p-1">
            <TabsTrigger value="staff-selections" className="text-white data-[state=active]:bg-white/10">
              STAFF SELECTIONS
            </TabsTrigger>
            <TabsTrigger value="schedule" className="text-white data-[state=active]:bg-white/10">
              SCHEDULE
            </TabsTrigger>
            <TabsTrigger value="residents" className="text-white data-[state=active]:bg-white/10">
              RESIDENTS
            </TabsTrigger>
            <TabsTrigger value="community" className="text-white data-[state=active]:bg-white/10">
              COMMUNITY PICKS
            </TabsTrigger>
            <TabsTrigger value="archive" className="text-white data-[state=active]:bg-white/10">
              ARCHIVE
            </TabsTrigger>
          </TabsList>

          {/* Staff Selections */}
          <TabsContent value="staff-selections" className="mt-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2">STAFF SELECTIONS</h2>
              <p className="text-white/70 text-sm">
                Recent radio highlights hand picked by the Enamorado Radio team.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {staffSelections.map((selection) => (
                <Card key={selection.id} className="bg-black/40 border-white/10 hover:bg-black/60 transition-colors group cursor-pointer">
                  <CardContent className="p-0">
                    <div className="relative">
                      <div className="aspect-[4/3] bg-white/5 rounded-t-lg relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-16 h-16 bg-black/40 rounded-full flex items-center justify-center group-hover:bg-black/60 transition-colors">
                            <Play className="w-6 h-6 text-white ml-1" />
                          </div>
                        </div>
                        <div className="absolute top-3 left-3">
                          <Badge variant="secondary" className="bg-black/60 text-white text-xs">
                            {selection.duration}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="text-xs text-white/60 mb-2">{selection.date}</div>
                        <h3 className="font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                          {selection.title}
                        </h3>
                        <p className="text-white/70 text-sm mb-3">{selection.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-white/60 text-xs">{selection.host}</span>
                          <div className="flex gap-1">
                            {selection.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs border-white/20 text-white/80">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Schedule */}
          <TabsContent value="schedule" className="mt-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2">SCHEDULE</h2>
              <p className="text-white/70 text-sm">
                Today's live shows and archived programming.
              </p>
            </div>
            
            <Card className="bg-black/40 border-white/10">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {schedule.map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b border-white/10 last:border-0">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 text-white/60 text-sm font-mono">
                          {item.time}
                        </div>
                        <div className="flex items-center space-x-2">
                          {item.type === 'live' && (
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          )}
                          <div>
                            <div className="font-semibold text-white">{item.show}</div>
                            <div className="text-white/60 text-sm">{item.host}</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={item.type === 'live' ? 'destructive' : 'secondary'} className="text-xs">
                          {item.type === 'live' ? 'LIVE' : 'ARCHIVE'}
                        </Badge>
                        <Button size="sm" variant="ghost" className="p-2">
                          <Play className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Residents */}
          <TabsContent value="residents" className="mt-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2">RESIDENTS</h2>
              <p className="text-white/70 text-sm">
                Meet the voices behind Enamorado Radio.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {residents.map((resident) => (
                <Card key={resident.id} className="bg-black/40 border-white/10 hover:bg-black/60 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-white/5 rounded-lg flex items-center justify-center">
                        <Users className="w-6 h-6 text-white/60" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-bold text-white">{resident.name}</h3>
                          <div className="flex items-center space-x-1 text-white/60">
                            <MapPin className="w-3 h-3" />
                            <span className="text-xs">{resident.location}</span>
                          </div>
                        </div>
                        <div className="text-blue-400 font-semibold text-sm mb-2">{resident.showTitle}</div>
                        <p className="text-white/70 text-sm mb-3">{resident.bio}</p>
                        <div className="flex items-center space-x-2 text-white/60 text-xs mb-2">
                          <Calendar className="w-3 h-3" />
                          <span>{resident.schedule}</span>
                        </div>
                        <div className="flex gap-1">
                          {resident.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs border-white/20 text-white/80">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Community Picks */}
          <TabsContent value="community" className="mt-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2">COMMUNITY PICKS</h2>
              <p className="text-white/70 text-sm">
                Listener-submitted shows and sets voted on by the community.
              </p>
            </div>
            
            <div className="space-y-4">
              {communityPicks.map((pick) => (
                <Card key={pick.id} className="bg-black/40 border-white/10 hover:bg-black/60 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1">{pick.title}</h3>
                        <p className="text-white/70 text-sm mb-2">{pick.description}</p>
                        <div className="flex items-center space-x-4 text-white/60 text-xs">
                          <span>Submitted by @{pick.submittedBy}</span>
                          <span>{pick.date}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex gap-1">
                          {pick.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs border-white/20 text-white/80">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="ghost" className="p-2">
                            <Heart className="w-4 h-4" />
                          </Button>
                          <span className="text-white/60 text-sm">{pick.votes}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Archive */}
          <TabsContent value="archive" className="mt-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2">ARCHIVE</h2>
              <p className="text-white/70 text-sm">
                Explore our complete catalog of shows, mixes, and special broadcasts.
              </p>
            </div>
            
            <Card className="bg-black/40 border-white/10">
              <CardContent className="p-8 text-center">
                <Archive className="w-16 h-16 text-white/40 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Archive Coming Soon</h3>
                <p className="text-white/60 text-sm">
                  We're building a comprehensive archive of all our shows and mixes.
                  Check back soon for the complete collection.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}