import { Bot, session } from 'grammy';
import { hydrateReply, parseMode } from '@grammyjs/parse-mode';
import { conversations } from '@grammyjs/conversations';
import { authenticate } from './middlewares/authenticate';
import { PrismaAdapter } from '@grammyjs/storage-prisma';
import { prisma } from './prisma';
import { i18n } from './i18n';
import { storeTelegramChat } from './middlewares/store-telegram-chat';
import { createContextConstructor, MyContext } from './context';
import { editOrReplyMiddleware } from 'grammy-edit-or-reply';
import { TgError, defaultTgErrorHandler } from './lib/tg-error';
import { tgComponentsMiddleware } from 'grammy-tg-components';
import { mainMenuModule } from './modules/main-menu';
import { appConfig } from './config';
import { logger } from './logger';

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

  // unexpected unhandled callback data
  protectedBot.on('callback_query:data', async (ctx, next) => {
    ctx.logger.warn({ data: ctx.callbackQuery.data }, 'No match for data');
    await next();
  });

  return bot;
}
