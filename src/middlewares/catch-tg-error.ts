import { Context, Middleware } from 'grammy';
import { I18nFlavor } from '@grammyjs/i18n';
import { TgError, defaultTgErrorHandler } from '../lib/tg-error';

export async function defaultCatchTgErrorsHandler(
  ctx: Context & I18nFlavor,
  error: TgError
) {
  await defaultTgErrorHandler(ctx, error);
}

export interface CatchTgErrorsOptions<T extends Context> {
  customHandler: (
    ctx: T,
    error: TgError,
    options: CatchTgErrorsOptions<T> | undefined
  ) => void;
}

export const catchTgErrors: <T extends Context & I18nFlavor>(
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
