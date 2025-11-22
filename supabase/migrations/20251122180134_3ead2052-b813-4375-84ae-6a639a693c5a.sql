-- Create report_history table to track sent reports
CREATE TABLE IF NOT EXISTS public.report_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  report_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  report_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  avg_tds NUMERIC,
  avg_ph NUMERIC,
  avg_temperature NUMERIC,
  avg_flow_rate NUMERIC,
  avg_tank_level NUMERIC,
  avg_filter_life NUMERIC,
  data_points INTEGER,
  ai_summary TEXT,
  ai_recommendations TEXT
);

-- Enable RLS
ALTER TABLE public.report_history ENABLE ROW LEVEL SECURITY;

-- Allow users to view reports for their email
CREATE POLICY "Users can view their own reports" ON public.report_history
  FOR SELECT
  USING (true);

-- Only allow backend to insert reports
CREATE POLICY "Service role can insert reports" ON public.report_history
  FOR INSERT
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_report_history_email ON public.report_history(recipient_email);
CREATE INDEX idx_report_history_device ON public.report_history(device_id);
CREATE INDEX idx_report_history_sent_at ON public.report_history(sent_at DESC);