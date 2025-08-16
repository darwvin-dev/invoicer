import pino from 'pino';
import fs from 'fs';
import path from 'path';

const logsDir = path.resolve('logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime, 
  formatters: {
    level: (label) => ({ level: label }),
  },
}, pino.multistream([
  { stream: process.stdout },
  { level: 'error', stream: fs.createWriteStream(path.join(logsDir, 'error.log'), { flags: 'a' }) },
  { stream: fs.createWriteStream(path.join(logsDir, 'combined.log'), { flags: 'a' }) }
]));
