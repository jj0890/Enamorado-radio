import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Music,
  Check,
  X,
  Star,
  Trash2,
  Upload,
  User,
  Radio,
  Calendar,
  Settings,
  Shield,
  FileText,
  Activity as ActivityIcon
} from "lucide-react";

export interface ActivityItem {
  id: number;
  type: 'mix_approved' | 'mix_rejected' | 'mix_featured' | 'mix_deleted' | 
        'episode_approved' | 'episode_rejected' | 'episode_uploaded' |
        'resident_created' | 'resident_updated' | 'resident_deleted' |
        'application_approved' | 'application_rejected' |
        'schedule_updated' | 'settings_changed' | 'login' | 'logout';
  description: string;
  actor: string;
  targetId?: string | number;
  targetName?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

const activityConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string }> = {
  mix_approved: { icon: Check, color: "text-green-600", bgColor: "bg-green-100" },
  mix_rejected: { icon: X, color: "text-red-600", bgColor: "bg-red-100" },
  mix_featured: { icon: Star, color: "text-purple-600", bgColor: "bg-purple-100" },
  mix_deleted: { icon: Trash2, color: "text-gray-600", bgColor: "bg-gray-100" },
  episode_approved: { icon: Check, color: "text-green-600", bgColor: "bg-green-100" },
  episode_rejected: { icon: X, color: "text-red-600", bgColor: "bg-red-100" },
  episode_uploaded: { icon: Upload, color: "text-blue-600", bgColor: "bg-blue-100" },
  resident_created: { icon: User, color: "text-navy", bgColor: "bg-blue-100" },
  resident_updated: { icon: User, color: "text-navy", bgColor: "bg-blue-100" },
  resident_deleted: { icon: Trash2, color: "text-gray-600", bgColor: "bg-gray-100" },
  application_approved: { icon: Check, color: "text-green-600", bgColor: "bg-green-100" },
  application_rejected: { icon: X, color: "text-red-600", bgColor: "bg-red-100" },
  schedule_updated: { icon: Calendar, color: "text-orange-600", bgColor: "bg-orange-100" },
  settings_changed: { icon: Settings, color: "text-gray-600", bgColor: "bg-gray-100" },
  login: { icon: Shield, color: "text-green-600", bgColor: "bg-green-100" },
  logout: { icon: Shield, color: "text-gray-600", bgColor: "bg-gray-100" },
};

interface ActivityFeedProps {
  activities?: ActivityItem[];
  maxItems?: number;
  showHeader?: boolean;
  className?: string;
}

export default function ActivityFeed({ 
  activities: providedActivities,
  maxItems = 10,
  showHeader = true,
  className = ""
}: ActivityFeedProps) {
  // If activities aren't provided, fetch from API
  const { data: fetchedActivities = [] } = useQuery<ActivityItem[]>({
    queryKey: ['/api/admin/activity'],
    enabled: !providedActivities,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const activities = providedActivities || fetchedActivities;
  const displayActivities = activities.slice(0, maxItems);

  if (displayActivities.length === 0) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
        {showHeader && (
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ActivityIcon className="w-5 h-5" />
            Recent Activity
          </h3>
        )}
        <div className="text-center py-8 text-gray-500">
          <ActivityIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No recent activity</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {showHeader && (
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ActivityIcon className="w-5 h-5" />
            Recent Activity
          </h3>
        </div>
      )}
      <ScrollArea className="h-[400px]">
        <div className="divide-y divide-gray-100">
          {displayActivities.map((activity) => {
            const config = activityConfig[activity.type] || { 
              icon: ActivityIcon, 
              color: "text-gray-600", 
              bgColor: "bg-gray-100" 
            };
            const Icon = config.icon;

            return (
              <div 
                key={activity.id}
                className="px-4 py-3 hover:bg-gray-50 transition-colors"
                data-testid={`activity-${activity.id}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{activity.actor}</span>
                      {' '}
                      <span className="text-gray-600">{activity.description}</span>
                      {activity.targetName && (
                        <span className="font-medium"> "{activity.targetName}"</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

// Simple activity items for when we don't have API yet
export const createActivityItem = (
  type: ActivityItem['type'],
  actor: string,
  targetName?: string
): Omit<ActivityItem, 'id' | 'createdAt'> => {
  const descriptions: Record<string, string> = {
    mix_approved: 'approved mix',
    mix_rejected: 'rejected mix',
    mix_featured: 'featured mix',
    mix_deleted: 'deleted mix',
    episode_approved: 'approved episode',
    episode_rejected: 'rejected episode',
    episode_uploaded: 'uploaded episode',
    resident_created: 'created resident',
    resident_updated: 'updated resident',
    resident_deleted: 'deleted resident',
    application_approved: 'approved application',
    application_rejected: 'rejected application',
    schedule_updated: 'updated schedule',
    settings_changed: 'changed settings',
    login: 'logged in',
    logout: 'logged out',
  };

  return {
    type,
    description: descriptions[type] || 'performed action',
    actor,
    targetName,
  };
};
