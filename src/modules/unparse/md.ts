import { Composer, GrammyError } from 'grammy';
import { MyContext } from '../../context.js';
import { escapeHtml, escapeMd } from '../../lib/utils.js';
import { fmt, pre } from '@grammyjs/parse-mode';
import { replaceMentions, getMessageToUnparse } from './unparse-util.js';
import { toMarkdown } from '../../lib/unparse.js';

export const unparseMdModule = new Composer<MyContext>();
const _unparseMdModule = unparseMdModule.chatType([
  'private',
  'group',
  'supergroup',
]);

_unparseMdModule.command('md', async (ctx) => {
  if (!ctx.match && !ctx.message.reply_to_message) {
    return await ctx.reply(ctx.t('md-usage'));
  }

  const toUnparse = getMessageToUnparse(ctx);
  const result = toMarkdown(toUnparse);
  const prettyRes = fmt`${pre(result, 'Markdown')}`;
  await ctx.splitAndReply(prettyRes.text, { entities: prettyRes.entities });
});

_unparseMdModule.command('pmd', async (ctx) => {
  const messageText =
    ctx.match ||
    ctx.message.reply_to_message?.text ||
    ctx.message.reply_to_message?.caption ||
    null;

  if (!messageText) {
    return await ctx.reply(ctx.t('pmd-usage'));
  }

  try {
    await ctx.reply(replaceMentions(ctx.from, messageText), {
      parse_mode: 'MarkdownV2',
    });
  } catch (error) {
    if (!(error instanceof GrammyError)) {
      throw error;
    }
    await ctx.reply(
      ctx.t('parsing-failed', { error: escapeHtml(error.message) })
    );
  }
});

unparseMdModule.chosenInlineResult('pmd', async (ctx) => {
  const query = ctx.chosenInlineResult.query;
  const escapedQuery = escapeMd(query);
  const prettySource =
    `👇 *${ctx.t('inline-result-source')}*\n` +
    `\`\`\`Markdown\n${escapedQuery}\`\`\``;
  try {
    const text = `${replaceMentions(ctx.from, query)}\n\n${prettySource}`;
    await ctx.editMessageText(text, { parse_mode: 'MarkdownV2' });
  } catch (error) {
    if (!(error instanceof GrammyError)) {
      throw error;
    }
    await ctx.editMessageText(
      ctx.t('parsing-failed-md', { error: escapeMd(error.message) }) +
        `\n\n${prettySource}`,
      { parse_mode: 'MarkdownV2' }
    );
  }
});
