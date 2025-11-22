import { useState, useEffect } from "react";
import { Droplets, Thermometer, Activity, Gauge, Filter, Waves } from "lucide-react";
import MetricCard from "@/components/MetricCard";
import StatusIndicator from "@/components/StatusIndicator";
import ParameterChart from "@/components/ParameterChart";
import AllParametersChart from "@/components/AllParametersChart";
import DeviceLocation from "@/components/DeviceLocation";
import DeviceControl from "@/components/DeviceControl";
import AlertsPanel from "@/components/AlertsPanel";
import AIChatButton from "@/components/AIChatButton";
import EmailSubscription from "@/components/EmailSubscription";
import Navigation from "@/components/Navigation";
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

  const [timeRange, setTimeRange] = useState('24h');
  const [allParamsRange, setAllParamsRange] = useState('24h');
  const [chartData, setChartData] = useState({
    tds: [{ time: "Now", value: 0 }],
    ph: [{ time: "Now", value: 0 }],
    temperature: [{ time: "Now", value: 0 }],
    turbidity: [{ time: "Now", value: 0 }],
    flowRate: [{ time: "Now", value: 0 }],
    tankLevel: [{ time: "Now", value: 0 }],
  });
  const [allParamsData, setAllParamsData] = useState([
    { time: "Now", tds: 0, ph: 0, temperature: 0, flow_rate: 0, tank_level: 0, filter_life: 0 }
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

  // Fetch chart data based on time range
  const fetchChartData = async (range: string) => {
    try {
      let hoursBack = 24;
      let limit = 24;
      
      switch(range) {
        case 'live': hoursBack = 1; limit = 12; break;
        case '1h': hoursBack = 1; limit = 12; break;
        case '6h': hoursBack = 6; limit = 24; break;
        case '1d': hoursBack = 24; limit = 48; break;
        case '1w': hoursBack = 168; limit = 84; break;
        case '1m': hoursBack = 720; limit = 90; break;
        case '3m': hoursBack = 2160; limit = 90; break;
        default: hoursBack = 24; limit = 48;
      }

      const timeAgo = new Date();
      timeAgo.setHours(timeAgo.getHours() - hoursBack);

      const { data, error } = await supabase
        .from('sensor_readings')
        .select('*')
        .eq('device_id', deviceId)
        .gte('created_at', timeAgo.toISOString())
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error fetching chart data:', error);
        return;
      }

      if (data && data.length > 0) {
        const formatTime = (timestamp: string, index: number) => {
          if (index === data.length - 1) return 'Now';
          const date = new Date(timestamp);
          if (range === 'live' || range === '1h' || range === '6h' || range === '1d') {
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          } else if (range === '1w') {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          }
        };

        setChartData({
          tds: data.map((d, i) => ({ time: formatTime(d.created_at, i), value: d.tds || 0 })),
          ph: data.map((d, i) => ({ time: formatTime(d.created_at, i), value: d.ph || 0 })),
          temperature: data.map((d, i) => ({ time: formatTime(d.created_at, i), value: d.temperature || 0 })),
          turbidity: data.map((d, i) => ({ time: formatTime(d.created_at, i), value: (d.tds || 0) / 10 })),
          flowRate: data.map((d, i) => ({ time: formatTime(d.created_at, i), value: d.flow_rate || 0 })),
          tankLevel: data.map((d, i) => ({ time: formatTime(d.created_at, i), value: d.tank_level || 0 })),
        });
        
        // Also update all params data if it's the same range
        if (range === allParamsRange) {
          setAllParamsData(data.map((d, i) => ({
            time: formatTime(d.created_at, i),
            tds: d.tds || 0,
            ph: d.ph || 0,
            temperature: d.temperature || 0,
            flow_rate: d.flow_rate || 0,
            tank_level: d.tank_level || 0,
            filter_life: d.filter_life || 0,
          })));
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Set up realtime subscription
  useEffect(() => {
    fetchLatestReading();
    fetchChartData(timeRange);
    fetchChartData(allParamsRange);

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
          fetchChartData(timeRange);
          
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
  }, [deviceId, toast, timeRange]);

  // Refetch chart data when time range changes
  useEffect(() => {
    fetchChartData(timeRange);
  }, [timeRange]);

  const getStatus = (value: number, min: number, max: number) => {
    if (value >= min && value <= max) return "good";
    if (value >= min - 5 && value <= max + 5) return "warning";
    return "critical";
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <Navigation />
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

        {/* Device Location and Control */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DeviceLocation 
            deviceId={deviceId} 
            location="Smart Water Purifier - Main Tank"
            coordinates={{ lat: 17.385, lng: 78.4867 }}
          />
          <DeviceControl deviceId={deviceId} />
        </div>

        {/* Charts Section - Multiple Parameters */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ParameterChart
            title="TDS (Total Dissolved Solids)"
            data={chartData.tds}
            unit="ppm"
            color="hsl(var(--primary))"
            selectedRange={timeRange}
            onRangeChange={setTimeRange}
          />
          <ParameterChart
            title="pH Level"
            data={chartData.ph}
            unit="pH"
            color="hsl(var(--secondary))"
            selectedRange={timeRange}
            onRangeChange={setTimeRange}
          />
          <ParameterChart
            title="Temperature"
            data={chartData.temperature}
            unit="°C"
            color="hsl(var(--warning))"
            selectedRange={timeRange}
            onRangeChange={setTimeRange}
          />
          <ParameterChart
            title="Turbidity"
            data={chartData.turbidity}
            unit="NTU"
            color="hsl(var(--accent))"
            selectedRange={timeRange}
            onRangeChange={setTimeRange}
          />
          <ParameterChart
            title="Water Flow"
            data={chartData.flowRate}
            unit="L/min"
            color="hsl(var(--success))"
            selectedRange={timeRange}
            onRangeChange={setTimeRange}
          />
          <ParameterChart
            title="Tank Level"
            data={chartData.tankLevel}
            unit="%"
            color="hsl(195 85% 55%)"
            selectedRange={timeRange}
            onRangeChange={setTimeRange}
          />
        </div>

        {/* All Parameters Combined Chart */}
        <div className="grid grid-cols-1 gap-6">
          <AllParametersChart 
            data={allParamsData}
            selectedRange={allParamsRange}
            onRangeChange={setAllParamsRange}
          />
        </div>

        {/* Alerts Panel */}
        <div className="grid grid-cols-1 gap-6">
          <AlertsPanel alerts={alerts} />
          <EmailSubscription deviceId={deviceId} />
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

      {/* AI Chat Assistant */}
      <AIChatButton
        sensorData={{
          tds: metrics.tds,
          ph: metrics.ph,
          temperature: metrics.temperature,
          flowRate: metrics.flowRate,
          tankLevel: metrics.tankLevel,
          filterLife: metrics.filterLife,
        }}
      />
    </div>
  );
};

export default Index;
