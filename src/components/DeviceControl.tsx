import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Power, Droplet } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface DeviceControlProps {
  deviceId: string;
}

const DeviceControl = ({ deviceId }: DeviceControlProps) => {
  const { toast } = useToast();
  const [pumpStatus, setPumpStatus] = useState(false);
  const [valveStatus, setValveStatus] = useState(true);

  const handlePumpToggle = (checked: boolean) => {
    setPumpStatus(checked);
    toast({
      title: checked ? "Pump Activated" : "Pump Deactivated",
      description: `Water pump has been ${checked ? 'turned on' : 'turned off'}`,
    });
  };

  const handleValveToggle = (checked: boolean) => {
    setValveStatus(checked);
    toast({
      title: checked ? "Valve Opened" : "Valve Closed",
      description: `Solenoid valve has been ${checked ? 'opened' : 'closed'}`,
    });
  };

  return (
    <Card className="glass-card p-6">
      <h3 className="font-semibold mb-6 text-lg">Device Control</h3>
      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/10 border border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Power className={`w-5 h-5 ${pumpStatus ? 'text-success' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <p className="font-medium">Water Pump</p>
              <p className="text-sm text-muted-foreground">
                {pumpStatus ? 'Running' : 'Stopped'}
              </p>
            </div>
          </div>
          <Switch checked={pumpStatus} onCheckedChange={handlePumpToggle} />
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/10 border border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/10">
              <Droplet className={`w-5 h-5 ${valveStatus ? 'text-success' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <p className="font-medium">Solenoid Valve</p>
              <p className="text-sm text-muted-foreground">
                {valveStatus ? 'Open' : 'Closed'}
              </p>
            </div>
          </div>
          <Switch checked={valveStatus} onCheckedChange={handleValveToggle} />
        </div>
      </div>
    </Card>
  );
};

export default DeviceControl;
