import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface DataPoint {
  time: string;
  tds: number;
  ph: number;
}

interface WaterQualityChartProps {
  data: DataPoint[];
}

const WaterQualityChart = ({ data }: WaterQualityChartProps) => {
  return (
    <Card className="glass-card p-6">
      <h3 className="font-semibold mb-6 text-lg">Water Quality Trends (24h)</h3>
      <ResponsiveContainer width="100%" height={300}>
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
          />
          <Line 
            type="monotone" 
            dataKey="tds" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--primary))', r: 4 }}
            name="TDS (ppm)"
          />
          <Line 
            type="monotone" 
            dataKey="ph" 
            stroke="hsl(var(--secondary))" 
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--secondary))', r: 4 }}
            name="pH Level"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default WaterQualityChart;
