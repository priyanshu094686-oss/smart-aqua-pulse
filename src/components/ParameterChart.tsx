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
}

const ParameterChart = ({ 
  title, 
  data, 
  unit, 
  color = "hsl(var(--primary))",
  selectedRange,
  onRangeChange
}: ParameterChartProps) => {
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
