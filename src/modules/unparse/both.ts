import { Composer } from 'grammy';
import { MyContext } from '../../context.js';
import { fmt, pre } from '@grammyjs/parse-mode';
import { getMessageToUnparse } from './unparse-util.js';
import { toHtml, toMarkdown } from '../../lib/unparse.js';

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

  const htmlResult = toHtml(toUnparse);
  const mdResult = toMarkdown(toUnparse);
  const prettyRes = fmt`${pre(htmlResult, 'HTML')} ${pre(mdResult, 'Markdown')}`;
  await ctx.splitAndReply(prettyRes.text, { entities: prettyRes.entities });
});
