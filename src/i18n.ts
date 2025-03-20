import { I18n } from '@grammyjs/i18n';
import { MyContext } from './context.js';
import path from 'path';
import { escapeHtml } from './lib/utils.js';

const __dirname = import.meta.dirname;

// set up translations
export const i18n = new I18n<MyContext>({
  directory: path.join(__dirname, 'i18n'),
  fluentBundleOptions: {
    useIsolating: false,
  },
  localeNegotiator: (ctx) =>
    ctx.dbUser?.language ??
    ctx.from?.language_code ??
    ctx.config.DEFAULT_LOCALE,
  globalTranslationContext(ctx) {
    return {
      'user-name': escapeHtml(ctx.from?.first_name ?? ''),
      'bot-username': ctx.me.username,
    };
  },
});
