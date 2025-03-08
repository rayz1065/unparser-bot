import { Composer } from 'grammy';
import { MyContext } from '../context.js';
import { TgCallbacksBag } from 'grammy-tg-components';
import { settingsMenuCb } from './settings.js';

export const mainMenuModule = new Composer<MyContext>();
const _mainMenuModule = mainMenuModule.chatType(['private']);
const _callbacksModule = new TgCallbacksBag<MyContext>('menu');
_mainMenuModule.use(_callbacksModule);

async function replyWithMainMenu(ctx: MyContext) {
  await ctx.editOrReply({
    text: ctx.t('welcome-message'),
    keyboard: [[settingsMenuCb.getBtn(ctx.t('menu-settings'))]],
    link_preview_options: { is_disabled: true },
  });
}

_mainMenuModule.command('start', (ctx) => replyWithMainMenu(ctx));
export const mainMenuCb = _callbacksModule.makeCallback('m', (ctx) =>
  replyWithMainMenu(ctx)
);
