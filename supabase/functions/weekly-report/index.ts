import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function generateReport(supabase: any, deviceId: string, lovableApiKey: string) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: readings, error: readError } = await supabase
    .from('sensor_readings')
    .select('*')
    .eq('device_id', deviceId)
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: false });

  if (readError) throw readError;
  if (!readings || readings.length === 0) return null;

  const avg = (field: string) => readings.reduce((sum: number, r: any) => sum + (r[field] || 0), 0) / readings.length;
  const averages = {
    tds: avg('tds').toFixed(2),
    ph: avg('ph').toFixed(2),
    temperature: avg('temperature').toFixed(2),
    flowRate: avg('flow_rate').toFixed(2),
    tankLevel: avg('tank_level').toFixed(2),
    filterLife: avg('filter_life').toFixed(2),
  };

  const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: `You are a water quality expert. Generate a weekly report with: 1. Executive Summary 2. Key Metrics Analysis 3. Recommendations 4. Alerts. Use HTML formatting with <h2>, <p>, <ul>, <li> tags.` },
        { role: 'user', content: `Weekly report for device ${deviceId}. TDS: ${averages.tds} ppm, pH: ${averages.ph}, Temp: ${averages.temperature}°C, Flow: ${averages.flowRate} L/min, Tank: ${averages.tankLevel}%, Filter: ${averages.filterLife}%. ${readings.length} readings over 7 days.` }
      ],
    }),
  });

  if (!aiResponse.ok) throw new Error(`AI Gateway error: ${aiResponse.status}`);
  const aiData = await aiResponse.json();
  const reportContent = aiData.choices[0].message.content;

  return { averages, reportContent, dataPoints: readings.length, periodStart: sevenDaysAgo.toISOString() };
}

function buildEmailHtml(deviceId: string, averages: any, reportContent: string, dataPoints: number) {
  return `<!DOCTYPE html><html><head><style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    h1 { margin: 0; font-size: 24px; } h2 { color: #667eea; margin-top: 20px; }
    .metrics { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .metric { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .metric:last-child { border-bottom: none; }
    .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
    ul { padding-left: 20px; } li { margin: 8px 0; }
  </style></head><body><div class="container">
    <div class="header"><h1>📊 Water Quality Report</h1><p>Device: ${deviceId}</p><p>${dataPoints} Readings | Last 7 Days</p></div>
    <div class="content">
      <div class="metrics"><h3>📈 Weekly Averages</h3>
        <div class="metric"><span><strong>TDS:</strong></span><span>${averages.tds} ppm</span></div>
        <div class="metric"><span><strong>pH:</strong></span><span>${averages.ph}</span></div>
        <div class="metric"><span><strong>Temperature:</strong></span><span>${averages.temperature}°C</span></div>
        <div class="metric"><span><strong>Flow Rate:</strong></span><span>${averages.flowRate} L/min</span></div>
        <div class="metric"><span><strong>Tank Level:</strong></span><span>${averages.tankLevel}%</span></div>
        <div class="metric"><span><strong>Filter Life:</strong></span><span>${averages.filterLife}%</span></div>
      </div>
      ${reportContent}
      <div class="footer"><p>Automated report from Water Quality Monitoring System.</p></div>
    </div>
  </div></body></html>`;
}

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

    // Check for on-demand request (single email)
    let body: any = {};
    try { body = await req.json(); } catch { /* empty body = scheduled run */ }

    const { targetEmail, deviceId: targetDeviceId } = body;

    if (targetEmail && targetDeviceId) {
      // ON-DEMAND: Send report to a specific email
      console.log(`On-demand report for ${targetEmail}, device ${targetDeviceId}`);

      const report = await generateReport(supabase, targetDeviceId, lovableApiKey);
      if (!report) {
        return new Response(
          JSON.stringify({ error: 'No sensor data found for the last 7 days' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { Resend } = await import("https://esm.sh/resend@4.0.0");
      const resend = new Resend(resendApiKey);
      const html = buildEmailHtml(targetDeviceId, report.averages, report.reportContent, report.dataPoints);

      const emailResult = await resend.emails.send({
        from: 'Water Quality Monitor <onboarding@resend.dev>',
        to: [targetEmail],
        subject: `Water Quality Report - Device ${targetDeviceId}`,
        html,
      });

      console.log(`Email sent to ${targetEmail}:`, emailResult);

      // Save to history
      await supabase.from('report_history').insert({
        device_id: targetDeviceId,
        recipient_email: targetEmail,
        report_period_start: report.periodStart,
        report_period_end: new Date().toISOString(),
        avg_tds: parseFloat(report.averages.tds),
        avg_ph: parseFloat(report.averages.ph),
        avg_temperature: parseFloat(report.averages.temperature),
        avg_flow_rate: parseFloat(report.averages.flowRate),
        avg_tank_level: parseFloat(report.averages.tankLevel),
        avg_filter_life: parseFloat(report.averages.filterLife),
        data_points: report.dataPoints,
        ai_summary: report.reportContent.substring(0, 500),
        ai_recommendations: report.reportContent,
      });

      return new Response(
        JSON.stringify({ success: true, message: `Report sent to ${targetEmail}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SCHEDULED: Process all active subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('email_subscriptions').select('*').eq('is_active', true);
    if (subError) throw subError;

    console.log(`Processing ${subscriptions?.length || 0} subscriptions`);
    const { Resend } = await import("https://esm.sh/resend@4.0.0");
    const resend = new Resend(resendApiKey);

    for (const sub of subscriptions || []) {
      try {
        const report = await generateReport(supabase, sub.device_id, lovableApiKey);
        if (!report) { console.log(`No data for device ${sub.device_id}`); continue; }

        const html = buildEmailHtml(sub.device_id, report.averages, report.reportContent, report.dataPoints);
        await resend.emails.send({
          from: 'Water Quality Monitor <onboarding@resend.dev>',
          to: [sub.email],
          subject: `Weekly Water Quality Report - Device ${sub.device_id}`,
          html,
        });

        await supabase.from('report_history').insert({
          device_id: sub.device_id, recipient_email: sub.email,
          report_period_start: report.periodStart, report_period_end: new Date().toISOString(),
          avg_tds: parseFloat(report.averages.tds), avg_ph: parseFloat(report.averages.ph),
          avg_temperature: parseFloat(report.averages.temperature), avg_flow_rate: parseFloat(report.averages.flowRate),
          avg_tank_level: parseFloat(report.averages.tankLevel), avg_filter_life: parseFloat(report.averages.filterLife),
          data_points: report.dataPoints, ai_summary: report.reportContent.substring(0, 500),
          ai_recommendations: report.reportContent,
        });

        await supabase.from('email_subscriptions')
          .update({ last_sent_at: new Date().toISOString() }).eq('id', sub.id);

        console.log(`Email sent to ${sub.email}`);
      } catch (error) {
        console.error(`Error for subscription ${sub.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: subscriptions?.length || 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
