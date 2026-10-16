import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sos_id, patient_id, recipient_ids, location } = body as {
      sos_id?: string;
      patient_id: string;
      recipient_ids: string[];
      location?: { lat: number; lon: number } | null;
    };

    if (!patient_id || !Array.isArray(recipient_ids) || recipient_ids.length === 0) {
      return NextResponse.json(
        { error: 'patient_id and recipient_ids are required' },
        { status: 400 }
      );
    }

    // Fetch patient profile
    const { data: patientProfile, error: patientError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', patient_id)
      .single();

    if (patientError || !patientProfile) {
      return NextResponse.json(
        { error: 'Patient profile not found' },
        { status: 404 }
      );
    }

    const patientName = patientProfile.full_name ?? 'Your patient';

    // Fetch recipient profiles
    const { data: recipientProfiles, error: recipientsError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email')
      .in('id', recipient_ids);

    if (recipientsError) {
      return NextResponse.json(
        { error: 'Failed to fetch recipient profiles' },
        { status: 500 }
      );
    }

    const recipients = recipientProfiles ?? [];
    const now = new Date();
    const timeString = now.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SOS Alert</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
          <!-- Header -->
          <tr>
            <td style="background-color:#dc2626;padding:32px 40px;text-align:center;">
              <p style="margin:0;font-size:40px;line-height:1;">🚨</p>
              <h1 style="margin:12px 0 0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">
                SOS Alert
              </h1>
              <p style="margin:6px 0 0;color:#fecaca;font-size:14px;">
                Duara Health — Emergency Notification
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 16px;font-size:16px;color:#111827;line-height:1.6;">
                <strong>${patientName}</strong> has triggered an SOS alert and needs immediate assistance.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:8px;margin:24px 0;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#991b1b;text-transform:uppercase;letter-spacing:0.5px;">Alert Details</p>
                    <p style="margin:0 0 6px;font-size:15px;color:#111827;">
                      <strong>Patient:</strong> ${patientName}
                    </p>
                    <p style="margin:0;font-size:15px;color:#374151;">
                      <strong>Time:</strong> ${timeString}
                    </p>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 24px;font-size:16px;color:#111827;line-height:1.7;font-weight:500;">
                This is an automated SOS alert. Please call <strong>${patientName}</strong> immediately or contact emergency services.
              </p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#dc2626;border-radius:8px;padding:14px 28px;">
                    <span style="color:#ffffff;font-size:15px;font-weight:600;">Contact Emergency Services: 911</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #f3f4f6;padding:24px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                This alert was sent automatically by the Duara Health app.<br />
                You are receiving this because you are listed as an emergency contact.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

    let sent = 0;
    let failed = 0;
    const sentTo: string[] = [];

    // ── Email alerts ──────────────────────────────────────────────────────────
    for (const recipient of recipients) {
      if (!recipient.email) { failed++; continue; }
      try {
        const { error: emailError } = await resend.emails.send({
          from: 'Duara SOS <onboarding@resend.dev>',
          to: recipient.email,
          subject: `🚨 SOS Alert — ${patientName} needs help`,
          html: emailHtml,
        });
        if (emailError) { failed++; } else { sent++; sentTo.push(recipient.email); }
      } catch { failed++; }
    }

    // ── Expo push notifications ───────────────────────────────────────────────
    if (recipient_ids.length > 0) {
      const { data: tokenRows } = await supabaseAdmin
        .from('push_tokens')
        .select('token')
        .in('user_id', recipient_ids);

      if (tokenRows && tokenRows.length > 0) {
        const messages = tokenRows.map((t: { token: string }) => ({
          to: t.token,
          sound: 'default',
          title: `🚨 SOS — ${patientName} needs help`,
          body: 'Tap to respond immediately',
          data: {
            type: 'sos_alert',
            sos_id: sos_id ?? '',
            patient_id,
            patient_name: patientName,
            location_lat: location?.lat?.toString() ?? '',
            location_lon: location?.lon?.toString() ?? '',
          },
          priority: 'high',
          channelId: 'sos',
          categoryIdentifier: 'SOS_ALERT',
        }));

        try {
          await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Accept-Encoding': 'gzip, deflate',
            },
            body: JSON.stringify(messages),
          });
        } catch (err) {
          console.error('Expo push failed:', err);
        }
      }
    }

    return NextResponse.json({ sent, failed, recipients: sentTo });
  } catch (err) {
    console.error('SOS route error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
