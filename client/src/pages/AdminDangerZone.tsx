import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  Trash2, 
  Database, 
  RefreshCw, 
  Shield,
  Users,
  Music
} from "lucide-react";
import { Link } from "wouter";
import AdminShell from "@/components/admin/AdminShell";

interface AdminDangerZoneProps {
  onLogout: () => void;
  currentUser?: string;
  userRole?: 'admin' | 'editor';
}

export default function AdminDangerZone({ 
  onLogout, 
  currentUser = "admin",
  userRole = "admin"
}: AdminDangerZoneProps) {
  const [confirmationText, setConfirmationText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const clearPendingMixesMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/admin/danger/clear-pending-mixes', {});
      return res.json() as Promise<{ deletedCount?: number }>;
    },
    onSuccess: (data) => {
      toast({
        title: "Pending Mixes Cleared",
        description: `${data.deletedCount || 0} pending submissions have been removed.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      setConfirmationText("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to clear pending mixes",
        variant: "destructive"
      });
    }
  });

  const clearSessionsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/admin/danger/clear-sessions', {});
    },
    onSuccess: () => {
      toast({
        title: "Sessions Cleared",
        description: "All user sessions have been invalidated.",
      });
      setConfirmationText("");
      setTimeout(() => {
        window.location.href = '/admin';
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to clear sessions",
        variant: "destructive"
      });
    }
  });

  const resetApprovalsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/admin/danger/reset-approvals', {});
      return res.json() as Promise<{ resetCount?: number }>;
    },
    onSuccess: (data) => {
      toast({
        title: "Approvals Reset",
        description: `${data.resetCount || 0} submissions reset to pending status.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      setConfirmationText("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset approvals",
        variant: "destructive"
      });
    }
  });

  const emergencyResetMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/admin/danger/emergency-reset', {});
    },
    onSuccess: () => {
      toast({
        title: "Emergency Reset Complete",
        description: "System has been reset to default state. You will be redirected to login.",
      });
      setConfirmationText("");
      setTimeout(() => {
        window.location.href = '/admin';
      }, 3000);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Emergency reset failed",
        variant: "destructive"
      });
    }
  });

  const handleConfirmedAction = (action: () => void, requiredText: string) => {
    if (confirmationText.toLowerCase() !== requiredText.toLowerCase()) {
      toast({
        title: "Confirmation Required",
        description: `You must type "${requiredText}" to confirm this action.`,
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);
    action();
    setTimeout(() => setIsProcessing(false), 1000);
  };

  return (
    <AdminShell
      title="Danger Zone"
      subtitle="Critical system operations - use with caution"
      breadcrumbs={[{ label: "Danger Zone" }]}
      currentUser={currentUser}
      userRole={userRole}
      onLogout={onLogout}
    >
      <div className="max-w-4xl">
        <Alert className="mb-8 border-red-200 bg-red-50">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>WARNING:</strong> These operations are irreversible and can cause data loss. 
            Always create a backup before performing any destructive action.
            <Link href="/admin/backups" className="ml-2 text-red-600 hover:underline">
              → Create Backup Now
            </Link>
          </AlertDescription>
        </Alert>

        <div className="grid gap-6">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <Music className="w-5 h-5" />
                Clear Pending Mix Submissions
                <Badge variant="secondary">Moderate Risk</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Remove all mix submissions with "pending" status. This will permanently delete 
                submissions that have not been reviewed yet.
              </p>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="border-orange-300 text-orange-600 hover:bg-orange-50"
                    data-testid="button-clear-pending-mixes"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear Pending Mixes
                  </Button>
                </AlertDialogTrigger>
                
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear Pending Mix Submissions</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all pending mix submissions. This action cannot be undone.
                      <br /><br />
                      Type <strong>DELETE PENDING</strong> to confirm:
                      <Input
                        value={confirmationText}
                        onChange={(e) => setConfirmationText(e.target.value)}
                        placeholder="DELETE PENDING"
                        className="mt-2"
                        data-testid="input-confirm-delete-pending"
                      />
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setConfirmationText("")}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleConfirmedAction(() => clearPendingMixesMutation.mutate(), "DELETE PENDING")}
                      className="bg-orange-600 hover:bg-orange-700"
                      disabled={isProcessing || clearPendingMixesMutation.isPending}
                      data-testid="button-confirm-delete-pending"
                    >
                      {clearPendingMixesMutation.isPending ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-2" />
                      )}
                      Clear Pending Mixes
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <RefreshCw className="w-5 h-5" />
                Reset Mix Approval Status
                <Badge variant="secondary">Moderate Risk</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Reset all approved and featured mixes back to "pending" status. 
                This will require re-reviewing all submissions.
              </p>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="border-orange-300 text-orange-600 hover:bg-orange-50"
                    data-testid="button-reset-approvals"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset Approvals
                  </Button>
                </AlertDialogTrigger>
                
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset Mix Approval Status</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will reset all approved and featured mixes to pending status.
                      <br /><br />
                      Type <strong>RESET APPROVALS</strong> to confirm:
                      <Input
                        value={confirmationText}
                        onChange={(e) => setConfirmationText(e.target.value)}
                        placeholder="RESET APPROVALS"
                        className="mt-2"
                        data-testid="input-confirm-reset-approvals"
                      />
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setConfirmationText("")}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleConfirmedAction(() => resetApprovalsMutation.mutate(), "RESET APPROVALS")}
                      className="bg-orange-600 hover:bg-orange-700"
                      disabled={isProcessing || resetApprovalsMutation.isPending}
                      data-testid="button-confirm-reset-approvals"
                    >
                      {resetApprovalsMutation.isPending ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      Reset Approvals
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Users className="w-5 h-5" />
                Clear All User Sessions
                <Badge variant="destructive">High Risk</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Invalidate all user sessions, forcing everyone including yourself to log back in. 
                Use this if you suspect compromised sessions.
              </p>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="border-red-300 text-red-600 hover:bg-red-50"
                    data-testid="button-clear-sessions"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Clear Sessions
                  </Button>
                </AlertDialogTrigger>
                
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear All User Sessions</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will log out all users including yourself. You will need to log back in.
                      <br /><br />
                      Type <strong>CLEAR SESSIONS</strong> to confirm:
                      <Input
                        value={confirmationText}
                        onChange={(e) => setConfirmationText(e.target.value)}
                        placeholder="CLEAR SESSIONS"
                        className="mt-2"
                        data-testid="input-confirm-clear-sessions"
                      />
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setConfirmationText("")}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleConfirmedAction(() => clearSessionsMutation.mutate(), "CLEAR SESSIONS")}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={isProcessing || clearSessionsMutation.isPending}
                      data-testid="button-confirm-clear-sessions"
                    >
                      {clearSessionsMutation.isPending ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Users className="w-4 h-4 mr-2" />
                      )}
                      Clear Sessions
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <Database className="w-5 h-5" />
                Emergency System Reset
                <Badge variant="destructive">EXTREME RISK</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700 mb-4 font-semibold">
                ⚠️ NUCLEAR OPTION: Reset the entire system to default state. 
                This will delete ALL user data, mixes, submissions, and settings.
                Only use in extreme circumstances.
              </p>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700"
                    data-testid="button-emergency-reset"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Emergency Reset
                  </Button>
                </AlertDialogTrigger>
                
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-red-600">⚠️ EMERGENCY SYSTEM RESET</AlertDialogTitle>
                    <AlertDialogDescription>
                      <strong className="text-red-600">THIS WILL DELETE EVERYTHING!</strong>
                      <br />
                      All mixes, submissions, episodes, guides, and user data will be permanently destroyed.
                      <br /><br />
                      Type <strong>NUCLEAR RESET</strong> to confirm this destructive action:
                      <Input
                        value={confirmationText}
                        onChange={(e) => setConfirmationText(e.target.value)}
                        placeholder="NUCLEAR RESET"
                        className="mt-2 border-red-300"
                        data-testid="input-confirm-emergency-reset"
                      />
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setConfirmationText("")}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleConfirmedAction(() => emergencyResetMutation.mutate(), "NUCLEAR RESET")}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={isProcessing || emergencyResetMutation.isPending}
                      data-testid="button-confirm-emergency-reset"
                    >
                      {emergencyResetMutation.isPending ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Database className="w-4 h-4 mr-2" />
                      )}
                      RESET SYSTEM
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>

        <Alert className="mt-8 border-blue-200 bg-blue-50">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Safety Reminder:</strong> Always verify you have recent backups before performing any destructive operations. 
            The backup system can restore your data if something goes wrong.
            <Link href="/admin/backups" className="ml-2 text-blue-600 hover:underline">
              → Manage Backups
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    </AdminShell>
  );
}
