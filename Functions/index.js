const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const nodemailer = require('nodemailer');

const SMTP_USER = defineSecret('SMTP_USER');
const SMTP_PASS = defineSecret('SMTP_PASS');

exports.contact = onRequest({ secrets: [SMTP_USER, SMTP_PASS] }, async (req, res) => {
  // Allow CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  const { name, email, company, service, message } = req.body;

  if (!name || !email || !message) {
    res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
    return;
  }

  const transporter = nodemailer.createTransport({
    host: 'smtpout.secureserver.net',
    port: 465,
    secure: true,
    auth: {
      user: SMTP_USER.value(),
      pass: SMTP_PASS.value(),
    },
  });

  try {
    // Email to IZTECH
    await transporter.sendMail({
      from: `"IZTECH Website" <${SMTP_USER.value()}>`,
      to: 'Izindou@Iztech.co.za',
      replyTo: email,
      subject: `New Enquiry from ${name}${company ? ` — ${company}` : ''}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;background:#0D1520;color:#fff;padding:40px;border-radius:12px;">
          <h2 style="color:#00E5BE;margin-bottom:24px;">New Website Enquiry</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}" style="color:#00E5BE;">${email}</a></p>
          ${company ? `<p><strong>Company:</strong> ${company}</p>` : ''}
          ${service ? `<p><strong>Service:</strong> ${service}</p>` : ''}
          <p><strong>Message:</strong></p>
          <div style="background:rgba(255,255,255,0.05);padding:16px;border-radius:8px;margin-top:8px;">
            ${message.replace(/\n/g, '<br>')}
          </div>
        </div>
      `,
    });

    // Auto-reply to sender
    await transporter.sendMail({
      from: `"IZTECH Consultants & Supplies" <${SMTP_USER.value()}>`,
      to: email,
      subject: 'We received your message — IZTECH',
      html: `
        <div style="font-family:sans-serif;max-width:600px;background:#0D1520;color:#fff;padding:40px;border-radius:12px;">
          <h2 style="color:#00E5BE;">Thanks for reaching out, ${name}.</h2>
          <p style="color:#7A8FA6;line-height:1.7;">We've received your message and our team will be in touch with you shortly.</p>
          <p style="color:#7A8FA6;">— The IZTECH Team<br>
          <span style="font-size:12px;color:#3D5166;">Experience Engineered.</span></p>
        </div>
      `,
    });

    res.status(200).json({ success: true, message: 'Message sent successfully!' });

  } catch (err) {
    console.error('Mail error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to send. Please email us directly at Izindou@Iztech.co.za',
    });
  }
});
