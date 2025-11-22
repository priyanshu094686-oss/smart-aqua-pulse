-- Enable pg_cron extension for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule weekly reports every Monday at 9 AM UTC
SELECT cron.schedule(
  'send-weekly-water-reports',
  '0 9 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://ayrejsbltaqqiojsybxd.supabase.co/functions/v1/weekly-report',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5cmVqc2JsdGFxcWlvanN5YnhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNzAyMzUsImV4cCI6MjA3Nzg0NjIzNX0.EUzbesJ3w8G41Q_3gZn3FjtUGCp-mDB86H0gzbhh2yc"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);