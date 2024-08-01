import { Composer } from 'grammy';
import { MyContext } from '../../types/grammy';
import { getMessageToUnparse } from './unparse';
import { unparseMd } from './md';
import { fmt, pre } from '@grammyjs/parse-mode';
import { unparseHtml } from './html';

export const unparseBothModule = new Composer<MyContext>();
const _unparseBothModule = unparseBothModule.chatType([
  'private',
  'group',
  'supergroup',
]);

_unparseBothModule.command('both', async (ctx) => {
  if (!ctx.match && !ctx.message.reply_to_message) {
    return await ctx.reply(ctx.t('md-usage'));
  }

  const toUnparse = getMessageToUnparse(ctx);

  const htmlResult = unparseHtml(toUnparse);
  await ctx.replyFmt(fmt`${pre(htmlResult.join(''), 'HTML')}`, {
    parse_mode: undefined,
  });

  const mdResult = unparseMd(toUnparse);
  await ctx.replyFmt(fmt`${pre(mdResult.join(''), 'Markdown')}`, {
    parse_mode: undefined,
  });
});
