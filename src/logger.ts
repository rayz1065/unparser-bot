import { pino } from 'pino';
import { appConfig } from './config.js';
import path from 'path';
import { Context, MiddlewareFn } from 'grammy';

const __dirname = import.meta.dirname;
const logDirectory = path.join(__dirname, '../storage/logs');

export const logger = pino({
  level: appConfig.LOG_LEVEL,
  transport: {
    targets:
      appConfig.NODE_ENV === 'production'
        ? [
            {
              target: 'pino/file',
              level: 'error',
              options: {
                destination: path.join(logDirectory, 'error.log'),
              },
            },
            {
              target: 'pino/file',
              options: {
                destination: path.join(logDirectory, 'app.log'),
              },
            },
            { target: 'pino/file' },
          ]
        : [
            {
              target: 'pino-pretty',
              options: {
                ignore: 'pid,hostname',
                colorize: true,
                translateTime: true,
              },
            },
          ],
  },
});

export type Logger = typeof logger;
export type LoggerFlavor = {
  logger: Logger;
};

export function installLogger<C extends Context>(
  logger: Logger
): MiddlewareFn<C & LoggerFlavor> {
  return (ctx, next) => {
    Object.defineProperty(ctx, 'logger', {
      value: logger.child({
        update_id: ctx.update.update_id,
      }),
    });
    return next();
  };
}
