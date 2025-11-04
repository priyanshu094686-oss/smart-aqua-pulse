-- Create sensor readings table
CREATE TABLE public.sensor_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  tds DECIMAL,
  ph DECIMAL,
  temperature DECIMAL,
  flow_rate DECIMAL,
  tank_level DECIMAL,
  filter_life DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access (for dashboard viewing)
CREATE POLICY "Allow public read access" 
ON public.sensor_readings 
FOR SELECT 
USING (true);

-- Create policy to allow public insert (for IoT devices to send data)
CREATE POLICY "Allow public insert" 
ON public.sensor_readings 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster queries by device_id and timestamp
CREATE INDEX idx_sensor_readings_device_timestamp ON public.sensor_readings(device_id, created_at DESC);

-- Enable realtime for the table
ALTER PUBLICATION supabase_realtime ADD TABLE public.sensor_readings;