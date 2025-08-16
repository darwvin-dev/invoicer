import cron from 'node-cron';
import { computeDailyReport } from '@/modules/reports/report.service.js';
import { publishJson } from '@/config/rabbit.js';

export const scheduleDailyReport = () =>   {
  const tz = process.env.TZ || 'Europe/Berlin';
  const cronExpr = process.env.REPORT_CRON || '0 12 * * *'; 

  const runOnce = async () => {
    const report = await computeDailyReport();
    await publishJson(report);
  };

  cron.schedule(cronExpr, () => {
    runOnce().catch((e) => console.error('[daily-report] failed:', e));
  }, { timezone: tz });

  return { runOnce };
}
