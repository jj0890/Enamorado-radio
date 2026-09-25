import { Badge } from "@/components/ui/badge";
import { Check, X, Clock, Star } from "lucide-react";

interface StatusBadgeProps {
  status: "pending" | "approved" | "rejected" | string;
  featured?: boolean;
  promoted?: boolean;
  className?: string;
}

export default function StatusBadge({ status, featured, promoted, className = "" }: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "approved":
        return {
          variant: "default" as const,
          icon: <Check className="w-3 h-3" />,
          label: "Approved",
          color: "bg-green-600 text-white hover:bg-green-700"
        };
      case "rejected":
        return {
          variant: "destructive" as const,
          icon: <X className="w-3 h-3" />,
          label: "Rejected",
          color: "bg-red-600 text-white hover:bg-red-700"
        };
      case "pending":
        return {
          variant: "secondary" as const,
          icon: <Clock className="w-3 h-3" />,
          label: "Pending",
          color: "bg-yellow-600 text-white hover:bg-yellow-700"
        };
      default:
        return {
          variant: "outline" as const,
          icon: null,
          label: status,
          color: ""
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge 
        variant={config.variant} 
        className={`flex items-center gap-1 ${config.color}`}
        data-testid={`badge-status-${status}`}
      >
        {config.icon}
        <span>{config.label}</span>
      </Badge>
      
      {featured && (
        <Badge variant="secondary" className="bg-yellow-500 text-white hover:bg-yellow-600" data-testid="badge-featured">
          <Star className="w-3 h-3 mr-1" />
          Featured
        </Badge>
      )}
      
      {promoted && (
        <Badge variant="default" className="bg-orange-600 text-white hover:bg-orange-700" data-testid="badge-promoted">
          Editorial
        </Badge>
      )}
    </div>
  );
}
