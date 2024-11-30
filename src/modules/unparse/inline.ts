import {
  Composer,
  Filter,
  InlineKeyboard,
  InlineQueryResultBuilder,
} from 'grammy';
import { MyContext } from '../../context.js';
import { InlineQueryResult } from 'grammy/types';
import { TgCallbacksBag } from 'grammy-tg-components';
import { noPreview } from '../../lib/utils.js';
import { fmt, pre } from '@grammyjs/parse-mode';

export const unparserInlineModule = new Composer<MyContext>();
const callbacksBag = new TgCallbacksBag<MyContext>('unp-inl');
unparserInlineModule.use(callbacksBag);

export function unparseGetInlineResults(
  ctx: Filter<MyContext, 'inline_query'>
): InlineQueryResult[] {
  const query = ctx.inlineQuery.query;
  if (!query) {
    return [];
  }

  const mdPrettyText = fmt`${pre(query, 'Markdown')}`;
  const htmlPrettyText = fmt`${pre(query, 'HTML')}`;
  const replyMarkup = new InlineKeyboard([
    [loadingCb.getBtn(ctx.t('inline-loading'))],
  ]);

  return [
    InlineQueryResultBuilder.article('pmd', ctx.t('inline-parse-md'), {
      description: ctx.t('inline-parse-md-description'),
      reply_markup: replyMarkup,
    }).text(mdPrettyText.text, {
      parse_mode: undefined,
      ...noPreview(),
      entities: mdPrettyText.entities,
    }),
    InlineQueryResultBuilder.article('phtml', ctx.t('inline-parse-html'), {
      description: ctx.t('inline-parse-html-description'),
      reply_markup: replyMarkup,
    }).text(htmlPrettyText.text, {
      parse_mode: undefined,
      ...noPreview(),
      entities: htmlPrettyText.entities,
    }),
  ];
}

const loadingCb = callbacksBag.makeCallback('w', async (ctx) => {
  await ctx.answerCallbackQuery({
    text: ctx.t('inline-loading-info'),
    show_alert: true,
  });
});
