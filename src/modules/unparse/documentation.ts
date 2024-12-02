import { Composer, InlineKeyboard } from 'grammy';
import { MyContext } from '../../context.js';
import { TgCallbacksBag } from 'grammy-tg-components';
import { unparseHtml } from './html.js';
import { unparseMd } from './md.js';
import * as parseMode from '@grammyjs/parse-mode';
import { MessageEntity } from 'grammy/types';
import { MessageData } from 'grammy-edit-or-reply';
import { escapeHtml, noPreview, selectedBtnText } from '../../lib/utils.js';
import {
  decodeDeepLinkParams,
  encodeDeepLinkUrl,
} from '../../lib/deep-linking.js';
import { menuCb } from '../main-menu.js';

export const documentationModule = new Composer<MyContext>();
const _documentationModule = documentationModule.chatType([
  'private',
  'group',
  'supergroup',
]);
const callbacksBag = new TgCallbacksBag<MyContext>('docs');
documentationModule.use(callbacksBag);

type TextEntities = {
  text: string;
  entities?: MessageEntity[];
};

const entities = {
  blockquote: parseMode.blockquote(
    'Block quotation started\nBlock quotation continued\nThe last line of the block quotation'
  ),
  bold: parseMode.bold('bold'),
  code: parseMode.code('inline fixed-width code'),
  bot_command: (ctx) => {
    const text = `/documentation@${ctx.me.username}`;
    return {
      text,
      entities: [{ offset: 0, length: text.length, type: 'bot_command' }],
    };
  },
  cashtag: {
    text: '$EUR',
    entities: [{ offset: 0, length: 4, type: 'cashtag' }],
  },
  custom_emoji: {
    text: '👍',
    entities: [
      {
        type: 'custom_emoji',
        offset: 0,
        length: 2,
        custom_emoji_id: '5368324170671202286',
      },
    ],
  }, // NOTE: encoded as url in parseMode
  email: {
    text: 'hello@example.com',
    entities: [{ offset: 0, length: 17, type: 'email' }],
  },
  expandable_blockquote: (() => {
    const entity = parseMode.blockquote(
      'Expandable block quotation started\nExpandable block quotation continued\nExpandable block quotation continued\nHidden by default part of the block quotation started\nExpandable block quotation continued\nThe last line of the block quotation'
    );
    // NOTE, workaround until new parse-mode release
    entity.entities[0].type = 'expandable_blockquote';
    return entity;
  })(),
  hashtag: {
    text: '#example',
    entities: [{ offset: 0, length: 8, type: 'hashtag' }],
  },
  italic: parseMode.italic('italic'),
  mention: {
    text: '@username',
    entities: [{ offset: 0, length: 9, type: 'mention' }],
  },
  phone_number: {
    text: '+1-212-555-0123',
    entities: [{ offset: 0, length: 15, type: 'phone_number' }],
  },
  pre: parseMode.pre('pre-formatted fixed-width code block', 'python'),
  spoiler: parseMode.spoiler('spoiler'),
  strikethrough: parseMode.strikethrough('strikethrough'),
  text_link: parseMode.link('inline URL', 'http://www.example.com/'),
  text_mention: (ctx) => {
    const text = 'inline mention of a user';
    if (ctx.from) {
      return {
        text,
        entities: [
          {
            type: 'text_mention',
            length: text.length,
            offset: 0,
            user: ctx.from,
          },
        ],
      };
    }
    // NOTE: encoded as url in parseMode
    return parseMode.mentionUser('inline mention of a user', 123456789);
  },
  underline: parseMode.underline('underline'),
  url: {
    text: 'https://example.com',
    entities: [{ offset: 0, length: 19, type: 'url' }],
  },
} satisfies {
  [T in MessageEntity['type']]:
    | ((ctx: MyContext) => TextEntities)
    | TextEntities;
};

const entitiesShownByDefault = new Set<MessageEntity['type']>([
  'expandable_blockquote',
  'bold',
  'code',
  'custom_emoji',
  'blockquote',
  'italic',
  'pre',
  'spoiler',
  'strikethrough',
  'text_link',
  'text_mention',
  'underline',
] satisfies MessageEntity['type'][]);

