import { Composer, GrammyError } from 'grammy';
import { MyContext } from '../../types/grammy';
import { MessageEntity } from 'grammy/types';
import { escapeHtml } from '../../lib/utils';
import { fmt, pre } from '@grammyjs/parse-mode';
import { getMessageToUnparse, unparse } from './unparse';

export const unparseHtmlModule = new Composer<MyContext>();
const _unparseHtmlModule = unparseHtmlModule.chatType([
  'private',
  'group',
  'supergroup',
]);

const entityHtmlTags = {
  bold: ['<b>', '</b>'],
  blockquote: ['<blockquote>', '</blockquote>'],
  code: ['<code>', '</code>'],
  italic: ['<i>', '</i>'],
  custom_emoji: (entity) => [
    `<tg-emoji emoji-id="${entity.custom_emoji_id}">`,
    `</tg-emoji`,
  ],
  expandable_blockquote: ['<blockquote>', '</blockquote>'],
  mention: null,
  pre: (entity) =>
    entity.language
      ? [`<pre><code class="language-${entity.language}">`, '</code></pre>']
      : ['<pre>', '</pre>'],
  spoiler: ['<tg-spoiler>', '</tg-spoiler>'],
  strikethrough: ['<s>', '</s>'],
  text_link: (entity) => [`<a href="${entity.url}">`, '</a>'],
  text_mention: (entity) => [
    `<a href="tg://user?id=${entity.user.id}">`,
    `</a>`,
  ],
  underline: ['<u>', '</u>'],
  url: null,
  bot_command: null,
  cashtag: null,
  email: null,
  hashtag: null,
  phone_number: null,
} satisfies Partial<{
  [T in MessageEntity['type']]:
    | null
    | [string, string]
    | ((entity: MessageEntity & { type: T }) => string | [string, string]);
}>;

function getNormalizedTag(entity: MessageEntity): [string, string] {
  if (!(entity.type in entityHtmlTags)) {
    console.error(`Unknown entity type: ${entity.type}`);
    return ['', ''];
  }

  const res = entityHtmlTags[entity.type];

  if (res === null) {
    return ['', ''];
  } else if (typeof res === 'function') {
    const res2 = res(entity as any);
    if (typeof res2 === 'string') {
      return [res2, res2];
    } else {
      return res2;
    }
  } else {
    return res;
  }
}

function getEntityHtmlStartTag(entity: MessageEntity): string {
  return getNormalizedTag(entity)[0];
}

function getEntityHtmlCloseTag(entity: MessageEntity): string | null {
  return getNormalizedTag(entity)[1];
}

export function unparseHtml(message: {
  text: string;
  entities: MessageEntity[];
}) {
  const unparsed = unparse(message);

  const result = unparsed
    .map((x) =>
      typeof x === 'string'
        ? escapeHtml(x)
        : x.is_start
          ? getEntityHtmlStartTag(x.entity)
          : getEntityHtmlCloseTag(x.entity)
    )
    .filter((x) => x !== null) as string[];

  return result;
}

_unparseHtmlModule.command('html', async (ctx) => {
  if (!ctx.match && !ctx.message.reply_to_message) {
    return await ctx.reply(ctx.t('html-usage'));
  }

  const toUnparse = getMessageToUnparse(ctx);
  const result = unparseHtml(toUnparse);
  await ctx.replyFmt(fmt`${pre(result.join(''), 'HTML')}`, {
    parse_mode: undefined,
  });
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
    await ctx.reply(messageText, {
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
