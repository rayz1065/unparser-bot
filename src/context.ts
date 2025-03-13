import { Context, SessionFlavor } from 'grammy';
import { I18nFlavor } from '@grammyjs/i18n';
import { ParseModeFlavor } from '@grammyjs/parse-mode';
import { AppConfigFlavor } from './config.js';
import { TgCallbackFlavor, TgComponentsFlavor } from 'grammy-tg-components';
import { Conversation, ConversationFlavor } from '@grammyjs/conversations';
import { EditOrReplyFlavor } from 'grammy-edit-or-reply';
import { StoredChatFlavor } from './middlewares/store-telegram-chat.js';
import { AuthenticatedFlavor } from './middlewares/authenticate.js';
import { LoggerFlavor } from './logger.js';

export type MySessionData = Record<string, never>;

export type MyContext = TgComponentsFlavor<
  ParseModeFlavor<ConversationFlavor<Context>>
> &
  SessionFlavor<MySessionData> &
  I18nFlavor &
  TgCallbackFlavor &
  EditOrReplyFlavor &
  AppConfigFlavor &
  LoggerFlavor &
  StoredChatFlavor &
  AuthenticatedFlavor;

export type MyConversation = Conversation<MyContext>;
