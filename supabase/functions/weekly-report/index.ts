import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);
    const resend = new Resend(resendApiKey);

    // Get all active subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('email_subscriptions')
      .select('*')
      .eq('is_active', true);

    if (subError) throw subError;

    console.log(`Processing ${subscriptions?.length || 0} subscriptions`);

    for (const subscription of subscriptions || []) {
      try {
        // Get last 7 days of data for this device
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: readings, error: readError } = await supabase
          .from('sensor_readings')
          .select('*')
          .eq('device_id', subscription.device_id)
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: false });

        if (readError) throw readError;

        if (!readings || readings.length === 0) {
          console.log(`No data for device ${subscription.device_id}, skipping`);
          continue;
        }

        // Calculate weekly averages
        const avgTds = readings.reduce((sum, r) => sum + (r.tds || 0), 0) / readings.length;
        const avgPh = readings.reduce((sum, r) => sum + (r.ph || 0), 0) / readings.length;
        const avgTemp = readings.reduce((sum, r) => sum + (r.temperature || 0), 0) / readings.length;
        const avgFlow = readings.reduce((sum, r) => sum + (r.flow_rate || 0), 0) / readings.length;
        const avgTank = readings.reduce((sum, r) => sum + (r.tank_level || 0), 0) / readings.length;
        const avgFilter = readings.reduce((sum, r) => sum + (r.filter_life || 0), 0) / readings.length;

        // Prepare data for AI analysis
        const analyticsData = {
          weeklyAverages: {
            tds: avgTds.toFixed(2),
            ph: avgPh.toFixed(2),
            temperature: avgTemp.toFixed(2),
            flowRate: avgFlow.toFixed(2),
            tankLevel: avgTank.toFixed(2),
            filterLife: avgFilter.toFixed(2)
          },
          dataPoints: readings.length,
          timeRange: '7 days'
        };

        // Call Lovable AI for insights
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: `You are a water quality expert. Generate a weekly report based on sensor data with:
1. Executive Summary (2-3 sentences about overall water quality)
2. Key Metrics Analysis (brief analysis of each parameter)
3. Recommendations (3-5 actionable items)
4. Alerts (any concerning trends)

Keep it professional, concise, and actionable. Use HTML formatting with <h2>, <p>, <ul>, <li> tags.`
              },
              {
                role: 'user',
                content: `Generate a weekly water quality report for device ${subscription.device_id}.

Weekly Averages:
- TDS: ${analyticsData.weeklyAverages.tds} ppm (WHO standard: <300 ppm)
- pH: ${analyticsData.weeklyAverages.ph} (WHO standard: 6.5-8.5)
- Temperature: ${analyticsData.weeklyAverages.temperature}°C
- Flow Rate: ${analyticsData.weeklyAverages.flowRate} L/min
- Tank Level: ${analyticsData.weeklyAverages.tankLevel}%
- Filter Life: ${analyticsData.weeklyAverages.filterLife}%

Data Points: ${analyticsData.dataPoints} readings over ${analyticsData.timeRange}`
              }
            ],
          }),
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error('AI Gateway error:', aiResponse.status, errorText);
          throw new Error(`AI Gateway error: ${aiResponse.status}`);
        }

        const aiData = await aiResponse.json();
        const reportContent = aiData.choices[0].message.content;

        // Send email using Resend
        const emailResult = await resend.emails.send({
          from: 'Water Quality Monitor <onboarding@resend.dev>',
          to: [subscription.email],
          subject: `Weekly Water Quality Report - Device ${subscription.device_id}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                h1 { margin: 0; font-size: 24px; }
                h2 { color: #667eea; margin-top: 20px; }
                .metrics { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .metric { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
                .metric:last-child { border-bottom: none; }
                .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
                ul { padding-left: 20px; }
                li { margin: 8px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>📊 Weekly Water Quality Report</h1>
                  <p>Device: ${subscription.device_id}</p>
                  <p>Period: Last 7 Days | ${analyticsData.dataPoints} Readings</p>
                </div>
                <div class="content">
                  <div class="metrics">
                    <h3>📈 Weekly Averages</h3>
                    <div class="metric">
                      <span><strong>TDS:</strong></span>
                      <span>${analyticsData.weeklyAverages.tds} ppm</span>
                    </div>
                    <div class="metric">
                      <span><strong>pH Level:</strong></span>
                      <span>${analyticsData.weeklyAverages.ph}</span>
                    </div>
                    <div class="metric">
                      <span><strong>Temperature:</strong></span>
                      <span>${analyticsData.weeklyAverages.temperature}°C</span>
                    </div>
                    <div class="metric">
                      <span><strong>Flow Rate:</strong></span>
                      <span>${analyticsData.weeklyAverages.flowRate} L/min</span>
                    </div>
                    <div class="metric">
                      <span><strong>Tank Level:</strong></span>
                      <span>${analyticsData.weeklyAverages.tankLevel}%</span>
                    </div>
                    <div class="metric">
                      <span><strong>Filter Life:</strong></span>
                      <span>${analyticsData.weeklyAverages.filterLife}%</span>
                    </div>
                  </div>
                  
                  ${reportContent}
                  
                  <div class="footer">
                    <p>This is an automated weekly report from your Water Quality Monitoring System.</p>
                    <p>To unsubscribe or manage preferences, visit your dashboard.</p>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `,
        });

        console.log(`Email sent to ${subscription.email}:`, emailResult);

        // Update last_sent_at
        await supabase
          .from('email_subscriptions')
          .update({ last_sent_at: new Date().toISOString() })
          .eq('id', subscription.id);

      } catch (error) {
        console.error(`Error processing subscription ${subscription.id}:`, error);
        // Continue with next subscription
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: subscriptions?.length || 0,
        message: 'Weekly reports sent successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in weekly-report function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
