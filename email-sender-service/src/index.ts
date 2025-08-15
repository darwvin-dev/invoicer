import 'dotenv/config';
import { getChannel, closeRabbit, republishWithDelay } from './rabbit.js';
import { logger } from './logger.js';
import { DailyReportSchema, type DailyReport } from './schema.js';
import { sendDailyReportEmail } from './email.js';

const QUEUE = process.env.REPORT_QUEUE || 'daily_sales_report';
const URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';

const isTransient = (err: unknown): boolean => {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    msg.includes('timeout') ||
    msg.includes('econnreset') ||
    msg.includes('not reachable') ||
    msg.includes('temporary') ||
    msg.includes('socket') ||
    msg.includes('etimedout')
  );
}

const computeDelayMs = (attempt: number): number => {
  const table = [1000, 3000, 10000, 30000];
  return table[Math.min(attempt, table.length - 1)];
}

const main = async() => {
  const ch = await getChannel(URL, QUEUE);
  logger.info({ queue: QUEUE }, '[email-sender] Started successfull...');

  ch.consume(QUEUE, async (msg) => {
    if (!msg) return;

    const raw = msg.content;
    const headers = msg.properties.headers || {};
    const attempt = Number(headers['x-retry-attempt'] || 0);

    try {
      const parsed = JSON.parse(raw.toString('utf8'));
      const report = DailyReportSchema.parse(parsed) as DailyReport;

      logger.info('---------------- DAILY SALES REPORT ----------------');
      logger.info(`Range: ${report.dateRange.from} → ${report.dateRange.to} [${report.dateRange.tz}]`);
      logger.info(`Total Sales Amount: ${report.totalSalesAmount}`);
      if (!report.items.length) {
        logger.info('No items sold in the period.');
      } else {
        console.table(report.items.map(i => ({ SKU: i.sku, Qty: i.totalQuantity })));
      }
      logger.info('----------------------------------------------------');

      ch.ack(msg);
      sendDailyReportEmail(report)
    } catch (err) {
      if (!(err instanceof Error) || err.name === 'ZodError' || raw.length === 0) {
        logger.error({ err }, '[email-sender] Error with ack msg');
        ch.ack(msg);
        return;
      }

      if (isTransient(err)) {
        const nextAttempt = attempt + 1;
        const delay = computeDelayMs(nextAttempt);
        logger.warn({ err, attempt: nextAttempt, delay }, '[email-sender] transient error');

        ch.ack(msg); 
        await republishWithDelay(ch, QUEUE, raw, { ...headers, 'x-retry-attempt': nextAttempt }, delay);
        return;
      }

      logger.error({ err }, '[email-sender] Error');
      ch.ack(msg);
    }
  }, { noAck: false });

  const shutdown = async () => {
    logger.info('Email sender off...');
    await closeRabbit();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
