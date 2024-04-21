import { I18n } from '@grammyjs/i18n';
import { MyContext } from './types/grammy';
import path from 'path';
import { escapeHtml } from './lib/utils';

// set up translations
export const i18n = new I18n<MyContext>({
  defaultLocale: process.env.DEFAULT_LOCALE ?? 'en',
  directory: path.join(__dirname, 'i18n'),
  fluentBundleOptions: {
    useIsolating: false,
  },
  localeNegotiator: (ctx) =>
    ctx.dbUser?.language ?? ctx.from?.language_code ?? 'en',
  globalTranslationContext(ctx) {
    return {
      'user-name': escapeHtml(ctx.from?.first_name ?? ''),
    };
  },
});
