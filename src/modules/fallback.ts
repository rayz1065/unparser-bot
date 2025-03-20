import { Composer } from 'grammy';
import { MyContext } from '../context.js';

export const fallbackModule = new Composer<MyContext>();
const _fallbackModule = fallbackModule.chatType('private');

_fallbackModule.on('message').filter(
  (ctx) => ctx.msg.via_bot?.id !== ctx.me.id,
  async (ctx) => {
    await ctx.replyFmt(ctx.t('reply-to-unparse'), {
      reply_parameters: {
        message_id: ctx.message.message_id,
      },
    });
  }
);

_fallbackModule.on('callback_query', async (ctx) => {
  ctx.logger.warn(ctx.callbackQuery, 'Unmatched callback query');
  await ctx.answerCallbackQuery({
    text: ctx.t('fallback-unknown-callback'),
    show_alert: true,
  });
});
