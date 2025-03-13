import { Bot, session } from 'grammy';
import { hydrateReply, parseMode } from '@grammyjs/parse-mode';
import { conversations } from '@grammyjs/conversations';
import { authenticate } from './middlewares/authenticate.js';
import { PrismaAdapter } from '@grammyjs/storage-prisma';
import { storeTelegramChat } from './middlewares/store-telegram-chat.js';
import { MyContext } from './context.js';
import { editOrReplyMiddleware } from 'grammy-edit-or-reply';
import { TgError, defaultTgErrorHandler } from './lib/tg-error.js';
import { tgComponentsMiddleware } from 'grammy-tg-components';
import { mainMenuModule } from './modules/main-menu.js';
import { installConfig, AppConfig } from './config.js';
import { installLogger, Logger } from './logger.js';
import { autoAnswerCallbacks } from './lib/auto-answer-callbacks.js';
import { ignoreNotModified } from './lib/ignore-not-modified.js';
import { settingsModule } from './modules/settings.js';
import { fallbackModule } from './modules/fallback.js';
import { I18n } from '@grammyjs/i18n';
import { PrismaClient } from '@prisma/client';

interface Dependencies {
  logger: Logger;
  config: AppConfig;
  i18n: I18n<MyContext>;
  prisma: PrismaClient;
}

export function buildBot({ logger, config, i18n, prisma }: Dependencies) {
  const bot = new Bot<MyContext>(config.BOT_TOKEN);

  bot.use(installLogger(logger));
  bot.use(installConfig(config));

  bot.use((ctx, next) => {
    console.log(ctx);
    return next();
  });

  bot.api.config.use(parseMode('HTML'));
  bot.api.config.use(ignoreNotModified());

  const protectedBot = bot.errorBoundary((error) => {
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
  protectedBot.use(autoAnswerCallbacks());

  // modules
  protectedBot.use(mainMenuModule);
  protectedBot.use(settingsModule);
  protectedBot.use(fallbackModule);

  return bot;
}
