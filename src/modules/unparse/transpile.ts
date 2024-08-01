import { Composer, GrammyError } from 'grammy';
import { MyContext } from '../../types/grammy';
import { unparseMd } from './md';
import { fmt, pre } from '@grammyjs/parse-mode';
import { unparseHtml } from './html';
import { Message } from 'grammy/types';
import { replaceMentions } from './replace-mentions';
import { escapeHtml } from '../../lib/utils';

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
  const result = unparseHtml(sentMessage);
  const prettyRes = fmt`${pre(result.join(''), 'HTML')}`;
  await ctx.api.editMessageText(ctx.chatId, messageId, prettyRes.text, {
    parse_mode: undefined,
    entities: prettyRes.entities,
  });
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
  const result = unparseMd(sentMessage);
  const prettyRes = fmt`${pre(result.join(''), 'Markdown')}`;
  await ctx.api.editMessageText(ctx.chatId, messageId, prettyRes.text, {
    parse_mode: undefined,
    entities: prettyRes.entities,
  });
});
