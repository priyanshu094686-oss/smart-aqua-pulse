import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import TimeRangeSelector from "./TimeRangeSelector";

interface DataPoint {
  time: string;
  value: number;
}

interface ParameterChartProps {
  title: string;
  data: DataPoint[];
  unit: string;
  color?: string;
  selectedRange: string;
  onRangeChange: (range: string) => void;
  domain?: [number, number | string];
}

const ParameterChart = ({ 
  title, 
  data, 
  unit, 
  color = "hsl(var(--primary))",
  selectedRange,
  onRangeChange,
  domain = [0, 'auto']
}: ParameterChartProps) => {
  // Auto-detect domain based on unit if not provided
  const getDomain = (): [number, number | string] => {
    if (domain[0] !== 0 || domain[1] !== 'auto') return domain;
    
    if (unit === 'ppm') return [0, 1000]; // TDS
    if (unit === 'pH' || unit === '') return [0, 14]; // pH
    if (unit === '°C') return [0, 50]; // Temperature
    if (unit === 'NTU') return [0, 10]; // Turbidity
    if (unit === 'L/min') return [0, 100]; // Flow rate
    if (unit === '%') return [0, 100]; // Percentage
    return [0, 'auto'];
  };
  return (
    <Card className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">{title}</h3>
        <TimeRangeSelector selectedRange={selectedRange} onRangeChange={onRangeChange} />
      </div>
      <ResponsiveContainer width="100%" height={250}>
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
            domain={getDomain()}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            formatter={(value: number) => [`${value} ${unit}`, title]}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={2}
            dot={{ fill: color, r: 4 }}
            name={title}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default ParameterChart;
