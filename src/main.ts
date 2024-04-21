import { Bot, session } from 'grammy';
import { hydrateReply, parseMode } from '@grammyjs/parse-mode';
import { conversations } from '@grammyjs/conversations';
import { authenticate } from './middlewares/authenticate';
import { PrismaAdapter } from '@grammyjs/storage-prisma';
import { mainMenuModule } from './modules/main-menu';
import { MyContext } from './types/grammy';
import { prisma } from './prisma';
import { i18n } from './i18n';

if (!process.env.BOT_TOKEN) {
  throw new Error('Bot token not found');
}

// set up base bot configuration
export const bot = new Bot<MyContext>(process.env.BOT_TOKEN);
bot.use(hydrateReply);
bot.api.config.use(parseMode('HTML'));
bot.use(
  session({
    initial: () => ({}),
    storage: new PrismaAdapter(prisma.session),
  })
);

bot.errorBoundary((err) => {
  console.error(err);
});

bot.use(i18n);

// modules relating to channels (or any where user is missing)
// must be placed before the authentication module

bot.use(authenticate);

// set up conversations
bot.use(conversations());

// modules
bot.use(mainMenuModule);

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
