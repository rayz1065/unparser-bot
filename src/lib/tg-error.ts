import { I18nFlavor, TranslationVariables } from '@grammyjs/i18n';
import { Context } from 'grammy';
import { LoggerFlavor } from '../logger.js';

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

export async function defaultTgErrorHandler(
  ctx: Context & I18nFlavor & LoggerFlavor,
  error: TgError
) {
  const prettyError = ctx.t(error.message, error.variables);

  try {
    if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery(prettyError);
    } else if (ctx.chat?.type === 'private') {
      await ctx.reply(prettyError);
    } else {
      ctx.logger.error(ctx, 'handleTgError used but nowhere to show the error');
    }
  } catch (error) {
    ctx.logger.error(error, 'error while showing error');
  }
}
