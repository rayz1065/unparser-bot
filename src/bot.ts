import { Bot } from 'grammy';
import { MyContext } from './types/grammy';
import { parseMode } from '@grammyjs/parse-mode';
import { appConfig } from './config';

export const bot = new Bot<MyContext>(appConfig.BOT_TOKEN);
bot.api.config.use(parseMode('HTML'));
