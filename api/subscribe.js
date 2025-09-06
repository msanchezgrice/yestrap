import { Resend } from 'resend';

async function parseJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  try { return JSON.parse(raw || '{}'); } catch { return {}; }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = await parseJsonBody(req);
    const emailRaw = (body && body.email) ? String(body.email) : '';
    const email = emailRaw.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email' });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Optionally save to a Resend Audience if provided
    if (process.env.RESEND_AUDIENCE_ID) {
      try {
        await fetch('https://api.resend.com/contacts', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, audience_id: process.env.RESEND_AUDIENCE_ID })
        });
      } catch {}
    }

    const from = process.env.EMAIL_FROM || 'onboarding@resend.dev';
    await resend.emails.send({
      from,
      to: email,
      subject: 'You’re on the list for The Yes Trap ✅',
      html: `
        <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; line-height:1.6;">
          <h2 style="margin:0 0 8px;">Thanks for subscribing!</h2>
          <p>We’ll email you as soon as purchase links are live.</p>
          <p style="margin:14px 0 0; font-size:14px; color:#6b7280;">If this wasn’t you, you can ignore this email.</p>
        </div>
      `
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}


