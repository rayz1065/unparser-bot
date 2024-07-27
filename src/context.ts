import { Update, UserFromGetMe } from '@grammyjs/types';
import { Api, Context, SessionFlavor } from 'grammy';
import { I18nFlavor } from '@grammyjs/i18n';
import { ParseModeFlavor } from '@grammyjs/parse-mode';
import { AppConfig, AppConfigFlavor } from './config';
import { TgCallbackFlavor, TgComponentsFlavor } from 'grammy-tg-components';
import { Conversation, ConversationFlavor } from '@grammyjs/conversations';
import { EditOrReplyFlavor } from 'grammy-edit-or-reply';
import { StoredChatFlavor } from './middlewares/store-telegram-chat';
import { AuthenticatedFlavor } from './middlewares/authenticate';

export interface SessionData {
  // field?: string;
}

type ExtendedContextFlavor = AppConfigFlavor;

interface Dependencies {
  config: AppConfig;
}

export type MySessionData = Record<string, never>;

export type MyBaseContext = TgComponentsFlavor<
  ParseModeFlavor<ConversationFlavor<Context>>
> &
  SessionFlavor<MySessionData> &
  I18nFlavor &
  TgCallbackFlavor &
  EditOrReplyFlavor &
  ExtendedContextFlavor;

export type MyContext = MyBaseContext & StoredChatFlavor & AuthenticatedFlavor;

export type MyConversation = Conversation<MyContext>;

export function createContextConstructor({ config }: Dependencies) {
  return class extends Context implements ExtendedContextFlavor {
    config: AppConfig;

    constructor(update: Update, api: Api, me: UserFromGetMe) {
      super(update, api, me);
      this.config = config;
    }
  } as unknown as new (
    update: Update,
    api: Api,
    me: UserFromGetMe
  ) => MyContext;
}
