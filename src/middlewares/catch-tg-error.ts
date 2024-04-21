import { Middleware } from 'grammy';
import { MyContext } from '../types/grammy';
import { TranslationVariables } from '@grammyjs/i18n';

/**
 * An error to be displayed to the user
 */
export class TgError extends Error {
  public context?: TranslationVariables;

  public constructor(
    message: string,
    context?: TranslationVariables | undefined
  ) {
    super(message);
    this.context = context;
  }
}

export async function defaultCatchTgErrorsHandler(
  ctx: MyContext,
  error: TgError
) {
  const prettyError = ctx.t(error.message, error.context);

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

export interface CatchTgErrorsOptions {
  customHandler: (
    ctx: MyContext,
    error: TgError,
    options: CatchTgErrorsOptions | undefined
  ) => void;
}

export const catchTgErrors: (
  options?: CatchTgErrorsOptions
) => Middleware<MyContext> = (options) => async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    if (!(error instanceof TgError)) {
      throw error;
    }

    const handler = options?.customHandler ?? defaultCatchTgErrorsHandler;
    handler(ctx, error, options);
  }
};
