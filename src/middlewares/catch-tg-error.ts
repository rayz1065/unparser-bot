import { Context, Middleware } from 'grammy';
import { I18nFlavor } from '@grammyjs/i18n';
import { TgError, defaultTgErrorHandler } from '../lib/tg-error.js';
import { LoggerFlavor } from '../logger.js';

export async function defaultCatchTgErrorsHandler(
  ctx: Context & I18nFlavor & LoggerFlavor,
  error: TgError
) {
  await defaultTgErrorHandler(ctx, error);
}

export interface CatchTgErrorsOptions<T extends Context> {
  customHandler: (
    ctx: T,
    error: TgError,
    options: CatchTgErrorsOptions<T> | undefined
  ) => void | Promise<void>;
}

export const catchTgErrors: <T extends Context & I18nFlavor & LoggerFlavor>(
  options?: CatchTgErrorsOptions<T>
) => Middleware<T> = (options) => async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    if (!(error instanceof TgError)) {
      throw error;
    }

    const handler = options?.customHandler ?? defaultCatchTgErrorsHandler;
    await handler(ctx, error, options);
  }
};
