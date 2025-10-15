import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HelpCircle, Copy, Server, Radio } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StreamingGuideProps {
  credentials: {
    azuracastUsername: string;
    azuracastPassword: string;
    mountPoint: string;
  };
}

export default function StreamingGuide({ credentials }: StreamingGuideProps) {
  const { toast } = useToast();
  const serverUrl = import.meta.env.VITE_AZURACAST_URL || 'your-azuracast-server.com';
  const serverPort = '8000'; // Default Icecast port

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard.`,
    });
  };

  const ConfigValue = ({ label, value, onCopy }: { label: string; value: string; onCopy?: () => void }) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <code className="text-sm text-gray-900">{value}</code>
      </div>
      {onCopy && (
        <Button size="sm" variant="ghost" onClick={onCopy}>
          <Copy className="w-4 h-4" />
        </Button>
      )}
    </div>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-streaming-guide">
          <HelpCircle className="w-4 h-4 mr-2" />
          Streaming Setup Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Radio className="w-5 h-5" />
            Streaming Software Setup Guide
          </DialogTitle>
          <DialogDescription>
            Follow these step-by-step instructions to connect your streaming software to the radio station.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="butt" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="butt">BUTT (Broadcast Using This Tool)</TabsTrigger>
            <TabsTrigger value="mixxx">Mixxx DJ Software</TabsTrigger>
          </TabsList>

          <TabsContent value="butt" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Step 1: Download BUTT</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Download BUTT from{' '}
                  <a href="https://sourceforge.net/projects/butt/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    sourceforge.net/projects/butt
                  </a>
                </p>
                <p className="text-sm text-gray-600">Available for Windows, macOS, and Linux.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Step 2: Configure Server Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">Open BUTT and go to Settings → Main</p>
                
                <ConfigValue 
                  label="Server Type" 
                  value="Icecast" 
                />
                <ConfigValue 
                  label="Address" 
                  value={serverUrl}
                  onCopy={() => copyToClipboard(serverUrl, 'Server address')}
                />
                <ConfigValue 
                  label="Port" 
                  value={serverPort}
                  onCopy={() => copyToClipboard(serverPort, 'Port')}
                />
                <ConfigValue 
                  label="Password" 
                  value={credentials.azuracastPassword}
                  onCopy={() => copyToClipboard(credentials.azuracastPassword, 'Password')}
                />
                <ConfigValue 
                  label="Mount Point" 
                  value={credentials.mountPoint}
                  onCopy={() => copyToClipboard(credentials.mountPoint, 'Mount point')}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Step 3: Audio Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">Recommended settings for high-quality streaming:</p>
                <ConfigValue label="Codec" value="MP3" />
                <ConfigValue label="Bitrate" value="192 kbps (or 320 kbps for highest quality)" />
                <ConfigValue label="Sample Rate" value="44100 Hz" />
                <ConfigValue label="Channels" value="Stereo (2)" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Step 4: Go Live!</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                  <li>Click the "Play" button in BUTT to connect to the server</li>
                  <li>Click "Go Live" in your resident dashboard (on this page)</li>
                  <li>Start playing your music!</li>
                  <li>When finished, click "Go Offline" in your dashboard, then stop BUTT</li>
                </ol>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mixxx" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Step 1: Download Mixxx</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Download Mixxx from{' '}
                  <a href="https://mixxx.org/download/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    mixxx.org/download
                  </a>
                </p>
                <p className="text-sm text-gray-600">Free and open-source DJ software for Windows, macOS, and Linux.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Step 2: Enable Live Broadcasting</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">Open Mixxx and go to Preferences → Live Broadcasting</p>
                <p className="text-sm text-gray-600">Click "Create new connection" and enter these details:</p>
                
                <ConfigValue 
                  label="Type" 
                  value="Icecast 2" 
                />
                <ConfigValue 
                  label="Host" 
                  value={serverUrl}
                  onCopy={() => copyToClipboard(serverUrl, 'Host')}
                />
                <ConfigValue 
                  label="Port" 
                  value={serverPort}
                  onCopy={() => copyToClipboard(serverPort, 'Port')}
                />
                <ConfigValue 
                  label="Login (Username)" 
                  value="source"
                />
                <ConfigValue 
                  label="Password" 
                  value={credentials.azuracastPassword}
                  onCopy={() => copyToClipboard(credentials.azuracastPassword, 'Password')}
                />
                <ConfigValue 
                  label="Mount Point" 
                  value={credentials.mountPoint}
                  onCopy={() => copyToClipboard(credentials.mountPoint, 'Mount point')}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Step 3: Stream Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">Recommended encoding settings:</p>
                <ConfigValue label="Format" value="MP3" />
                <ConfigValue label="Bitrate" value="192 kbps (or 320 kbps)" />
                <ConfigValue label="Channels" value="Stereo" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Step 4: Start Streaming</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                  <li>Click "Enable Live Broadcasting" in Mixxx</li>
                  <li>Click "Go Live" in your resident dashboard (on this page)</li>
                  <li>Start your mix!</li>
                  <li>When done, disable broadcasting in Mixxx, then click "Go Offline" in your dashboard</li>
                </ol>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Server className="w-4 h-4" />
              Quick Reference
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="font-medium text-gray-700">Server:</p>
                <code className="text-xs">{serverUrl}:{serverPort}</code>
              </div>
              <div>
                <p className="font-medium text-gray-700">Mount Point:</p>
                <code className="text-xs">{credentials.mountPoint}</code>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
