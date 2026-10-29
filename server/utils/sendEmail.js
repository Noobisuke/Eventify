const nodemailer = require('nodemailer');

let transporter;

const isConfigured = () => Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

// Brevo sends over HTTPS (port 443), so it works on hosts that block SMTP ports (Render free tier etc.)
const useBrevo = () => Boolean(process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL);

const sendWithBrevo = async ({ to, subject, text, html }) => {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: process.env.EMAIL_FROM_NAME || 'Eventify', email: process.env.BREVO_SENDER_EMAIL },
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Brevo API error ${res.status}: ${detail.slice(0, 200)}`);
  }
};

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        // Gmail shows App Passwords with spaces ("abcd efgh ijkl mnop") - strip them
        pass: process.env.EMAIL_PASS.replace(/\s+/g, ''),
      },
    });
  }
  return transporter;
};

const sendEmail = async ({ to, subject, text, html }) => {
  if (useBrevo()) {
    await sendWithBrevo({ to, subject, text, html });
    return;
  }

  if (!isConfigured()) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Email service is not configured');
    }
    // Development fallback so the app is still usable before email is set up.
    // Once EMAIL_USER / EMAIL_PASS are in .env, real emails are sent instead.
    console.log(`\n[DEV EMAIL - EMAIL_USER/EMAIL_PASS not set, nothing was actually sent]\nTo: ${to}\nSubject: ${subject}\n${text}\n`);
    return;
  }

  await getTransporter().sendMail({
    from: process.env.EMAIL_FROM || `Eventify <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
};

/**
 * purpose: 'verify' (sign-up verification) | 'reset' (password reset)
 */
const sendOtpEmail = async ({ to, name, code, purpose, minutes }) => {
  const isVerify = purpose === 'verify';
  const subject = isVerify ? 'Verify your Eventify account' : 'Reset your Eventify password';
  const intro = isVerify
    ? 'Welcome to Eventify! Use the code below to verify your email address.'
    : 'We received a request to reset your Eventify password. Use the code below to continue.';

  const text = `Hi ${name},\n\n${intro}\n\nYour code: ${code}\n\nThis code expires in ${minutes} minutes. If you didn't request it, you can safely ignore this email.\n\n- Eventify`;

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#222">
    <h2 style="color:#6C63FF;margin:0 0 16px">Eventify</h2>
    <p>Hi ${name},</p>
    <p>${intro}</p>
    <div style="font-size:32px;font-weight:700;letter-spacing:8px;background:#F1F0FF;color:#6C63FF;text-align:center;padding:16px;border-radius:12px;margin:24px 0">${code}</div>
    <p style="color:#666;font-size:13px">This code expires in ${minutes} minutes. If you didn't request it, you can safely ignore this email.</p>
  </div>`;

  await sendEmail({ to, subject, text, html });
};

module.exports = { sendEmail, sendOtpEmail };