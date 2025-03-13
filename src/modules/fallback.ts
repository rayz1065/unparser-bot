import { Composer } from 'grammy';
import { MyContext } from '../context';

export const fallbackModule = new Composer<MyContext>();
const _fallbackModule = fallbackModule.chatType('private');

_fallbackModule.on('message', async (ctx) => {
  await ctx.reply(ctx.t('fallback-try-start'));
});

_fallbackModule.on('callback_query', async (ctx) => {
  ctx.logger.warn(ctx.callbackQuery, 'Unmatched callback query');
  await ctx.answerCallbackQuery({
    text: ctx.t('fallback-unknown-callback'),
    show_alert: true,
  });
});
