import { Composer } from 'grammy';
import { MyContext } from '../types/grammy';

export const fallbackModule = new Composer<MyContext>();
const _fallbackModule = fallbackModule.chatType('private');

_fallbackModule.on('message', async (ctx) => {
  await ctx.replyFmt(ctx.t('reply-to-unparse'), {
    reply_parameters: {
      message_id: ctx.message.message_id,
    },
  });
});
