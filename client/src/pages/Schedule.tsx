import { Link } from 'wouter';
import { ArrowLeft, Radio } from 'lucide-react';

interface Show {
  id: number;
  title: string;
  time: string;
  description?: string;
}

interface DaySchedule {
  day: string;
  shows: Show[];
}

export default function Schedule() {
  const schedule: DaySchedule[] = [
    {
      day: 'Thursday',
      shows: [
        {
          id: 1,
          title: 'Resident Mix',
          time: '7 PM',
          description: 'Weekly curated mix from our resident DJs'
        },
        {
          id: 2,
          title: 'Ambient Hour',
          time: '8 PM',
          description: 'Atmospheric sounds and ambient textures'
        },
        {
          id: 3,
          title: 'Guest DJ',
          time: '9 PM',
          description: 'Special guest artists and live sets'
        }
      ]
    },
    {
      day: 'Friday',
      shows: [
        {
          id: 4,
          title: 'Artist Interview',
          time: '7 PM',
          description: 'In-depth conversations with local and touring musicians'
        },
        {
          id: 5,
          title: 'Jazz Hour',
          time: '8 PM',
          description: 'Classic and contemporary jazz selections'
        },
        {
          id: 6,
          title: 'Guest DJ',
          time: '9 PM',
          description: 'Special guest artists and live sets'
        }
      ]
    },
    {
      day: 'Saturday',
      shows: [
        {
          id: 7,
          title: 'Rewind Show',
          time: '7 PM',
          description: 'Celebrating music from past decades'
        }
      ]
    },
    {
      day: 'Sunday',
      shows: [
        {
          id: 8,
          title: 'Rewind Show',
          time: '7 PM',
          description: 'Celebrating music from past decades'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/" 
              className="flex items-center space-x-2 text-gray-600 hover:text-red-500 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-mono text-sm">Back to Home</span>
            </Link>
            
            <div className="text-center">
              <h1 className="text-3xl font-bold font-mono text-red-500 mb-2">WEEKLY SCHEDULE</h1>
              <p className="text-sm font-mono text-gray-600">
                BROADCASTS EVERY THURS – SUN 7 PM – 10 PM CDT
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-mono text-red-500">
                Now Live: Off Air
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Schedule Grid */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {schedule.map((daySchedule) => (
            <div key={daySchedule.day} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-red-500 text-white p-4">
                <h2 className="text-lg font-bold font-mono text-center">
                  {daySchedule.day.toUpperCase()}
                </h2>
              </div>
              
              <div className="p-4 space-y-4">
                {daySchedule.shows.map((show) => (
                  <div key={show.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Radio className="w-6 h-6 text-gray-400" />
                      </div>
                      <div>
                        <div className="text-sm font-mono text-red-500 font-medium">
                          {show.time}
                        </div>
                        <h3 className="font-mono font-bold text-gray-900">
                          {show.title}
                        </h3>
                      </div>
                    </div>
                    {show.description && (
                      <p className="text-sm font-mono text-gray-600 leading-relaxed">
                        {show.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Archive Link */}
        <div className="text-center mt-12">
          <Link 
            href="/episodes" 
            className="inline-block bg-gray-800 hover:bg-gray-900 text-white px-6 py-3 font-mono font-medium transition-colors rounded"
          >
            » View Episode Archive
          </Link>
        </div>
      </main>
    </div>
  );
}