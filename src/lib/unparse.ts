import { MessageEntity } from 'grammy/types';

type UnparsedMessage = (
  | string
  | { is_start: boolean; entity: MessageEntity }
)[];

type TextEntities = {
  text: string;
  entities?: MessageEntity[];
};

export function toHtml(message: TextEntities) {
  const unparsed = unparse(message);

  const result = unparsed
    .map((x) =>
      typeof x === 'string'
        ? escapeHtml(x)
        : x.is_start
          ? getNormalizedTag(x.entity)[0]
          : getNormalizedTag(x.entity)[1]
    )
    .filter((x) => x !== null);

  return result.join('');
}

export function toMarkdown(message: TextEntities) {
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
        ? getNormalizedSyntax(chr.entity)[0]
        : getNormalizedSyntax(chr.entity)[1];

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

  return result.join('');
}

/**
 * Unparses a message and returns a list of tokens, which can be characters or
 * start/end entities.
 */
export function unparse({ text, entities }: TextEntities): UnparsedMessage {
  entities ??= [];
  let entitiesIdx = 0;
  const entitiesStack: MessageEntity[] = [];
  const result: UnparsedMessage = [];

  for (let i = 0; i < text.length; i++) {
    while (
      entitiesIdx < entities.length &&
      entities[entitiesIdx].offset === i
    ) {
      const entity = entities[entitiesIdx];
      result.push({ entity, is_start: true });
      entitiesStack.push(entity);
      entitiesIdx += 1;
    }

    result.push(text[i]);

    while (
      entitiesStack.length &&
      entitiesStack.at(-1)!.length + entitiesStack.at(-1)!.offset === i + 1
    ) {
      result.push({ entity: entitiesStack.at(-1)!, is_start: false });
      entitiesStack.pop();
    }
  }

  return result;
}

/**
 * All <, > and & symbols that are not a part of a tag or an HTML entity must
 * be replaced with the corresponding HTML entities (< with &lt;, > with &gt;
 * and & with &amp;).
 */
function escapeHtml(text: string) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
  };

  return text.replace(/[&<>]/g, (m) => map[m as keyof typeof map]);
}

/**
 * Inside the (...) part of the inline link and custom emoji definition, all
 * ')' and '\\' must be escaped with a preceding '\\' character.
 */
function escapeMdUrl(text: string) {
  return text.replace(/[)\\]/g, (match) => '\\' + match);
}

/**
 * Inside pre and code entities, all '`' and '\\' characters must be escaped
 * with a preceding '\\' character.
 */
function escapeMdPre(text: string) {
  return text.replace(/[`\\]/g, (match) => '\\' + match);
}

/**
 * In all other places characters '_', '*', '[', ']', '(', ')', '~', '`', '>',
 * '#', '+', '-', '=', '|', '{', '}', '.', '!' must be escaped with the
 * preceding character '\\'.
 */
function escapeMd(text: string) {
  return text.replace(/[\\_*[\]()~`>#+\-=|{}.!]/g, (match) => '\\' + match);
}

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
} satisfies {
  [T in MessageEntity['type']]:
    | string
    | [string, string]
    | ((entity: MessageEntity & { type: T }) => string | [string, string]);
};

function getNormalizedSyntax(entity: MessageEntity): [string, string] {
  if (!(entity.type in entityMarkdownSyntax)) {
    console.error(`Unknown entity type: ${entity.type}`);
    return ['', ''];
  }

  const res = entityMarkdownSyntax[entity.type];

  if (typeof res === 'string') {
    return [res, res];
  } else if (typeof res === 'function') {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
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

const entityHtmlTags = {
  bold: ['<b>', '</b>'],
  blockquote: ['<blockquote>', '</blockquote>'],
  code: ['<code>', '</code>'],
  italic: ['<i>', '</i>'],
  custom_emoji: (entity) => [
    `<tg-emoji emoji-id="${entity.custom_emoji_id}">`,
    `</tg-emoji>`,
  ],
  expandable_blockquote: ['<blockquote expandable>', '</blockquote>'],
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
} satisfies {
  [T in MessageEntity['type']]:
    | null
    | [string, string]
    | ((entity: MessageEntity & { type: T }) => string | [string, string]);
};

function getNormalizedTag(entity: MessageEntity): [string, string] {
  if (!(entity.type in entityHtmlTags)) {
    console.error(`Unknown entity type: ${entity.type}`);
    return ['', ''];
  }

  const res = entityHtmlTags[entity.type];

  if (res === null) {
    return ['', ''];
  } else if (typeof res === 'function') {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
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
