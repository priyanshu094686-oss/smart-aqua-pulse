import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: LucideIcon;
  status?: "good" | "warning" | "critical";
  trend?: number;
}

const MetricCard = ({ title, value, unit, icon: Icon, status = "good", trend }: MetricCardProps) => {
  const statusColors = {
    good: "text-success",
    warning: "text-warning",
    critical: "text-destructive",
  };

  return (
    <Card className="glass-card p-6 hover:scale-[1.02] transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        {trend !== undefined && (
          <div className={`text-sm font-medium ${trend >= 0 ? 'text-success' : 'text-destructive'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-bold ${statusColors[status]}`}>
            {value}
          </span>
          <span className="text-muted-foreground text-sm">{unit}</span>
        </div>
      </div>
    </Card>
  );
};

export default MetricCard;
