import { useState, useEffect } from "react";
import { Droplets, Thermometer, Activity, Gauge, Filter, Waves } from "lucide-react";
import MetricCard from "@/components/MetricCard";
import StatusIndicator from "@/components/StatusIndicator";
import WaterQualityChart from "@/components/WaterQualityChart";
import AlertsPanel from "@/components/AlertsPanel";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { toast } = useToast();
  const [deviceId] = useState('device_001');
  const [isConnected, setIsConnected] = useState(false);
  
  const [metrics, setMetrics] = useState({
    tds: 0,
    ph: 0,
    temperature: 0,
    flowRate: 0,
    tankLevel: 0,
    filterLife: 0,
  });

  const [chartData, setChartData] = useState([
    { time: "00:00", tds: 0, ph: 0 },
    { time: "04:00", tds: 0, ph: 0 },
    { time: "08:00", tds: 0, ph: 0 },
    { time: "12:00", tds: 0, ph: 0 },
    { time: "16:00", tds: 0, ph: 0 },
    { time: "20:00", tds: 0, ph: 0 },
    { time: "Now", tds: 0, ph: 0 },
  ]);

  const alerts = [
    {
      id: "1",
      type: "success" as const,
      message: "Water quality is excellent. All parameters within optimal range.",
      timestamp: "Just now",
    },
    {
      id: "2",
      type: "info" as const,
      message: "Next filter replacement scheduled in 28 days.",
      timestamp: "2 hours ago",
    },
    {
      id: "3",
      type: "warning" as const,
      message: "Tank level dropping faster than usual. Monitor consumption.",
      timestamp: "5 hours ago",
    },
  ];

  // Fetch latest sensor reading
  const fetchLatestReading = async () => {
    try {
      const { data, error } = await supabase
        .from('sensor_readings')
        .select('*')
        .eq('device_id', deviceId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching sensor data:', error);
        return;
      }

      if (data) {
        setMetrics({
          tds: data.tds || 0,
          ph: data.ph || 0,
          temperature: data.temperature || 0,
          flowRate: data.flow_rate || 0,
          tankLevel: data.tank_level || 0,
          filterLife: data.filter_life || 0,
        });
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Fetch chart data (last 7 readings)
  const fetchChartData = async () => {
    try {
      const { data, error } = await supabase
        .from('sensor_readings')
        .select('tds, ph, created_at')
        .eq('device_id', deviceId)
        .order('created_at', { ascending: false })
        .limit(7);

      if (error) {
        console.error('Error fetching chart data:', error);
        return;
      }

      if (data && data.length > 0) {
        const formattedData = data.reverse().map((reading, index) => ({
          time: index === data.length - 1 ? 'Now' : new Date(reading.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          tds: reading.tds || 0,
          ph: reading.ph || 0,
        }));
        setChartData(formattedData);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Set up realtime subscription
  useEffect(() => {
    fetchLatestReading();
    fetchChartData();

    const channel = supabase
      .channel('sensor-readings')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sensor_readings',
          filter: `device_id=eq.${deviceId}`,
        },
        (payload) => {
          console.log('New sensor reading:', payload);
          const newData = payload.new;
          setMetrics({
            tds: newData.tds || 0,
            ph: newData.ph || 0,
            temperature: newData.temperature || 0,
            flowRate: newData.flow_rate || 0,
            tankLevel: newData.tank_level || 0,
            filterLife: newData.filter_life || 0,
          });
          setIsConnected(true);
          
          // Update chart data
          fetchChartData();
          
          toast({
            title: "New Data Received",
            description: "Sensor readings updated in real-time",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deviceId, toast]);

  const getStatus = (value: number, min: number, max: number) => {
    if (value >= min && value <= max) return "good";
    if (value >= min - 5 && value <= max + 5) return "warning";
    return "critical";
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Droplets className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold glow-text">AquaPure Monitor</h1>
              <p className="text-muted-foreground">IoT Smart Water Purifier Dashboard</p>
            </div>
          </div>
        </div>

        {/* Live Status Banner */}
        <div className="glass-card p-4 flex items-center justify-between animate-pulse-glow">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-success' : 'bg-warning'} animate-pulse`} />
            <span className="font-medium">
              {isConnected ? 'System Online • Real-time Monitoring Active' : 'Waiting for IoT data...'}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            Device: {deviceId} • Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* Main Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricCard
            title="TDS Level"
            value={metrics.tds.toFixed(0)}
            unit="ppm"
            icon={Gauge}
            status={getStatus(metrics.tds, 40, 50)}
            trend={2}
          />
          <MetricCard
            title="pH Level"
            value={metrics.ph.toFixed(1)}
            unit=""
            icon={Activity}
            status={getStatus(metrics.ph, 6.5, 7.5)}
            trend={-1}
          />
          <MetricCard
            title="Temperature"
            value={metrics.temperature.toFixed(1)}
            unit="°C"
            icon={Thermometer}
            status="good"
          />
          <MetricCard
            title="Flow Rate"
            value={metrics.flowRate.toFixed(1)}
            unit="L/min"
            icon={Waves}
            status="good"
            trend={3}
          />
          <MetricCard
            title="Tank Level"
            value={metrics.tankLevel.toFixed(0)}
            unit="%"
            icon={Droplets}
            status={getStatus(metrics.tankLevel, 70, 100)}
          />
          <MetricCard
            title="Filter Life"
            value={metrics.filterLife}
            unit="%"
            icon={Filter}
            status={metrics.filterLife > 50 ? "good" : metrics.filterLife > 25 ? "warning" : "critical"}
          />
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatusIndicator
            title="Primary Filter"
            percentage={metrics.filterLife}
            status={metrics.filterLife > 50 ? "good" : metrics.filterLife > 25 ? "warning" : "critical"}
            description="~28 days remaining"
          />
          <StatusIndicator
            title="Membrane Filter"
            percentage={85}
            status="good"
            description="~45 days remaining"
          />
        </div>

        {/* Chart and Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <WaterQualityChart data={chartData} />
          </div>
          <div className="lg:col-span-1">
            <AlertsPanel alerts={alerts} />
          </div>
        </div>

        {/* Footer Stats */}
        <div className="glass-card p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">2,450</p>
              <p className="text-sm text-muted-foreground mt-1">Liters Purified Today</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-secondary">98.5%</p>
              <p className="text-sm text-muted-foreground mt-1">Purification Efficiency</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-accent">24/7</p>
              <p className="text-sm text-muted-foreground mt-1">Uptime This Month</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-success">0</p>
              <p className="text-sm text-muted-foreground mt-1">Critical Alerts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
