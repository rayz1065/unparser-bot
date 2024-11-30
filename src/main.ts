import { Bot, session } from 'grammy';
import { hydrateReply, parseMode } from '@grammyjs/parse-mode';
import { conversations } from '@grammyjs/conversations';
import { authenticate } from './middlewares/authenticate.js';
import { PrismaAdapter } from '@grammyjs/storage-prisma';
import { prisma } from './prisma.js';
import { i18n } from './i18n.js';
import { storeTelegramChat } from './middlewares/store-telegram-chat.js';
import { createContextConstructor, MyContext } from './context.js';
import { editOrReplyMiddleware } from 'grammy-edit-or-reply';
import { TgError, defaultTgErrorHandler } from './lib/tg-error.js';
import { tgComponentsMiddleware } from 'grammy-tg-components';
import { mainMenuModule } from './modules/main-menu.js';
import { appConfig } from './config.js';
import { logger } from './logger.js';
import {
  unparseBothModule,
  unparseHtmlModule,
  unparseMdModule,
} from './modules/unparse/index.js';
import { fallbackModule } from './modules/fallback.js';
import { unparseTranspileModule } from './modules/unparse/transpile.js';
import { unparseEntitiesModule } from './modules/unparse/entities.js';
import { splitAndReply } from './lib/split-and-reply.js';
import { inlineModule } from './modules/inline.js';
import { unparserInlineModule } from './modules/unparse/inline.js';

export function buildBot() {
  const bot = new Bot<MyContext>(appConfig.BOT_TOKEN, {
    ContextConstructor: createContextConstructor({
      config: appConfig,
      logger,
    }),
  });
  bot.api.config.use(parseMode('HTML'));

  const protectedBot = bot.errorBoundary((error) => {
    if (error.message.indexOf('message is not modified:') !== -1) {
      return;
    }

    error.ctx.logger.error(
      {
        error: error.error,
        update: error.ctx.update,
        stack: error.stack,
      },
      'Error boundary caught error'
    );
  });

  protectedBot.use(
    session({
      initial: () => ({}),
      storage: new PrismaAdapter(prisma.session),
    })
  );

  protectedBot.use(hydrateReply);
  protectedBot.use(splitAndReply());
  protectedBot.use(i18n);
  protectedBot.use(storeTelegramChat);
  protectedBot.use(authenticate);
  protectedBot.use(conversations());
  protectedBot.use(
    tgComponentsMiddleware({
      eventRejectionHandler: async (ctx, error) => {
        const tgError = new TgError(error.message, error.variables);
        await defaultTgErrorHandler(ctx, tgError);
      },
    })
  );
  protectedBot.use(editOrReplyMiddleware());

  // modules
  protectedBot.use(mainMenuModule);
  protectedBot.use(unparseHtmlModule);
  protectedBot.use(unparseMdModule);
  protectedBot.use(unparseBothModule);
  protectedBot.use(unparseTranspileModule);
  protectedBot.use(unparseEntitiesModule);
  protectedBot.use(inlineModule);
  protectedBot.use(unparserInlineModule);
  protectedBot.use(fallbackModule);

  // unexpected unhandled callback data
  protectedBot.on('callback_query:data', async (ctx, next) => {
    ctx.logger.warn({ data: ctx.callbackQuery.data }, 'No match for data');
    await next();
  });

  return bot;
}
