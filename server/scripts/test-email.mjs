import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

console.log('=== SMTP Configuration ===');
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP_PASS:', process.env.SMTP_PASS ? `${process.env.SMTP_PASS.length} chars` : 'MISSING');
console.log('SMTP_FROM:', process.env.SMTP_FROM);
console.log('SMTP_SECURE:', process.env.SMTP_SECURE);
console.log('');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  debug: true,
  logger: true
});

console.log('=== Verifying SMTP Connection ===');
try {
  await transporter.verify();
  console.log('✅ SMTP Connected successfully!');

  console.log('\n=== Sending Test Email ===');
  const info = await transporter.sendMail({
    from: `"Vaizai LMS Test" <${process.env.SMTP_USER}>`,
    to: process.env.SMTP_USER,
    subject: 'Test OTP Email - 123456',
    html: `<div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#1a1a2e">Reset your Password</h2>
      <p>Your OTP for password reset is: <strong style="font-size:24px;color:#1a1a2e">123456</strong></p>
      <p>This OTP is valid for 10 minutes.</p>
    </div>`
  });
  console.log('✅ Email sent! Message ID:', info.messageId);
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Full error:', error);
}
