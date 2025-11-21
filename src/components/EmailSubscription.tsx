import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Mail, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EmailSubscriptionProps {
  deviceId: string;
}

const EmailSubscription = ({ deviceId }: EmailSubscriptionProps) => {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!email || !email.includes('@')) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('email_subscriptions')
        .insert({
          email,
          device_id: deviceId,
          is_active: true
        });

      if (error) {
        if (error.code === '23505') {
          toast.error("This email is already subscribed");
        } else {
          throw error;
        }
      } else {
        setIsSubscribed(true);
        toast.success("Successfully subscribed to weekly reports!");
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error("Failed to subscribe. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('email_subscriptions')
        .delete()
        .eq('email', email)
        .eq('device_id', deviceId);

      if (error) throw error;

      setIsSubscribed(false);
      setEmail("");
      toast.success("Successfully unsubscribed from weekly reports");
    } catch (error) {
      console.error('Unsubscribe error:', error);
      toast.error("Failed to unsubscribe. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (checked: boolean) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('email_subscriptions')
        .update({ is_active: checked })
        .eq('email', email)
        .eq('device_id', deviceId);

      if (error) throw error;

      toast.success(checked ? "Reports enabled" : "Reports paused");
    } catch (error) {
      console.error('Toggle error:', error);
      toast.error("Failed to update subscription");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="glass-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <Mail className="w-6 h-6 text-primary" />
        <div>
          <h3 className="font-semibold text-lg">Weekly Email Reports</h3>
          <p className="text-sm text-muted-foreground">
            Receive AI-powered water quality summaries and recommendations
          </p>
        </div>
      </div>

      {!isSubscribed ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={handleSubscribe}
              disabled={isLoading}
            >
              Subscribe
            </Button>
          </div>
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <CheckCircle className="w-4 h-4 mt-0.5 text-success" />
            <p>Get weekly insights on water quality trends, maintenance alerts, and optimization tips</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-success/10 rounded-lg border border-success/20">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-success" />
              <div>
                <p className="font-medium">{email}</p>
                <p className="text-sm text-muted-foreground">Subscribed to weekly reports</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleUnsubscribe}
              disabled={isLoading}
            >
              Unsubscribe
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="report-toggle" className="cursor-pointer">
              <span className="font-medium">Active</span>
              <p className="text-sm text-muted-foreground">Receive weekly reports</p>
            </Label>
            <Switch 
              id="report-toggle"
              defaultChecked
              onCheckedChange={handleToggle}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <AlertCircle className="w-4 h-4 mt-0.5 text-primary" />
            <p>Reports are sent every Monday at 9 AM with the previous week's data analysis</p>
          </div>
        </div>
      )}
    </Card>
  );
};

export default EmailSubscription;
