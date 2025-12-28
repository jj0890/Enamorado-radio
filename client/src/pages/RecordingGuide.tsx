import { Link } from 'wouter';
import { ArrowLeft, Download, Mic, Upload, Settings, FileAudio, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export default function RecordingGuide() {
  return (
    <div className="min-h-screen bg-[#FEFCF9]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 h-16">
            <Link href="/resident">
              <Button variant="ghost" size="sm" data-testid="button-back">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-mono mb-3 text-navy">
            RECORDING GUIDE
          </h1>
          <p className="text-lg text-gray-600">
            Step-by-step guide to recording and producing radio-ready episodes using Audacity
          </p>
        </div>

        {/* Quick Links */}
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <Download className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Download Audacity & Visual Guides</AlertTitle>
          <AlertDescription className="text-blue-700">
            Free, open-source audio editor for Windows, macOS, and Linux.{' '}
            <a 
              href="https://www.audacityteam.org/download/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline font-medium"
            >
              Download here →
            </a>
            <br/>
            <span className="text-xs mt-1 block">
              📸 Visual screenshots referenced in this guide are from the{' '}
              <a 
                href="https://manual.audacityteam.org/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline font-medium"
              >
                Official Audacity Manual
              </a>
              {' '}(CC BY 3.0)
            </span>
          </AlertDescription>
        </Alert>

        {/* Table of Contents */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Quick Navigation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <a href="#setup" className="text-sm text-blue-600 hover:underline">1. Initial Setup</a>
              <a href="#recording" className="text-sm text-blue-600 hover:underline">2. Recording Audio</a>
              <a href="#editing" className="text-sm text-blue-600 hover:underline">3. Editing & Mixing</a>
              <a href="#export" className="text-sm text-blue-600 hover:underline">4. Export Settings</a>
              <a href="#tips" className="text-sm text-blue-600 hover:underline">5. Best Practices</a>
              <a href="#troubleshooting" className="text-sm text-blue-600 hover:underline">6. Troubleshooting</a>
            </div>
          </CardContent>
        </Card>

        {/* Section 1: Initial Setup */}
        <div id="setup" className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-navy text-white rounded-full flex items-center justify-center font-bold">1</div>
            <h2 className="text-2xl font-bold font-mono">Initial Setup</h2>
          </div>
          
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg">Configure Audio Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-medium mb-2">1. Select Your Microphone</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Go to <Badge variant="outline">Edit → Preferences → Devices</Badge>
                </p>
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 my-3">
                  <p className="text-center text-sm">
                    📸 <strong>Visual Reference:</strong> Audacity Preferences → Devices<br/>
                    <a 
                      href="https://manual.audacityteam.org/man/tutorial_selecting_your_recording_device.html" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-xs"
                    >
                      View official screenshot showing device selection →
                    </a>
                  </p>
                </div>
                <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                  <li>Recording Device: Choose your microphone from the dropdown</li>
                  <li>Channels: Select "1 (Mono)" for voice recording</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">2. Set Quality Settings</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Go to <Badge variant="outline">Edit → Preferences → Quality</Badge>
                </p>
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 my-3">
                  <p className="text-center text-sm">
                    📸 <strong>Visual Reference:</strong> Audacity Preferences → Quality<br/>
                    <a 
                      href="https://manual.audacityteam.org/man/tutorial_audacity_settings_for_recording.html" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-xs"
                    >
                      View official screenshot showing quality settings →
                    </a>
                  </p>
                </div>
                <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                  <li>Default Sample Rate: 44100 Hz (CD quality)</li>
                  <li>Default Sample Format: 32-bit float</li>
                </ul>
              </div>

              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Pro Tip:</strong> Always do a 10-second test recording to verify your microphone level before starting your full episode.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>

        {/* Section 2: Recording Audio */}
        <div id="recording" className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-navy text-white rounded-full flex items-center justify-center font-bold">2</div>
            <h2 className="text-2xl font-bold font-mono">Recording Audio</h2>
          </div>
          
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg">Recording Your Voice</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-medium mb-2">Basic Recording</h4>
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 my-3">
                  <p className="text-center text-sm">
                    📸 <strong>Visual Reference:</strong> Audacity main interface & recording<br/>
                    <a 
                      href="https://manual.audacityteam.org/man/recording.html" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-xs"
                    >
                      View official screenshot showing recording interface →
                    </a>
                  </p>
                </div>
                <ol className="text-sm text-gray-600 list-decimal list-inside space-y-2">
                  <li>Click the red <strong>Record button</strong> (●) or press <Badge variant="outline">R</Badge></li>
                  <li>Speak into your microphone - watch the recording meter to ensure levels are good</li>
                  <li>Click <strong>Stop</strong> (■) or press <Badge variant="outline">Spacebar</Badge> when finished</li>
                </ol>
              </div>

              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertTitle className="text-yellow-800">Microphone Levels</AlertTitle>
                <AlertDescription className="text-yellow-700 text-sm">
                  Your audio should peak around <strong>-12 dB to -6 dB</strong>. If the waveform is too small (quiet) or hitting 0 dB (clipping), adjust your microphone input level in your system settings.
                </AlertDescription>
              </Alert>

              <div>
                <h4 className="font-medium mb-2">Recording Music/Audio Files</h4>
                <ol className="text-sm text-gray-600 list-decimal list-inside space-y-2">
                  <li>Go to <Badge variant="outline">File → Import → Audio</Badge></li>
                  <li>Select your music file (MP3, WAV, etc.)</li>
                  <li>The music will appear as a new track below your voice recording</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section 3: Editing & Mixing */}
        <div id="editing" className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-navy text-white rounded-full flex items-center justify-center font-bold">3</div>
            <h2 className="text-2xl font-bold font-mono">Editing & Mixing</h2>
          </div>
          
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg">Essential Editing Techniques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Trimming & Cutting</h4>
                <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                  <li><strong>Select Tool:</strong> Click and drag to select a portion of audio</li>
                  <li><strong>Delete:</strong> Press <Badge variant="outline">Delete</Badge> or <Badge variant="outline">Backspace</Badge> to remove selected audio</li>
                  <li><strong>Cut:</strong> <Badge variant="outline">Ctrl+X</Badge> (Windows) or <Badge variant="outline">Cmd+X</Badge> (Mac)</li>
                  <li><strong>Trim:</strong> Select the part you want to keep, then <Badge variant="outline">Ctrl+T</Badge> to trim</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Mixing Voice & Music</h4>
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 my-3">
                  <p className="text-center text-sm">
                    📸 <strong>Visual Reference:</strong> Multi-track project view<br/>
                    <a 
                      href="https://manual.audacityteam.org/man/basic_recording_editing_and_exporting.html" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-xs"
                    >
                      View official screenshot showing multi-track editing →
                    </a>
                  </p>
                </div>
                <ol className="text-sm text-gray-600 list-decimal list-inside space-y-2">
                  <li>Import your music track under your voice recording</li>
                  <li>Use the <strong>-/+</strong> volume slider on the left of each track to balance levels</li>
                  <li>Music should be quieter than voice - typically <strong>-15 dB to -20 dB</strong> lower</li>
                  <li>Use the <strong>Envelope Tool</strong> (top toolbar) to fade music in/out smoothly</li>
                </ol>
              </div>

              <div>
                <h4 className="font-medium mb-2">Adding Fades</h4>
                <ol className="text-sm text-gray-600 list-decimal list-inside space-y-2">
                  <li>Select the beginning of your track for fade-in or the end for fade-out</li>
                  <li>Go to <Badge variant="outline">Effect → Fade In</Badge> or <Badge variant="outline">Fade Out</Badge></li>
                  <li>Recommended fade duration: 2-3 seconds for music</li>
                </ol>
              </div>

              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Quick Tip:</strong> Press <Badge variant="outline">Ctrl+Z</Badge> (Undo) if you make a mistake. Audacity has unlimited undo!
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>

        {/* Section 4: Export Settings */}
        <div id="export" className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-navy text-white rounded-full flex items-center justify-center font-bold">4</div>
            <h2 className="text-2xl font-bold font-mono">Export Settings (IMPORTANT)</h2>
          </div>
          
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileAudio className="w-5 h-5" />
                Radio-Ready MP3 Export
              </CardTitle>
              <CardDescription>
                Follow these exact settings to ensure your episode is broadcast-ready
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-800">Required Export Format</AlertTitle>
                <AlertDescription className="text-red-700 text-sm">
                  Episodes must be exported as <strong>MP3</strong> files with specific settings for radio broadcasting.
                </AlertDescription>
              </Alert>

              <div>
                <h4 className="font-medium mb-2">Export Steps</h4>
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 my-3">
                  <p className="text-center text-sm">
                    📸 <strong>Visual Reference:</strong> Export as MP3 dialog<br/>
                    <a 
                      href="https://manual.audacityteam.org/man/mp3_export_options.html" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-xs"
                    >
                      View official screenshot showing MP3 export settings →
                    </a>
                  </p>
                </div>
                <ol className="text-sm text-gray-600 list-decimal list-inside space-y-2">
                  <li>Go to <Badge variant="outline">File → Export → Export as MP3</Badge></li>
                  <li>Choose a filename (e.g., "Episode-01-Intro-to-Jazz.mp3")</li>
                  <li>Click <strong>Options</strong> or configure the settings below:</li>
                </ol>
              </div>

              <div className="bg-gray-100 p-4 rounded-lg border-2 border-gray-300">
                <h4 className="font-bold mb-3 text-center">📋 REQUIRED EXPORT SETTINGS</h4>
                <div className="space-y-2 font-mono text-sm">
                  <div className="flex justify-between border-b border-gray-300 pb-1">
                    <span className="font-medium">Format:</span>
                    <span className="text-red-600 font-bold">MP3</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-300 pb-1">
                    <span className="font-medium">Bit Rate Mode:</span>
                    <span className="text-red-600 font-bold">Constant</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-300 pb-1">
                    <span className="font-medium">Quality:</span>
                    <span className="text-red-600 font-bold">192 kbps</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-300 pb-1">
                    <span className="font-medium">Channel Mode:</span>
                    <span className="text-red-600 font-bold">Stereo</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Sample Rate:</span>
                    <span className="text-red-600 font-bold">44100 Hz</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Metadata (Optional but Recommended)</h4>
                <p className="text-sm text-gray-600 mb-2">
                  After clicking Export, Audacity will ask for metadata tags:
                </p>
                <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                  <li><strong>Track Title:</strong> Your episode title</li>
                  <li><strong>Artist Name:</strong> Your resident name</li>
                  <li><strong>Album Title:</strong> Your show title (optional)</li>
                  <li><strong>Genre:</strong> The genre of your show</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section 5: Best Practices */}
        <div id="tips" className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-navy text-white rounded-full flex items-center justify-center font-bold">5</div>
            <h2 className="text-2xl font-bold font-mono">Best Practices</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  Recording Environment
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 space-y-2">
                <p><CheckCircle2 className="w-4 h-4 inline text-green-600 mr-1" />Record in a quiet room with minimal echo</p>
                <p><CheckCircle2 className="w-4 h-4 inline text-green-600 mr-1" />Use headphones to monitor your recording</p>
                <p><CheckCircle2 className="w-4 h-4 inline text-green-600 mr-1" />Turn off fans, AC, and notifications</p>
                <p><CheckCircle2 className="w-4 h-4 inline text-green-600 mr-1" />Position mic 6-8 inches from your mouth</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Audio Quality Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 space-y-2">
                <p><CheckCircle2 className="w-4 h-4 inline text-green-600 mr-1" />Keep voice levels between -12 dB and -6 dB</p>
                <p><CheckCircle2 className="w-4 h-4 inline text-green-600 mr-1" />Music should be 15-20 dB quieter than voice</p>
                <p><CheckCircle2 className="w-4 h-4 inline text-green-600 mr-1" />Save your project file (.aup3) before exporting</p>
                <p><CheckCircle2 className="w-4 h-4 inline text-green-600 mr-1" />Listen to your final MP3 before submitting</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">Recommended Episode Structure</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600">
              <ol className="list-decimal list-inside space-y-2">
                <li><strong>Intro (30-60 seconds):</strong> Welcome listeners, introduce yourself and the episode theme</li>
                <li><strong>Main Content (30-60 minutes):</strong> Music, commentary, storytelling - your creative space</li>
                <li><strong>Outro (30 seconds):</strong> Thank listeners, mention upcoming shows, sign off</li>
              </ol>
              <p className="mt-3 text-xs text-gray-500">
                <strong>Ideal Episode Length:</strong> 30-60 minutes (shorter is fine for your first episode!)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Section 6: Troubleshooting */}
        <div id="troubleshooting" className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-navy text-white rounded-full flex items-center justify-center font-bold">6</div>
            <h2 className="text-2xl font-bold font-mono">Troubleshooting</h2>
          </div>
          
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <h4 className="font-medium mb-2 text-red-600">Problem: Can't hear my recording</h4>
                <p className="text-sm text-gray-600">
                  <strong>Solution:</strong> Check that your system audio output is selected. Go to Audacity's audio device toolbar and ensure the correct playback device is selected.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2 text-red-600">Problem: Recording level is too quiet</h4>
                <p className="text-sm text-gray-600">
                  <strong>Solution:</strong> Increase your microphone input level in your system settings (not in Audacity). On Windows: Sound Settings → Input Device. On Mac: System Preferences → Sound → Input.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2 text-red-600">Problem: Audio sounds distorted or clipping</h4>
                <p className="text-sm text-gray-600">
                  <strong>Solution:</strong> Your recording level is too high. Reduce the microphone input level in your system settings. Waveforms should never touch 0 dB.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2 text-red-600">Problem: Music is too loud compared to voice</h4>
                <p className="text-sm text-gray-600">
                  <strong>Solution:</strong> Click on the music track and use the volume slider (-/+) on the left side to reduce the music volume. Music should be 15-20 dB quieter than voice.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2 text-red-600">Problem: Can't export as MP3</h4>
                <p className="text-sm text-gray-600">
                  <strong>Solution:</strong> On some systems, you may need to download the LAME MP3 encoder. Go to Edit → Preferences → Libraries and click "Download" next to MP3 Library.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <Card className="bg-gradient-to-br from-red-50 to-white border-red-200">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-bold">Ready to Record Your First Episode?</h3>
              <p className="text-gray-600">
                Follow this guide, take your time, and don't worry about perfection. Your unique voice and perspective are what matter most!
              </p>
              <Link href="/resident/submit-episode">
                <Button size="lg" className="w-full md:w-auto" data-testid="button-submit-episode-from-guide">
                  <Upload className="w-4 h-4 mr-2" />
                  Submit Your Episode
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
