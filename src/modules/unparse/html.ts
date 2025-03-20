import { Composer, GrammyError } from 'grammy';
import { MyContext } from '../../context.js';
import { escapeHtml } from '../../lib/utils.js';
import { fmt, pre } from '@grammyjs/parse-mode';
import { getMessageToUnparse, replaceMentions } from './unparse-util.js';
import { toHtml } from '../../lib/unparse.js';

export const unparseHtmlModule = new Composer<MyContext>();
const _unparseHtmlModule = unparseHtmlModule.chatType([
  'private',
  'group',
  'supergroup',
]);

_unparseHtmlModule.command('html', async (ctx) => {
  if (!ctx.match && !ctx.message.reply_to_message) {
    return await ctx.reply(ctx.t('html-usage'));
  }

  const toUnparse = getMessageToUnparse(ctx);
  const result = toHtml(toUnparse);
  const prettyRes = fmt`${pre(result, 'HTML')}`;
  await ctx.splitAndReply(prettyRes.text, { entities: prettyRes.entities });
});

_unparseHtmlModule.command('phtml', async (ctx) => {
  const messageText =
    ctx.match ||
    ctx.message.reply_to_message?.text ||
    ctx.message.reply_to_message?.caption ||
    null;

  if (!messageText) {
    return await ctx.reply(ctx.t('phtml-usage'));
  }

  try {
    await ctx.reply(replaceMentions(ctx.from, messageText), {
      parse_mode: 'HTML',
    });
  } catch (error) {
    if (!(error instanceof GrammyError)) {
      throw error;
    }
    await ctx.reply(
      ctx.t('parsing-failed', {
        error: escapeHtml(error.message),
      })
    );
  }
});

unparseHtmlModule.chosenInlineResult('phtml', async (ctx) => {
  const query = ctx.chosenInlineResult.query;
  const escapedQuery = escapeHtml(query);
  const prettySource =
    `👇 <b>${ctx.t('inline-result-source')}</>\n` +
    `<pre><code class="language-html">${escapedQuery}</code></pre>`;
  try {
    const text = `${replaceMentions(ctx.from, query)}\n\n${prettySource}`;
    await ctx.editMessageText(text, { parse_mode: 'HTML' });
  } catch (error) {
    if (!(error instanceof GrammyError)) {
      throw error;
    }
    await ctx.editMessageText(
      ctx.t('parsing-failed', { error: escapeHtml(error.message) }) +
        `\n\n${prettySource}`
    );
  }
});
