import { Bot, session } from 'grammy';
import { hydrateReply } from '@grammyjs/parse-mode';
import { conversations } from '@grammyjs/conversations';
import { authenticate } from './middlewares/authenticate';
import { PrismaAdapter } from '@grammyjs/storage-prisma';
import { prisma } from './prisma';
import { i18n } from './i18n';
import { storeTelegramChat } from './middlewares/store-telegram-chat';
import { MyContext } from './types/grammy';
import { editOrReplyMiddleware } from 'grammy-edit-or-reply';
import { TgError, defaultTgErrorHandler } from './lib/tg-error';
import { tgComponentsMiddleware } from 'grammy-tg-components';
import { mainMenuModule } from './modules/main-menu';
import {
  unparseBothModule,
  unparseHtmlModule,
  unparseMdModule,
} from './modules/unparse';
import { fallbackModule } from './modules/fallback';
import { unparseTranspileModule } from './modules/unparse/transpile';
import { unparseEntitiesModule } from './modules/unparse/entities';
import { splitAndReply } from './lib/split-and-reply';
import { inlineModule } from './modules/inline';
import { unparserInlineModule } from './modules/unparse/inline';

export function configureBot(bot: Bot<MyContext>) {
  bot.use(
    session({
      initial: () => ({}),
      storage: new PrismaAdapter(prisma.session),
    })
  );

  bot.use(hydrateReply);
  bot.use(splitAndReply());
  bot.use(i18n);
  bot.use(storeTelegramChat);
  bot.use(authenticate);
  bot.use(conversations());
  bot.use(
    tgComponentsMiddleware({
      eventRejectionHandler: async (ctx, error) => {
        const tgError = new TgError(error.message, error.variables);
        await defaultTgErrorHandler(ctx, tgError);
      },
    })
  );
  bot.use(editOrReplyMiddleware());

  // modules
  bot.use(mainMenuModule);
  bot.use(unparseHtmlModule);
  bot.use(unparseMdModule);
  bot.use(unparseBothModule);
  bot.use(unparseTranspileModule);
  bot.use(unparseEntitiesModule);
  bot.use(inlineModule);
  bot.use(unparserInlineModule);
  bot.use(fallbackModule);

  // unexpected unhandled callback data
  bot.on('callback_query:data', async (ctx, next) => {
    console.warn('No match for data', ctx.callbackQuery.data);
    await next();
  });

  bot.catch((error) => {
    if (error.message.indexOf('message is not modified:') !== -1) {
      return;
    }
    console.error(error);
  });
}
