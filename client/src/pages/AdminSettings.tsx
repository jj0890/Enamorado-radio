import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Save, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Settings as SettingsType } from '@shared/schema';
import AdminShell from '@/components/admin/AdminShell';

interface AdminSettingsProps {
  onLogout: () => void;
  currentUser?: string;
}

export default function AdminSettings({ onLogout, currentUser = "admin" }: AdminSettingsProps) {
  const { toast } = useToast();
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [stationId, setStationId] = useState('');

  const { data: settings = [], isLoading } = useQuery<SettingsType[]>({
    queryKey: ['/api/admin/settings'],
    refetchOnMount: true,
  });

  // Initialize form when settings load
  useEffect(() => {
    if (settings.length > 0) {
      const baseUrlSetting = settings.find(s => s.key === 'azuracast_base_url');
      const apiKeySetting = settings.find(s => s.key === 'azuracast_api_key');
      const stationIdSetting = settings.find(s => s.key === 'azuracast_station_id');
      
      if (baseUrlSetting) setBaseUrl(baseUrlSetting.value);
      if (apiKeySetting) setApiKey(apiKeySetting.value);
      if (stationIdSetting) setStationId(stationIdSetting.value);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: { key: string; value: string; description?: string; isSecret?: boolean }) => {
      return await apiRequest('POST', '/api/admin/settings', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      toast({
        title: "Settings Saved",
        description: "AzuraCast configuration has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to save settings.",
        variant: "destructive",
      });
    },
  });

  const handleSave = async () => {
    try {
      // Save all three settings
      await saveMutation.mutateAsync({
        key: 'azuracast_base_url',
        value: baseUrl,
        description: 'AzuraCast server base URL',
        isSecret: false,
      });

      await saveMutation.mutateAsync({
        key: 'azuracast_api_key',
        value: apiKey,
        description: 'AzuraCast API key for authentication',
        isSecret: true,
      });

      await saveMutation.mutateAsync({
        key: 'azuracast_station_id',
        value: stationId,
        description: 'AzuraCast station ID',
        isSecret: false,
      });
    } catch (error) {
      // Error already handled in mutation
    }
  };

  return (
    <AdminShell
      title="Settings"
      subtitle="Configure system settings"
      breadcrumbs={[{ label: "Settings" }]}
      currentUser={currentUser}
      userRole="admin"
      onLogout={onLogout}
    >
      <div className="max-w-4xl">
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle>AzuraCast API Configuration</CardTitle>
            <CardDescription>
              Enter your AzuraCast server details to enable automatic streamer account creation for residents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="baseUrl">Base URL*</Label>
                  <Input
                    id="baseUrl"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="http://your-azuracast-server.com"
                    data-testid="input-base-url"
                  />
                  <p className="text-sm text-gray-500">
                    The base URL of your AzuraCast server (e.g., http://24.199.109.18 or https://radio.example.com)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key*</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your AzuraCast API key"
                    data-testid="input-api-key"
                  />
                  <p className="text-sm text-gray-500">
                    Generate this in AzuraCast under Administration → API Keys. Requires permissions to create/manage streamers.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stationId">Station ID*</Label>
                  <Input
                    id="stationId"
                    value={stationId}
                    onChange={(e) => setStationId(e.target.value)}
                    placeholder="1"
                    data-testid="input-station-id"
                  />
                  <p className="text-sm text-gray-500">
                    The ID of your radio station in AzuraCast (usually 1 for the first station)
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">How to Get Your API Key</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                    <li>Log into your AzuraCast admin panel</li>
                    <li>Go to Administration → API Keys</li>
                    <li>Click "Add API Key"</li>
                    <li>Give it a name (e.g., "Resident Portal")</li>
                    <li>Enable permissions for managing streamers</li>
                    <li>Copy the generated API key and paste it above</li>
                  </ol>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-900 mb-2">What This Enables</h3>
                  <p className="text-sm text-yellow-800">
                    When configured, the system will automatically create AzuraCast streamer accounts when you create new residents. 
                    This saves you from manually creating accounts in AzuraCast for each DJ/resident.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleSave}
                    disabled={saveMutation.isPending || !baseUrl || !apiKey || !stationId}
                    className="flex-1"
                    data-testid="button-save-settings"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Configuration
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] })}
                    disabled={saveMutation.isPending}
                    data-testid="button-refresh"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6 bg-white border-gray-200">
          <CardHeader>
            <CardTitle>Current Configuration Status</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">
                <div className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200">
                  <span className="text-sm font-medium">Base URL:</span>
                  <span className="text-sm text-gray-600">{baseUrl || 'Not configured'}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200">
                  <span className="text-sm font-medium">API Key:</span>
                  <span className="text-sm text-gray-600">{apiKey ? '••••••••••••' : 'Not configured'}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200">
                  <span className="text-sm font-medium">Station ID:</span>
                  <span className="text-sm text-gray-600">{stationId || 'Not configured'}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200">
                  <span className="text-sm font-medium">Auto-Creation Status:</span>
                  <span className={`text-sm font-medium ${baseUrl && apiKey && stationId ? 'text-green-600' : 'text-red-600'}`}>
                    {baseUrl && apiKey && stationId ? '✅ Enabled' : '❌ Disabled'}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
