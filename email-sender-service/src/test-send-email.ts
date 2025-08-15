import nodemailer from 'nodemailer';
import 'dotenv/config';

const sendTestEmail = async () => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: `"Email Service test for: " <${process.env.SMTP_USER}>`,
    to: "receiver@example.com",
    subject: "Email service testmail",
    text: "Email service works fine.",
    html: "<b>Email service works fine.</b>",
  });

  console.log("Message sent: ", info.messageId);
}

sendTestEmail().catch(console.error);
