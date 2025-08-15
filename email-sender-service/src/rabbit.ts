import { connect, type Channel, type Options, ChannelModel } from 'amqplib';
import { logger } from './logger.js';

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

export const getChannel = async (brokerUrl: string, queueName: string): Promise<Channel> => {
  if (channel) return channel;

  connection = await connect(brokerUrl);

  connection.on('error', (err) => logger.error({ err }, '[RabbitMQ] Connection error'));
  connection.on('close', () => {
    logger.warn('[RabbitMQ] Connection closed');
    connection = null;
    channel = null;
  });

  channel = await connection.createChannel();
  channel.on('error', (err) => logger.error({ err }, '[RabbitMQ] Channel error'));
  channel.on('close', () => {
    logger.warn('[RabbitMQ] Channel closed');
    channel = null;
  });

  await channel.assertQueue(queueName, { durable: true });
  await channel.prefetch(5);

  return channel;
}

export const republishWithDelay = async (
  ch: Channel,
  queueName: string,
  body: Buffer,
  headers: Record<string, unknown>,
  delayMs: number
) => {
  await new Promise<void>((resolve) => setTimeout(resolve, delayMs));

  const options: Options.Publish = {
    persistent: true,
    contentType: 'application/json',
    headers,
  };

  ch.sendToQueue(queueName, body, options);
}

export const closeRabbit = async () => {
  try { await channel?.close(); } catch (e) { console.log(e) }
  try { await connection?.close(); } catch (e) { console.log(e) }
  channel = null;
  connection = null;
}
