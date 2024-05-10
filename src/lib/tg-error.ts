import { I18nFlavor, TranslationVariables } from '@grammyjs/i18n';
import { Context } from 'grammy';

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
      console.error('handleTgError used but nowhere to show the error', ctx);
    }
  } catch (error) {
    console.error('error while showing error', error);
  }
}
