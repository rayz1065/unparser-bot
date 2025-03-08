import { Composer, InlineKeyboard } from 'grammy';
import { MyContext } from '../context';
import { TgCallbacksBag } from 'grammy-tg-components';
import { prisma } from '../prisma';
import { selectedBtnText } from '../lib/utils';
import { userInclude } from '../middlewares/authenticate';
import { mainMenuCb } from './main-menu';

export const settingsModule = new Composer<MyContext>();
const _settingsModule = settingsModule.chatType('private');
const callbacksBag = new TgCallbacksBag<MyContext>('set');
_settingsModule.use(callbacksBag);

async function updateUserLanguage(userId: number, language: string) {
  return await prisma.user.update({
    where: { id: userId },
    data: { language },
    include: userInclude,
  });
}

const supportedLanguages = [
  { code: 'en', name: 'English', flag: '🇮🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
];

async function getSettingsMsg(ctx: MyContext) {
  const setLanguageCode = (await ctx.i18n.getLocale()).toLowerCase();
  const setLanguage = supportedLanguages.find(
    (x) => x.code === setLanguageCode
  );

  const languageButtons = new InlineKeyboard();
  supportedLanguages.forEach((language) => {
    languageButtons.text(
      selectedBtnText(language.flag, setLanguageCode === language.code),
      setLanguageCb.getCb([language.code])
    );
  });

  const keyboard = new InlineKeyboard();
  keyboard.append(languageButtons.toFlowed(6));
  keyboard.row(mainMenuCb.getBtn(ctx.t('back-to-menu')));

  return {
    text:
      `<b>${ctx.t('settings-title')}</>\n\n` +
      `${ctx.t('settings-language')}: <b>${setLanguage?.name}</>`,
    keyboard: keyboard.toFlowed(2).inline_keyboard,
  };
}

export const settingsMenuCb = callbacksBag.makeCallback('menu', async (ctx) => {
  const msg = await getSettingsMsg(ctx);
  await ctx.editOrReply(msg);
});

const setLanguageCb = callbacksBag.makeCallback<[code: string]>(
  'lang',
  async (ctx) => {
    const [code] = ctx.callbackParams;
    const found = supportedLanguages.find((x) => x.code === code);
    if (found === undefined) {
      await ctx.answerCallbackQuery(ctx.t('settings-language-not-found'));
      return;
    }
    ctx.dbUser = await updateUserLanguage(ctx.dbUser.id, code);
    await ctx.i18n.renegotiateLocale();
    const msg = await getSettingsMsg(ctx);
    await ctx.editOrReply(msg);
    await ctx.answerCallbackQuery(ctx.t('settings-language-updated'));
  }
);
