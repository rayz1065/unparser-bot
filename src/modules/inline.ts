import { Composer, InlineKeyboard, InlineQueryResultBuilder } from 'grammy';
import { MyContext } from '../context.js';
import { unparseGetInlineResults } from './unparse/inline.js';

export const inlineModule = new Composer<MyContext>();

inlineModule.on('inline_query').filter(
  (ctx) => ctx.inlineQuery.query === '',
  async (ctx) => {
    await ctx.answerInlineQuery(
      [
        InlineQueryResultBuilder.article('help', ctx.t('inline-help'), {
          description: ctx.t('inline-help-description'),
          reply_markup: new InlineKeyboard().switchInlineCurrent(
            ctx.t('inline-help-parse-some-text')
          ),
        }).text(ctx.t('inline-help-text')),
      ],
      { cache_time: 0 }
    );
  }
);

inlineModule.on('inline_query', async (ctx) => {
  await ctx.answerInlineQuery(unparseGetInlineResults(ctx), {
    cache_time: 0,
  });
});
