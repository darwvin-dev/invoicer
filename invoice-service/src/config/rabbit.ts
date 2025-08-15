import { connect, type ConfirmChannel, type Options, ChannelModel } from 'amqplib';

let conn: ChannelModel | null = null;
let ch: ConfirmChannel | null = null;

const QUEUE = process.env.REPORT_QUEUE || 'daily_sales_report';
const URL = process.env.RABBITMQ_URL!;

export async function getConfirmChannel(): Promise<ConfirmChannel> {
  if (ch) return ch;
  if (!URL) throw new Error('RABBITMQ_URL is missing');

  conn = await connect(URL);
  ch = await conn.createConfirmChannel();

  ch.on('error', (e: any) => {
    console.error('[amqp] channel error', e);
  });
  ch.on('close', () => {
    ch = null;
  });

  conn.on('error', (e: any) => {
    console.error('[amqp] connection error', e);
  });
  conn.on('close', () => {
    conn = null;
    ch = null;
  });

  await ch.assertQueue(QUEUE, { durable: true });
  return ch;
}

export async function publishJson(message: unknown): Promise<void> {
  const channel = await getConfirmChannel();
  const payload = Buffer.from(JSON.stringify(message));

  const props: Options.Publish = {
    persistent: true,
    contentType: 'application/json',
    type: 'daily_sales_report',
  };

  await new Promise<void>((resolve, reject) => {
    channel.sendToQueue(QUEUE, payload, props, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export async function closeRabbit() {
  try { await ch?.close(); } catch {}
  try { await conn?.close(); } catch {}
  ch = null;
  conn = null;
}
