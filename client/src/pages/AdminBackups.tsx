import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  RefreshCw, 
  Download, 
  Upload, 
  Trash2, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Database,
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";

interface BackupInfo {
  id: string;
  timestamp: string;
  size: number;
  reason: string;
  fileCount: number;
}

export default function AdminBackups() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [backupReason, setBackupReason] = useState("");
  const [restoreConfirm, setRestoreConfirm] = useState<string | null>(null);

  const { data: backups = [], isLoading } = useQuery<BackupInfo[]>({
    queryKey: ['/api/admin/backups'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const createBackupMutation = useMutation({
    mutationFn: async (reason: string) => {
      return apiRequest('/api/admin/backups', 'POST', { reason });
    },
    onSuccess: () => {
      toast({
        title: "Backup Created",
        description: "System backup has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/backups'] });
      setBackupReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Backup Failed",
        description: error.message || "Failed to create backup.",
        variant: "destructive",
      });
    },
  });

  const restoreBackupMutation = useMutation({
    mutationFn: async (backupId: string) => {
      return apiRequest(`/api/admin/backups/${backupId}/restore`, 'POST', {});
    },
    onSuccess: () => {
      toast({
        title: "Restore Complete",
        description: "System has been restored from backup successfully. Data is immediately available.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/backups'] });
      setRestoreConfirm(null);
    },
    onError: (error: any) => {
      toast({
        title: "Restore Failed",
        description: error.message || "Failed to restore from backup.",
        variant: "destructive",
      });
    },
  });

  const deleteBackupMutation = useMutation({
    mutationFn: async (backupId: string) => {
      return apiRequest(`/api/admin/backups/${backupId}`, 'DELETE', {});
    },
    onSuccess: () => {
      toast({
        title: "Backup Deleted",
        description: "Backup has been permanently deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/backups'] });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete backup.",
        variant: "destructive",
      });
    },
  });

  const handleCreateBackup = () => {
    if (!backupReason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a reason for the backup.",
        variant: "destructive",
      });
      return;
    }
    createBackupMutation.mutate(backupReason.trim());
  };

  const handleRestore = (backupId: string) => {
    if (restoreConfirm === backupId) {
      restoreBackupMutation.mutate(backupId);
    } else {
      setRestoreConfirm(backupId);
    }
  };

  const formatFileSize = (bytes: number) => {
    const kb = bytes / 1024;
    return `${kb.toFixed(1)} KB`;
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-[#FEFCF9]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold font-mono text-red-500">BACKUP SYSTEM</h1>
              <p className="text-gray-600 font-mono">Manage system backups and restore points</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Create Backup */}
          <Card>
            <CardHeader>
              <CardTitle className="font-mono flex items-center">
                <Database className="w-5 h-5 mr-2 text-blue-500" />
                Create Backup
              </CardTitle>
              <CardDescription>
                Create a new backup of all system data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-mono mb-2">Backup Reason</label>
                <Textarea
                  value={backupReason}
                  onChange={(e) => setBackupReason(e.target.value)}
                  placeholder="e.g., Before major content update"
                  className="font-mono text-sm"
                  data-testid="input-backup-reason"
                />
              </div>
              
              <Button 
                onClick={handleCreateBackup}
                disabled={createBackupMutation.isPending}
                className="w-full font-mono"
                data-testid="button-create-backup"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${createBackupMutation.isPending ? 'animate-spin' : ''}`} />
                {createBackupMutation.isPending ? 'Creating...' : 'Create Backup'}
              </Button>
              
              <div className="text-xs text-gray-500 font-mono">
                Automatically backs up: mix submissions, song submissions, episodes, guides, and schedules
              </div>
            </CardContent>
          </Card>

          {/* Backup List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="font-mono flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-green-500" />
                  Available Backups ({backups.length})
                </CardTitle>
                <CardDescription>
                  Restore from previous backup points
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse h-16 bg-gray-100 rounded"></div>
                    ))}
                  </div>
                ) : backups.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 font-mono">No backups available</p>
                    <p className="text-sm text-gray-400 font-mono">Create your first backup to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {backups.map((backup) => (
                      <div key={backup.id} className="border border-gray-200 rounded-lg p-4 hover:border-red-300 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge variant="outline" className="font-mono text-xs">
                                ID: {backup.id.split('-').pop()}
                              </Badge>
                              <Badge variant="outline" className="font-mono text-xs">
                                {backup.fileCount} files
                              </Badge>
                              <Badge variant="outline" className="font-mono text-xs">
                                {formatFileSize(backup.size)}
                              </Badge>
                            </div>
                            
                            <p className="text-sm font-mono text-gray-900 mb-1">
                              {backup.reason}
                            </p>
                            
                            <p className="text-xs font-mono text-gray-500">
                              {formatDate(backup.timestamp)}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRestore(backup.id)}
                              disabled={restoreBackupMutation.isPending}
                              className={`font-mono ${
                                restoreConfirm === backup.id 
                                  ? 'bg-red-50 border-red-300 text-red-700' 
                                  : ''
                              }`}
                              data-testid={`button-restore-${backup.id.split('-').pop()}`}
                            >
                              <Upload className="w-4 h-4 mr-1" />
                              {restoreConfirm === backup.id ? 'Confirm Restore' : 'Restore'}
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteBackupMutation.mutate(backup.id)}
                              disabled={deleteBackupMutation.isPending}
                              className="font-mono text-red-600 hover:bg-red-50"
                              data-testid={`button-delete-${backup.id.split('-').pop()}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {restoreConfirm === backup.id && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm font-mono">
                            <AlertCircle className="w-4 h-4 inline mr-2 text-red-500" />
                            <strong>Warning:</strong> This will replace all current data with this backup. 
                            Current data will be backed up automatically before restore.
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}