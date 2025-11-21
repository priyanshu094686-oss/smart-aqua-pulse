-- Create email_subscriptions table for weekly report preferences
CREATE TABLE IF NOT EXISTS public.email_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  device_id TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_sent_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.email_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to subscribe (insert their email)
CREATE POLICY "Allow public insert" ON public.email_subscriptions
  FOR INSERT
  WITH CHECK (true);

-- Allow users to view their own subscriptions by email
CREATE POLICY "Allow read own subscription" ON public.email_subscriptions
  FOR SELECT
  USING (true);

-- Allow users to update their own subscriptions
CREATE POLICY "Allow update own subscription" ON public.email_subscriptions
  FOR UPDATE
  USING (true);

-- Allow users to delete their own subscriptions
CREATE POLICY "Allow delete own subscription" ON public.email_subscriptions
  FOR DELETE
  USING (true);