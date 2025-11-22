import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Mail, 
  Calendar, 
  TrendingUp, 
  Droplets, 
  Activity,
  Thermometer,
  Filter,
  Gauge,
  Waves,
  FileText
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";

interface ReportHistoryItem {
  id: string;
  device_id: string;
  recipient_email: string;
  sent_at: string;
  report_period_start: string;
  report_period_end: string;
  avg_tds: number;
  avg_ph: number;
  avg_temperature: number;
  avg_flow_rate: number;
  avg_tank_level: number;
  avg_filter_life: number;
  data_points: number;
  ai_summary: string;
  ai_recommendations: string;
}

const ReportHistory = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<ReportHistoryItem[]>([]);
  const [filteredReports, setFilteredReports] = useState<ReportHistoryItem[]>([]);
  const [emailFilter, setEmailFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ReportHistoryItem | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    if (emailFilter.trim() === "") {
      setFilteredReports(reports);
    } else {
      setFilteredReports(
        reports.filter(report => 
          report.recipient_email.toLowerCase().includes(emailFilter.toLowerCase())
        )
      );
    }
  }, [emailFilter, reports]);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('report_history')
        .select('*')
        .order('sent_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
      setFilteredReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error("Failed to load report history");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (value: number, type: string) => {
    switch (type) {
      case 'tds':
        return value < 300 ? 'text-success' : value < 500 ? 'text-warning' : 'text-destructive';
      case 'ph':
        return value >= 6.5 && value <= 8.5 ? 'text-success' : value >= 6 && value <= 9 ? 'text-warning' : 'text-destructive';
      case 'filter':
        return value > 50 ? 'text-success' : value > 20 ? 'text-warning' : 'text-destructive';
      default:
        return 'text-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Report History
            </h1>
            <p className="text-muted-foreground mt-1">
              View all past weekly water quality reports and trends
            </p>
          </div>
          <FileText className="w-12 h-12 text-primary/30" />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="max-w-7xl mx-auto mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <Mail className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{reports.length}</p>
              <p className="text-sm text-muted-foreground">Total Reports</p>
            </div>
          </div>
        </Card>
        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-success" />
            <div>
              <p className="text-2xl font-bold">
                {new Set(reports.map(r => r.recipient_email)).size}
              </p>
              <p className="text-sm text-muted-foreground">Subscribers</p>
            </div>
          </div>
        </Card>
        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-accent" />
            <div>
              <p className="text-2xl font-bold">
                {reports.length > 0 ? format(new Date(reports[0].sent_at), 'MMM d') : '-'}
              </p>
              <p className="text-sm text-muted-foreground">Last Report</p>
            </div>
          </div>
        </Card>
        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-warning" />
            <div>
              <p className="text-2xl font-bold">
                {reports.reduce((sum, r) => sum + r.data_points, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Data Points</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter */}
      <div className="max-w-7xl mx-auto mb-6">
        <Card className="glass-card p-4">
          <Input
            placeholder="Filter by email address..."
            value={emailFilter}
            onChange={(e) => setEmailFilter(e.target.value)}
            className="max-w-md"
          />
        </Card>
      </div>

      {/* Reports List */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Report Cards */}
        <div className="space-y-4">
          {isLoading ? (
            <Card className="glass-card p-6">
              <p className="text-center text-muted-foreground">Loading reports...</p>
            </Card>
          ) : filteredReports.length === 0 ? (
            <Card className="glass-card p-6">
              <p className="text-center text-muted-foreground">
                {emailFilter ? "No reports found for this email" : "No reports sent yet"}
              </p>
            </Card>
          ) : (
            filteredReports.map((report) => (
              <Card 
                key={report.id} 
                className={`glass-card p-6 cursor-pointer transition-all hover:shadow-lg ${
                  selectedReport?.id === report.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedReport(report)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">{report.recipient_email}</p>
                      <p className="text-sm text-muted-foreground">
                        Device: {report.device_id}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {format(new Date(report.sent_at), 'MMM d, yyyy')}
                  </Badge>
                </div>

                <Separator className="my-3" />

                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Droplets className="w-4 h-4" />
                      <p className={`font-bold ${getStatusColor(report.avg_tds, 'tds')}`}>
                        {report.avg_tds.toFixed(0)}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">TDS ppm</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Activity className="w-4 h-4" />
                      <p className={`font-bold ${getStatusColor(report.avg_ph, 'ph')}`}>
                        {report.avg_ph.toFixed(1)}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">pH</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Filter className="w-4 h-4" />
                      <p className={`font-bold ${getStatusColor(report.avg_filter_life, 'filter')}`}>
                        {report.avg_filter_life.toFixed(0)}%
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">Filter</p>
                  </div>
                </div>

                <div className="mt-3 text-xs text-muted-foreground">
                  {report.data_points} readings • {format(new Date(report.report_period_start), 'MMM d')} - {format(new Date(report.report_period_end), 'MMM d')}
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Report Details */}
        <div className="lg:sticky lg:top-4 lg:h-fit">
          {selectedReport ? (
            <Card className="glass-card p-6">
              <h3 className="text-xl font-bold mb-4">Report Details</h3>
              
              <div className="space-y-4">
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-card rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Droplets className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium">TDS</span>
                    </div>
                    <p className="text-2xl font-bold">{selectedReport.avg_tds.toFixed(1)} ppm</p>
                  </div>
                  <div className="p-4 bg-card rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-5 h-5 text-success" />
                      <span className="text-sm font-medium">pH</span>
                    </div>
                    <p className="text-2xl font-bold">{selectedReport.avg_ph.toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-card rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Thermometer className="w-5 h-5 text-accent" />
                      <span className="text-sm font-medium">Temperature</span>
                    </div>
                    <p className="text-2xl font-bold">{selectedReport.avg_temperature.toFixed(1)}°C</p>
                  </div>
                  <div className="p-4 bg-card rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Gauge className="w-5 h-5 text-warning" />
                      <span className="text-sm font-medium">Flow Rate</span>
                    </div>
                    <p className="text-2xl font-bold">{selectedReport.avg_flow_rate.toFixed(1)} L/min</p>
                  </div>
                  <div className="p-4 bg-card rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Waves className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium">Tank Level</span>
                    </div>
                    <p className="text-2xl font-bold">{selectedReport.avg_tank_level.toFixed(0)}%</p>
                  </div>
                  <div className="p-4 bg-card rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Filter className="w-5 h-5 text-success" />
                      <span className="text-sm font-medium">Filter Life</span>
                    </div>
                    <p className="text-2xl font-bold">{selectedReport.avg_filter_life.toFixed(0)}%</p>
                  </div>
                </div>

                <Separator />

                {/* AI Summary */}
                {selectedReport.ai_summary && (
                  <div>
                    <h4 className="font-semibold mb-2">AI Summary</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedReport.ai_summary}
                    </p>
                  </div>
                )}

                {/* AI Recommendations */}
                {selectedReport.ai_recommendations && (
                  <div>
                    <h4 className="font-semibold mb-2">Recommendations</h4>
                    <div 
                      className="text-sm text-muted-foreground leading-relaxed prose prose-sm dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: selectedReport.ai_recommendations }}
                    />
                  </div>
                )}

                <Separator />

                {/* Metadata */}
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>Sent:</strong> {format(new Date(selectedReport.sent_at), 'PPpp')}</p>
                  <p><strong>Period:</strong> {format(new Date(selectedReport.report_period_start), 'MMM d')} - {format(new Date(selectedReport.report_period_end), 'MMM d, yyyy')}</p>
                  <p><strong>Data Points:</strong> {selectedReport.data_points} readings</p>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="glass-card p-6 text-center">
              <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">
                Select a report to view details
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportHistory;
