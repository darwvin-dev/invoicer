import mongoose from 'mongoose';
import { logger } from './logger.js';
import { env } from './env.js';

mongoose.set('strictQuery', true);

export async function connectMongo() {
  try {
    await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    logger.info({ uri: env.MONGO_URI }, 'Mongo connected');
  } catch (err) {
    logger.error({ err }, 'Mongo connection failed');
    process.exit(1);
  }
}

export async function disconnectMongo() {
  await mongoose.connection.close();
  logger.info('Mongo disconnected');
}
