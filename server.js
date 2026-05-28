require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// --- Nodemailer Transporter ---
// Configure via your .env file (see .env.example)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// --- Contact Form Endpoint ---
app.post('/api/contact', async (req, res) => {
  const { name, email, company, service, message } = req.body;

  // Basic validation
  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      message: 'Please fill in all required fields.',
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email address.' });
  }

  const mailOptions = {
    from: `"IZTECH Website" <${process.env.SMTP_USER}>`,
    to: 'Iztndou@Iztech.co.za',
    replyTo: email,
    subject: `New Enquiry from ${name}${company ? ` — ${company}` : ''}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #070B12; color: #ffffff; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background: #0D1520; border-radius: 12px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #00E5BE20, #00E5BE05); padding: 40px; border-bottom: 1px solid rgba(255,255,255,0.07); }
            .logo { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff; }
            .logo span { color: #00E5BE; }
            .tagline { color: #7A8FA6; font-size: 13px; margin-top: 4px; }
            .body { padding: 40px; }
            .field { margin-bottom: 24px; }
            .label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: #00E5BE; margin-bottom: 6px; }
            .value { font-size: 16px; color: #ffffff; line-height: 1.6; }
            .message-box { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 8px; padding: 20px; margin-top: 8px; }
            .footer { padding: 24px 40px; border-top: 1px solid rgba(255,255,255,0.07); color: #4A5E72; font-size: 12px; }
            hr { border: none; border-top: 1px solid rgba(255,255,255,0.07); margin: 24px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">IZ<span>TECH</span></div>
              <div class="tagline">New enquiry from your website</div>
            </div>
            <div class="body">
              <div class="field">
                <div class="label">From</div>
                <div class="value">${name}</div>
              </div>
              <div class="field">
                <div class="label">Email</div>
                <div class="value"><a href="mailto:${email}" style="color:#00E5BE;">${email}</a></div>
              </div>
              ${company ? `<div class="field"><div class="label">Company</div><div class="value">${company}</div></div>` : ''}
              ${service ? `<div class="field"><div class="label">Service Interested In</div><div class="value">${service}</div></div>` : ''}
              <div class="field">
                <div class="label">Message</div>
                <div class="message-box value">${message.replace(/\n/g, '<br>')}</div>
              </div>
            </div>
            <div class="footer">
              This message was sent via the contact form at iztech.co.za · Reply directly to respond to ${name}.
            </div>
          </div>
        </body>
      </html>
    `,
  };

  // Auto-reply to the sender
  const autoReplyOptions = {
    from: `"IZTECH Consultants & Supplies" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'We received your message — IZTECH',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #070B12; color: #ffffff; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background: #0D1520; border-radius: 12px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #00E5BE20, #00E5BE05); padding: 40px; }
            .logo { font-size: 22px; font-weight: 800; color: #ffffff; }
            .logo span { color: #00E5BE; }
            .body { padding: 40px; line-height: 1.8; color: #c0d0e0; }
            .accent { color: #00E5BE; font-weight: 600; }
            .footer { padding: 24px 40px; border-top: 1px solid rgba(255,255,255,0.07); color: #4A5E72; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">IZ<span>TECH</span></div>
            </div>
            <div class="body">
              <p>Hi <span class="accent">${name}</span>,</p>
              <p>Thank you for reaching out to IZTECH Consultants & Supplies. We've received your message and our team will be in touch with you shortly.</p>
              <p>In the meantime, feel free to explore our work at <a href="https://iztech.co.za" style="color:#00E5BE;">iztech.co.za</a>.</p>
              <p>Warm regards,<br><strong>The IZTECH Team</strong><br><span style="color:#7A8FA6;font-size:13px;">Experience Engineered.</span></p>
            </div>
            <div class="footer">
              IZTECH Consultants & Supplies · Izindou@Iztech.co.za
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    await transporter.sendMail(autoReplyOptions);
    return res.json({ success: true, message: 'Message sent successfully!' });
  } catch (error) {
    console.error('Email error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again or email us directly at Izindou@Iztech.co.za',
    });
  }
});

// Fallback — serve index.html for any unmatched route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 IZTECH website running at http://localhost:${PORT}\n`);
});
