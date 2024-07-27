import { Composer } from 'grammy';
import { ik } from '../lib/utils';
import { MyContext } from '../context';
import { TgCallbacksBag } from 'grammy-tg-components';

export const mainMenuModule = new Composer<MyContext>();
const _mainMenuModule = mainMenuModule.chatType(['private']);
const _callbacksModule = new TgCallbacksBag<MyContext>('menu');
_mainMenuModule.use(_callbacksModule);

_mainMenuModule.command('start', async (ctx) => {
  await ctx.reply(
    'Hello world!',
    ik([
      [helloCb.getBtn('Hello!')],
      [1, 2, 3].map((x) => hello2Cb.getBtn(`hello ${x}`, x)),
      [
        {
          text: 'Test inline',
          switch_inline_query_current_chat: 'test',
        },
      ],
    ])
  );
});

const helloCb = _callbacksModule.makeCallback('hello', async (ctx) => {
  // ctx.callbackParams: never[]
  await ctx.answerCallbackQuery(
    `Hello ${ctx.dbUser.telegram_chat.first_name}!`
  );
});

const hello2Cb = _callbacksModule.makeCallback<[value: number]>(
  'hello2',
  async (ctx) => {
    // value: number
    const [value] = ctx.callbackParams;
    await ctx.answerCallbackQuery(`Hello ${value}!`);
  }
);

mainMenuModule.inlineQuery('test', async (ctx) => {
  await ctx.answerInlineQuery([
    {
      type: 'article',
      id: '1',
      input_message_content: {
        message_text: 'Hello inline mode',
      },
      title: 'Test inline',
    },
  ]);
});
