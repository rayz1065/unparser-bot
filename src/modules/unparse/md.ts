import { Composer, GrammyError } from 'grammy';
import { MyContext } from '../../types/grammy';
import {
  escapeHtml,
  escapeMd,
  escapeMdPre,
  escapeMdUrl,
} from '../../lib/utils';
import { MessageEntity } from 'grammy/types';
import { getMessageToUnparse, unparse } from './unparse';
import { fmt, pre } from '@grammyjs/parse-mode';
import { replaceMentions } from './replace-mentions';

export const unparseMdModule = new Composer<MyContext>();
const _unparseMdModule = unparseMdModule.chatType([
  'private',
  'group',
  'supergroup',
]);

const entityMarkdownSyntax = {
  bold: '*',
  blockquote: ['**>', ''],
  code: '`',
  italic: ['**_**', '**_**'],
  custom_emoji: (entity) => [
    '![',
    `](tg://emoji?id=${escapeMdUrl(entity.custom_emoji_id)})`,
  ],
  expandable_blockquote: ['**>', '||'],
  mention: '',
  pre: (entity) =>
    entity.language ? ['```' + entity.language + '\n', '```'] : '```',
  spoiler: '||',
  strikethrough: '~',
  text_link: (entity) => ['[', `](${escapeMdUrl(entity.url)})`],
  text_mention: (entity) => ['[', `](tg://user?id=${entity.user.id})`],
  underline: '__',
  url: '',
  bot_command: '',
  cashtag: '',
  email: '',
  hashtag: '',
  phone_number: '',
} satisfies Partial<{
  [T in MessageEntity['type']]:
    | string
    | [string, string]
    | ((entity: MessageEntity & { type: T }) => string | [string, string]);
}>;

function getNormalizedSyntax(entity: MessageEntity): [string, string] {
  if (!(entity.type in entityMarkdownSyntax)) {
    console.error(`Unknown entity type: ${entity.type}`);
    return ['', ''];
  }

  const res = entityMarkdownSyntax[entity.type];

  if (typeof res === 'string') {
    return [res, res];
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

function getEntityMdStartSyntax(entity: MessageEntity): string {
  return getNormalizedSyntax(entity)[0];
}

function getEntityMdCloseSyntax(entity: MessageEntity): string {
  return getNormalizedSyntax(entity)[1];
}

export function unparseMd(message: {
  text: string;
  entities?: MessageEntity[];
}) {
  const unparsed = unparse(message);

  const result: string[] = [];
  let isInsideBlockquote = false;
  let isInsidePre = false;

  unparsed.forEach((chr) => {
    if (typeof chr === 'string') {
      if (isInsidePre) {
        result.push(escapeMdPre(chr));
      } else if (isInsideBlockquote && chr == '\n') {
        result.push('\n>');
      } else {
        result.push(escapeMd(chr));
      }
    } else {
      const syntax = chr.is_start
        ? getEntityMdStartSyntax(chr.entity)
        : getEntityMdCloseSyntax(chr.entity);

      if (
        chr.entity.type === 'blockquote' ||
        chr.entity.type === 'expandable_blockquote'
      ) {
        isInsideBlockquote = !isInsideBlockquote;
      } else if (chr.entity.type === 'pre' || chr.entity.type === 'code') {
        isInsidePre = !isInsidePre;
      }

      result.push(syntax);
    }
  });

  return result;
}

_unparseMdModule.command('md', async (ctx) => {
  if (!ctx.match && !ctx.message.reply_to_message) {
    return await ctx.reply(ctx.t('md-usage'));
  }

  const toUnparse = getMessageToUnparse(ctx);
  const result = unparseMd(toUnparse);
  await ctx.replyFmt(fmt`${pre(result.join(''), 'Markdown')}`, {
    parse_mode: undefined,
  });
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
