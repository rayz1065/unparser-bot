import { Composer } from 'grammy';
import { ik } from '../lib/utils';
import { MyContext } from '../types/grammy';
import { TgCallback, tgLazyCallbackMiddleware } from '../lib/tg-callback';

export const mainMenuModule = new Composer<MyContext>();
const _mainMenu = mainMenuModule.chatType(['private']);

_mainMenu.command('start', async (ctx) => {
  await ctx.reply('Hello world!', ik([[helloCb.getBtn('Hello!')]]));
});

const helloCb = new TgCallback('hello', async (ctx) => {
  await ctx.answerCallbackQuery('Hello!');
});

_mainMenu
  .on('callback_query:data')
  .lazy(tgLazyCallbackMiddleware([helloCb].map((x) => x.setPrefix('menu'))));
