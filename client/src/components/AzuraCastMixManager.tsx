import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, Calendar, Clock, CheckCircle, AlertCircle, Radio, List } from 'lucide-react';

export default function AzuraCastMixManager() {
  const [step, setStep] = useState(1); // 1: Upload, 2: Publish, 3: Schedule
  const [uploadedFile, setUploadedFile] = useState<string>('');
  const [showSlug, setShowSlug] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customFilename, setCustomFilename] = useState('');
  
  // Schedule form data
  const [scheduleData, setScheduleData] = useState({
    days: [] as string[],
    startTime: '',
    endTime: '',
    loopOnce: true
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch('/api/mix/upload', {
        method: 'POST',
        body: data
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (result) => {
      setUploadedFile(result.filename);
      setStep(2);
    }
  });

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: async (data: { show_slug: string; filenames: string[] }) => {
      const response = await fetch('/api/mix/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Publish failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setStep(3);
    }
  });

  // Schedule mutation
  const scheduleMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/mix/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Schedule failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      alert('Mix scheduled successfully!');
      // Reset form
      setStep(1);
      setUploadedFile('');
      setShowSlug('');
      setSelectedFile(null);
      setCustomFilename('');
      setScheduleData({ days: [], startTime: '', endTime: '', loopOnce: true });
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-generate filename
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      setCustomFilename(baseName.replace(/\s+/g, '_'));
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (customFilename) {
      formData.append('final_filename', customFilename + '.mp3');
    }

    uploadMutation.mutate(formData);
  };

  const handlePublish = () => {
    if (!uploadedFile || !showSlug) return;

    publishMutation.mutate({
      show_slug: showSlug,
      filenames: [uploadedFile]
    });
  };

  const handleSchedule = () => {
    if (!showSlug || scheduleData.days.length === 0 || !scheduleData.startTime || !scheduleData.endTime) return;

    scheduleMutation.mutate({
      show_slug: showSlug,
      days: scheduleData.days,
      start: scheduleData.startTime,
      end: scheduleData.endTime,
      loopOnce: scheduleData.loopOnce
    });
  };

  const toggleDay = (day: string) => {
    setScheduleData(prev => ({
      ...prev,
      days: prev.days.includes(day) 
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-8 mb-8">
        {[1, 2, 3].map((stepNum) => (
          <div key={stepNum} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step >= stepNum ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {stepNum}
            </div>
            <span className={`ml-2 text-sm ${
              step >= stepNum ? 'text-red-500 font-medium' : 'text-gray-600'
            }`}>
              {stepNum === 1 ? 'Upload' : stepNum === 2 ? 'Publish' : 'Schedule'}
            </span>
            {stepNum < 3 && <div className="w-16 h-0.5 bg-gray-300 ml-4" />}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-red-500" />
              Upload Mix to AzuraCast
            </CardTitle>
            <CardDescription>
              Upload audio file directly to AzuraCast media library
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mixFile">Audio File</Label>
              <Input
                id="mixFile"
                type="file"
                accept="audio/*,.mp3,.wav,.flac"
                onChange={handleFileSelect}
                disabled={uploadMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filename">Custom Filename</Label>
              <Input
                id="filename"
                value={customFilename}
                onChange={(e) => setCustomFilename(e.target.value)}
                placeholder="artist_track_name"
                disabled={uploadMutation.isPending}
              />
            </div>

            <Button 
              onClick={handleUpload}
              disabled={!selectedFile || uploadMutation.isPending}
              className="w-full"
            >
              {uploadMutation.isPending ? 'Uploading...' : 'Upload to AzuraCast'}
            </Button>

            {uploadMutation.isError && (
              <div className="text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                {uploadMutation.error?.message}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Publish to Playlist */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List className="w-5 h-5 text-red-500" />
              Publish to Playlist
            </CardTitle>
            <CardDescription>
              Add uploaded file to a show playlist for rotation
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="bg-green-50 p-3 rounded-lg text-sm text-green-700">
              <CheckCircle className="w-4 h-4 inline mr-2" />
              File uploaded: {uploadedFile}
            </div>

            <div className="space-y-2">
              <Label htmlFor="showSlug">Show Slug</Label>
              <Select value={showSlug} onValueChange={setShowSlug}>
                <SelectTrigger>
                  <SelectValue placeholder="Select show" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shadazz">Shadazz</SelectItem>
                  <SelectItem value="enamorado">Enamorado</SelectItem>
                  <SelectItem value="friday_night">Friday Night</SelectItem>
                  <SelectItem value="general_rotation">General Rotation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handlePublish}
              disabled={!showSlug || publishMutation.isPending}
              className="w-full"
            >
              {publishMutation.isPending ? 'Publishing...' : 'Add to Playlist'}
            </Button>

            {publishMutation.isError && (
              <div className="text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                {publishMutation.error?.message}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Schedule */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-red-500" />
              Schedule Playlist
            </CardTitle>
            <CardDescription>
              Set when this playlist should play on air
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="bg-green-50 p-3 rounded-lg text-sm text-green-700">
              <CheckCircle className="w-4 h-4 inline mr-2" />
              Added to playlist: show__{showSlug}
            </div>

            <div className="space-y-2">
              <Label>Days of Week</Label>
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day) => (
                  <div key={day} className="flex items-center space-x-2">
                    <Checkbox
                      id={day}
                      checked={scheduleData.days.includes(day)}
                      onCheckedChange={() => toggleDay(day)}
                    />
                    <Label htmlFor={day} className="text-xs capitalize">
                      {day.slice(0, 3)}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={scheduleData.startTime}
                  onChange={(e) => setScheduleData(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={scheduleData.endTime}
                  onChange={(e) => setScheduleData(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="loopOnce"
                checked={scheduleData.loopOnce}
                onCheckedChange={(checked) => setScheduleData(prev => ({ ...prev, loopOnce: !!checked }))}
              />
              <Label htmlFor="loopOnce">Loop once (don't repeat playlist)</Label>
            </div>

            <Button 
              onClick={handleSchedule}
              disabled={scheduleMutation.isPending || scheduleData.days.length === 0 || !scheduleData.startTime || !scheduleData.endTime}
              className="w-full"
            >
              {scheduleMutation.isPending ? 'Scheduling...' : 'Create Schedule'}
            </Button>

            {scheduleMutation.isError && (
              <div className="text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                {scheduleMutation.error?.message}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}