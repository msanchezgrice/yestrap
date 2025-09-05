import { Resend } from 'resend';
import { kv } from '@vercel/kv';

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

    const ip = (req.headers['x-forwarded-for'] || '').toString().split(',')[0].trim();
    const ua = req.headers['user-agent'] || '';

    // Store subscriber (dedupe by set, plus hash with metadata)
    const added = await kv.sadd('yestrap:subscribers', email);
    await kv.hset(`yestrap:subscriber:${email}`, {
      email,
      subscribedAt: new Date().toISOString(),
      ip,
      ua
    });

    // Send confirmation email via Resend
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.EMAIL_FROM || 'onboarding@resend.dev';
    const subject = 'You’re on the list for The Yes Trap ✅';
    const html = `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; line-height:1.6;">
        <h2 style="margin:0 0 8px;">Thanks for subscribing!</h2>
        <p>You’ll be first to hear about <em>The Yes Trap</em> cover reveal, pre‑order links, and launch timing.</p>
        <p style="margin:14px 0 0; font-size:14px; color:#6b7280;">If this wasn’t you, you can ignore this email.</p>
      </div>
    `;

    await resend.emails.send({ from, to: email, subject, html });

    return res.status(200).json({ ok: true, new: added === 1 });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}


