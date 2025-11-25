import { Card } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, XCircle, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface WaterQualityScoreProps {
  metrics: {
    tds: number;
    ph: number;
    temperature: number;
    flowRate: number;
    tankLevel: number;
    filterLife: number;
  };
}

interface ParameterCheck {
  name: string;
  value: number;
  unit: string;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  message: string;
}

const WaterQualityScore = ({ metrics }: WaterQualityScoreProps) => {
  const checkParameter = (
    name: string,
    value: number,
    unit: string,
    excellent: [number, number],
    good: [number, number],
    warning: [number, number]
  ): ParameterCheck => {
    let status: 'excellent' | 'good' | 'warning' | 'critical';
    let message: string;

    if (value >= excellent[0] && value <= excellent[1]) {
      status = 'excellent';
      message = 'Optimal';
    } else if (value >= good[0] && value <= good[1]) {
      status = 'good';
      message = 'Within safe range';
    } else if (value >= warning[0] && value <= warning[1]) {
      status = 'warning';
      message = 'Needs attention';
    } else {
      status = 'critical';
      message = 'Immediate action required';
    }

    return { name, value, unit, status, message };
  };

  const parameters: ParameterCheck[] = [
    checkParameter('TDS', metrics.tds, 'ppm', [0, 150], [150, 300], [300, 500]),
    checkParameter('pH Level', metrics.ph, '', [6.8, 7.5], [6.5, 8.5], [6.0, 9.0]),
    checkParameter('Temperature', metrics.temperature, '°C', [20, 25], [15, 30], [10, 35]),
    {
      name: 'Flow Rate',
      value: metrics.flowRate,
      unit: 'L/min',
      status: metrics.flowRate >= 0.2 ? 'excellent' : metrics.flowRate > 0 ? 'good' : 'critical',
      message: metrics.flowRate >= 0.2 ? 'Optimal flow' : metrics.flowRate > 0 ? 'Low flow' : 'No flow detected'
    },
    {
      name: 'Tank Level',
      value: metrics.tankLevel,
      unit: '%',
      status: metrics.tankLevel >= 70 ? 'excellent' : metrics.tankLevel >= 40 ? 'good' : metrics.tankLevel >= 20 ? 'warning' : 'critical',
      message: metrics.tankLevel >= 70 ? 'Sufficient' : metrics.tankLevel >= 40 ? 'Moderate' : metrics.tankLevel >= 20 ? 'Low level' : 'Very low'
    },
    {
      name: 'Filter Life',
      value: metrics.filterLife,
      unit: '%',
      status: metrics.filterLife >= 50 ? 'excellent' : metrics.filterLife >= 30 ? 'good' : metrics.filterLife >= 15 ? 'warning' : 'critical',
      message: metrics.filterLife >= 50 ? 'Good condition' : metrics.filterLife >= 30 ? 'Fair condition' : metrics.filterLife >= 15 ? 'Replace soon' : 'Replace immediately'
    }
  ];

  const calculateOverallScore = (): number => {
    const weights = {
      excellent: 100,
      good: 75,
      warning: 50,
      critical: 0
    };

    const totalScore = parameters.reduce((sum, param) => sum + weights[param.status], 0);
    return Math.round(totalScore / parameters.length);
  };

  const overallScore = calculateOverallScore();
  const excellentCount = parameters.filter(p => p.status === 'excellent').length;
  const goodCount = parameters.filter(p => p.status === 'good').length;
  const warningCount = parameters.filter(p => p.status === 'warning').length;
  const criticalCount = parameters.filter(p => p.status === 'critical').length;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-success';
    if (score >= 75) return 'text-primary';
    if (score >= 50) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
      case 'good':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'critical':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  return (
    <Card className="glass-card p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Water Quality Score</h3>
              <p className="text-sm text-muted-foreground">Overall System Health</p>
            </div>
          </div>
        </div>

        {/* Overall Score */}
        <div className="text-center space-y-3 p-6 rounded-lg bg-muted/30 border border-border/50">
          <div className={`text-6xl font-bold ${getScoreColor(overallScore)}`}>
            {overallScore}
          </div>
          <div className="space-y-2">
            <div className="text-xl font-semibold">{getScoreLabel(overallScore)}</div>
            <Progress value={overallScore} className="h-3" />
          </div>
          <div className="flex justify-center gap-4 text-sm pt-2">
            {excellentCount > 0 && (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-success" />
                {excellentCount} Excellent
              </span>
            )}
            {goodCount > 0 && (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-primary" />
                {goodCount} Good
              </span>
            )}
            {warningCount > 0 && (
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-warning" />
                {warningCount} Warning
              </span>
            )}
            {criticalCount > 0 && (
              <span className="flex items-center gap-1">
                <XCircle className="w-3 h-3 text-destructive" />
                {criticalCount} Critical
              </span>
            )}
          </div>
        </div>

        {/* Parameter Details */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">Parameter Status</h4>
          <div className="grid gap-2">
            {parameters.map((param) => (
              <div
                key={param.name}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(param.status)}
                  <div>
                    <div className="font-medium text-sm">{param.name}</div>
                    <div className="text-xs text-muted-foreground">{param.message}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {param.value.toFixed(param.name === 'pH Level' ? 1 : 0)} {param.unit}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        {(warningCount > 0 || criticalCount > 0) && (
          <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Recommendations
            </h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              {parameters
                .filter(p => p.status === 'warning' || p.status === 'critical')
                .map(p => (
                  <li key={p.name}>
                    • {p.name}: {p.message}
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
};

export default WaterQualityScore;
