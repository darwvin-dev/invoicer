import pino from 'pino';
import fs from 'fs';
import path from 'path';

const logDir = path.resolve('./logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

export const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level(label) {
        return { level: label };
      }
    }
  },
  pino.destination({
    dest: path.join(logDir, 'email-sender.log'),
    sync: false 
  })
);
