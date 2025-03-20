import { Composer, GrammyError } from 'grammy';
import { MyContext } from '../../context.js';
import { fmt, pre } from '@grammyjs/parse-mode';
import { Message } from 'grammy/types';
import { replaceMentions } from './unparse-util.js';
import { escapeHtml } from '../../lib/utils.js';
import { toHtml, toMarkdown } from '../../lib/unparse.js';

export const unparseTranspileModule = new Composer<MyContext>();
const _unparseTranspileModule = unparseTranspileModule.chatType([
  'private',
  'group',
  'supergroup',
]);

_unparseTranspileModule.command('mdhtml', async (ctx) => {
  const messageText =
    ctx.match ||
    ctx.message.reply_to_message?.text ||
    ctx.message.reply_to_message?.caption ||
    null;

  if (!messageText) {
    return await ctx.reply(ctx.t('mdhtml-usage'));
  }

  let sentMessage: Message.TextMessage;

  try {
    sentMessage = await ctx.reply(replaceMentions(ctx.from, messageText), {
      parse_mode: 'MarkdownV2',
    });
  } catch (error) {
    if (!(error instanceof GrammyError)) {
      throw error;
    }
    await ctx.reply(
      ctx.t('parsing-failed', { error: escapeHtml(error.message) })
    );
    return;
  }

  const messageId = sentMessage.message_id;
  ctx.api.deleteMessage(ctx.chatId, messageId).catch(() => {});

  const result = toHtml(sentMessage);
  const prettyRes = fmt`${pre(result, 'HTML')}`;
  await ctx.splitAndReply(prettyRes.text, { entities: prettyRes.entities });
});

_unparseTranspileModule.command('htmlmd', async (ctx) => {
  const messageText =
    ctx.match ||
    ctx.message.reply_to_message?.text ||
    ctx.message.reply_to_message?.caption ||
    null;

  if (!messageText) {
    return await ctx.reply(ctx.t('htmlmd-usage'));
  }

  let sentMessage: Message.TextMessage;

  try {
    sentMessage = await ctx.reply(replaceMentions(ctx.from, messageText), {
      parse_mode: 'HTML',
    });
  } catch (error) {
    if (!(error instanceof GrammyError)) {
      throw error;
    }
    await ctx.reply(
      ctx.t('parsing-failed', { error: escapeHtml(error.message) })
    );
    return;
  }

  const messageId = sentMessage.message_id;
  ctx.api.deleteMessage(ctx.chatId, messageId).catch(() => {});

  const result = toMarkdown(sentMessage);
  const prettyRes = fmt`${pre(result, 'Markdown')}`;
  await ctx.splitAndReply(prettyRes.text, { entities: prettyRes.entities });
});
