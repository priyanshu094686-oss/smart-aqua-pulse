import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Info } from "lucide-react";

interface Alert {
  id: string;
  type: "info" | "success" | "warning" | "critical";
  message: string;
  timestamp: string;
}

interface AlertsPanelProps {
  alerts: Alert[];
}

const AlertsPanel = ({ alerts }: AlertsPanelProps) => {
  const getAlertConfig = (type: Alert["type"]) => {
    switch (type) {
      case "success":
        return { icon: CheckCircle, color: "text-success", bg: "bg-success/10" };
      case "warning":
        return { icon: AlertCircle, color: "text-warning", bg: "bg-warning/10" };
      case "critical":
        return { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10" };
      default:
        return { icon: Info, color: "text-primary", bg: "bg-primary/10" };
    }
  };

  return (
    <Card className="glass-card p-6">
      <h3 className="font-semibold mb-4 text-lg">System Alerts</h3>
      <div className="space-y-3">
        {alerts.map((alert) => {
          const config = getAlertConfig(alert.type);
          const Icon = config.icon;
          
          return (
            <div
              key={alert.id}
              className={`p-4 rounded-lg ${config.bg} border border-${config.color}/20 flex items-start gap-3`}
            >
              <Icon className={`w-5 h-5 ${config.color} mt-0.5`} />
              <div className="flex-1">
                <p className="text-sm">{alert.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{alert.timestamp}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default AlertsPanel;
