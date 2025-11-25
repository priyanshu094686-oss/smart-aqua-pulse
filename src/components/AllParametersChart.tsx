import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import TimeRangeSelector from "./TimeRangeSelector";

interface DataPoint {
  time: string;
  tds: number;
  ph: number;
  temperature: number;
  flow_rate: number;
  tank_level: number;
  filter_life: number;
}

interface AllParametersChartProps {
  data: DataPoint[];
  selectedRange: string;
  onRangeChange: (range: string) => void;
}

const AllParametersChart = ({ 
  data, 
  selectedRange,
  onRangeChange
}: AllParametersChartProps) => {
  return (
    <Card className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">All Parameters Overview</h3>
        <TimeRangeSelector selectedRange={selectedRange} onRangeChange={onRangeChange} />
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="time" 
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px' }}
            domain={[0, 1000]}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          <Legend 
            wrapperStyle={{
              paddingTop: '20px'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="tds" 
            stroke="hsl(220 70% 50%)" 
            strokeWidth={2}
            dot={false}
            name="TDS (ppm)"
          />
          <Line 
            type="monotone" 
            dataKey="ph" 
            stroke="hsl(142 76% 36%)" 
            strokeWidth={2}
            dot={false}
            name="pH Level"
          />
          <Line 
            type="monotone" 
            dataKey="temperature" 
            stroke="hsl(24 95% 53%)" 
            strokeWidth={2}
            dot={false}
            name="Temp (°C)"
          />
          <Line 
            type="monotone" 
            dataKey="flow_rate" 
            stroke="hsl(280 65% 60%)" 
            strokeWidth={2}
            dot={false}
            name="Flow (L/min)"
          />
          <Line 
            type="monotone" 
            dataKey="tank_level" 
            stroke="hsl(199 89% 48%)" 
            strokeWidth={2}
            dot={false}
            name="Tank (%)"
          />
          <Line 
            type="monotone" 
            dataKey="filter_life" 
            stroke="hsl(346 77% 49%)" 
            strokeWidth={2}
            dot={false}
            name="Filter (%)"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default AllParametersChart;