function documentationMenu(
  ctx: MyContext,
  showMore = false,
  selectedEntityType?: MessageEntity['type']
) {
  let keyboard = new InlineKeyboard();

  const entityTypes = Object.keys(entities).sort() as MessageEntity['type'][];

  entityTypes.forEach((entityType) => {
    const shownInThisSection =
      showMore === !entitiesShownByDefault.has(entityType);
    if (!shownInThisSection) {
      return;
    }

    keyboard.add(
      documentationMenuCb.getBtn(
        selectedBtnText(entityType, entityType === selectedEntityType),
        showMore,
        ...(entityType === selectedEntityType ? [] : [entityType])
      )
    );
  });

  const textLines: string[] = [];

  if (selectedEntityType) {
    let textEntities = entities[selectedEntityType];
    if (typeof textEntities === 'function') {
      textEntities = textEntities(ctx);
    }

    textLines.push(
      `📖 ${ctx.t('documentation-info-about', { entityType: selectedEntityType })}`,
      '',
      unparseHtml(textEntities).join(''),
      ''
    );

    textLines.push(`👇 <b>${ctx.t('documentation-source')}</>`);

    textLines.push(
      `<pre><code class="language-html">${escapeHtml(
        unparseHtml(textEntities).join('')
      )}</code></pre>`
    );

    const markdownText = unparseMd(textEntities).join('').replaceAll('**', '');

    textLines.push(
      `<pre><code class="language-Markdown">${escapeHtml(
        markdownText
      )}</code></pre>`
    );

    textLines.push(
      `<pre><code class="language-JSON">${escapeHtml(
        JSON.stringify(textEntities.entities, undefined, 2)
      )}</code></pre>`
    );

    textLines.push(
      `🔗 <u>${ctx.t('documentation-share')}</u>: ` +
        encodeDeepLinkUrl(ctx.me, ['docs', selectedEntityType])
    );
  } else {
    textLines.push(
      `📖 <b>${ctx.t('documentation-title')}</b>`,
      ctx.t('documentation-subtitle'),
      '',
      ctx.t('documentation-official-documentation'),
      `🔗 <u>${ctx.t('documentation-share')}</u>: ` +
        encodeDeepLinkUrl(ctx.me, ['docs', 'menu']),
      '',
      `👇 <i>${ctx.t('documentation-pick-an-option-for-details')}</i>`
    );
  }

  keyboard = keyboard.toFlowed(2);

  keyboard.row(
    documentationMenuCb.getBtn(
      ctx.t(showMore ? 'back' : 'documentation-show-more'),
      !showMore
    ),
    menuCb.getBtn(ctx.t('back-to-menu'))
  );

  return {
    text: textLines.join('\n'),
    keyboard: keyboard.inline_keyboard,
    ...noPreview(),
  } satisfies MessageData;
}

async function replyWithDocumentationMenu(
  ctx: MyContext,
  showMore = false,
  selectedEntityType?: MessageEntity['type']
) {
  await ctx.editOrReply(documentationMenu(ctx, showMore, selectedEntityType));
}

_documentationModule.command('documentation', (ctx) =>
  replyWithDocumentationMenu(ctx)
);
_documentationModule.command('start').filter(
  (ctx) => ctx.match.startsWith('docs_'),
  (ctx) => {
    const [, userSelectedEntityType] = decodeDeepLinkParams(ctx.match);
    const selectedEntityType = Object.prototype.hasOwnProperty.call(
      entities,
      userSelectedEntityType
    )
      ? (userSelectedEntityType as MessageEntity['type'])
      : undefined;
    const showMore =
      selectedEntityType && !entitiesShownByDefault.has(selectedEntityType);

    return replyWithDocumentationMenu(ctx, showMore, selectedEntityType);
  }
);

export const documentationMenuCb = callbacksBag.makeCallback<
  [showMore: boolean, selectedEntityType?: MessageEntity['type']]
>('load', (ctx) => {
  const [showMore, selectedEntityType] = ctx.callbackParams;
  return replyWithDocumentationMenu(ctx, showMore, selectedEntityType);
});
