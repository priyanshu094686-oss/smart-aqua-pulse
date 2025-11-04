import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface StatusIndicatorProps {
  title: string;
  percentage: number;
  status: "good" | "warning" | "critical";
  description?: string;
}

const StatusIndicator = ({ title, percentage, status, description }: StatusIndicatorProps) => {
  const statusConfig = {
    good: { color: "bg-success", text: "Excellent" },
    warning: { color: "bg-warning", text: "Needs Attention" },
    critical: { color: "bg-destructive", text: "Replace Soon" },
  };

  const config = statusConfig[status];

  return (
    <Card className="glass-card p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <span className={`text-sm font-medium ${status === 'good' ? 'text-success' : status === 'warning' ? 'text-warning' : 'text-destructive'}`}>
            {config.text}
          </span>
        </div>
        <div className="space-y-2">
          <Progress value={percentage} className="h-3" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{percentage}% remaining</span>
            {description && <span className="text-muted-foreground">{description}</span>}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default StatusIndicator;
