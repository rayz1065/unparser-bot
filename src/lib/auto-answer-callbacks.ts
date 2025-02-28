import { Context, MiddlewareFn } from 'grammy';

export function autoAnswerCallbacks<C extends Context>(options?: {
  callbackAnswerArgs?:
    | ((ctx: C) => NonNullable<Parameters<C['answerCallbackQuery']>[0]>)
    | NonNullable<Parameters<C['answerCallbackQuery']>[0]>;
}): MiddlewareFn<C> {
  return async (ctx, next) => {
    let callbackQueryAnswered = !ctx.has('callback_query');

    try {
      if (ctx.has('callback_query')) {
        ctx.api.config.use((prev, method, payload, signal) => {
          if (method === 'answerCallbackQuery') {
            callbackQueryAnswered = true;
          }
          return prev(method, payload, signal);
        });
      }
      await next();
    } finally {
      if (!callbackQueryAnswered) {
        let { callbackAnswerArgs = '' } = options ?? {};
        if (typeof callbackAnswerArgs === 'function') {
          callbackAnswerArgs = callbackAnswerArgs(ctx);
        }
        await ctx.answerCallbackQuery(callbackAnswerArgs);
      }
    }
  };
}
