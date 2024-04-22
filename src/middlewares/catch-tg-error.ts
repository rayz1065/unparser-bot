import { Context, Middleware } from 'grammy';
import { I18nFlavor, TranslationVariables } from '@grammyjs/i18n';

/**
 * An error to be displayed to the user
 */
export class TgError extends Error {
  public variables?: TranslationVariables;

  public constructor(
    message: string,
    variables?: TranslationVariables | undefined
  ) {
    super(message);
    this.variables = variables;
  }
}

export async function defaultCatchTgErrorsHandler(
  ctx: Context & I18nFlavor,
  error: TgError
) {
  const prettyError = ctx.t(error.message, error.variables);

  try {
    if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery(prettyError);
    } else if (ctx.chat?.type === 'private') {
      await ctx.reply(prettyError);
    } else {
      console.error('catchTgErrors used but nowhere to show the error', ctx);
    }
  } catch (error) {
    console.error('error while showing error', error);
  }
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
