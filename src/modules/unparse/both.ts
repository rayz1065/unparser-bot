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
    return await ctx.reply(ctx.t('both-usage'));
  }

  const toUnparse = getMessageToUnparse(ctx);

  const htmlResult = unparseHtml(toUnparse);
  const mdResult = unparseMd(toUnparse);
  const prettyRes = fmt`${pre(htmlResult.join(''), 'HTML')} ${pre(mdResult.join(''), 'Markdown')}`;
  await ctx.splitAndReply(prettyRes.text, { entities: prettyRes.entities });
});
