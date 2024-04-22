import { Bot } from 'grammy';
import { MyContext } from './types/grammy';

if (!process.env.BOT_TOKEN) {
  throw new Error('Bot token not found');
}

export const bot = new Bot<MyContext>(process.env.BOT_TOKEN);
