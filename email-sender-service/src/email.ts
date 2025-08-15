import 'dotenv/config';
import nodemailer, { type Transporter } from 'nodemailer';
import { logger } from './logger.js';
import type { DailyReport } from './schema.js';

let transporter: Transporter | null = null;

const getTransport = async(): Promise<Transporter> => {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error('SMTP env is missing (SMTP_HOST/PORT/USER/PASS)');
  }
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

export const sendDailyReportEmail = async(report: DailyReport) => {
  const t = await getTransport();
  const subject = `Daily Sales Report: ${report.dateRange.from} → ${report.dateRange.to} (${report.dateRange.tz})`;
  const text = [
    `Range: ${report.dateRange.from} -> ${report.dateRange.to} [${report.dateRange.tz}]`,
    `Total Sales Amount: ${report.totalSalesAmount}`,
    'Items:',
    ...(report.items.length ? report.items.map(i => `- ${i.sku}: ${i.totalQuantity}`) : ['(no items)']),
  ].join('\n');
  const html = `
    <div style="font-family:system-ui,Segoe UI,Arial">
      <h2>Daily Sales Report</h2>
      <p><b>Range:</b> ${report.dateRange.from} → ${report.dateRange.to} [${report.dateRange.tz}]</p>
      <p><b>Total Sales Amount:</b> ${report.totalSalesAmount}</p>
      <table border="1" cellpadding="6" cellspacing="0">
        <thead><tr><th>SKU</th><th>Qty</th></tr></thead>
        <tbody>
          ${report.items.length
            ? report.items.map(i => `<tr><td>${i.sku}</td><td>${i.totalQuantity}</td></tr>`).join('')
            : '<tr><td colspan="2" align="center"><i>No items</i></td></tr>'}
        </tbody>
      </table>
    </div>`;
  const info = await t.sendMail({
    from: `"Sales Reports" <${process.env.SMTP_USER || 'no-reply@example.com'}>`,
    to: process.env.REPORT_EMAIL || process.env.SMTP_USER || 'test@example.com',
    subject, text, html,
  });
  logger.info({ messageId: info.messageId }, '[email] Email sent');
}
