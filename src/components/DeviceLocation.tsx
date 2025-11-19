import { Card } from "@/components/ui/card";
import { MapPin } from "lucide-react";

interface DeviceLocationProps {
  deviceId: string;
  location?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

const DeviceLocation = ({ deviceId, location, coordinates }: DeviceLocationProps) => {
  return (
    <Card className="glass-card p-6">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
          <MapPin className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold mb-2">Device Location</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Device ID:</span>
              <span className="font-medium">{deviceId}</span>
            </div>
            {location && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Location:</span>
                <span className="font-medium">{location}</span>
              </div>
            )}
            {coordinates && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Coordinates:</span>
                <span className="font-medium">
                  {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DeviceLocation;
