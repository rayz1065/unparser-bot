import { Update, UserFromGetMe } from '@grammyjs/types';
import { Api, Context, SessionFlavor } from 'grammy';
import { I18nFlavor } from '@grammyjs/i18n';
import { ParseModeFlavor } from '@grammyjs/parse-mode';
import { AppConfig, AppConfigFlavor } from './config.js';
import { TgCallbackFlavor, TgComponentsFlavor } from 'grammy-tg-components';
import { Conversation, ConversationFlavor } from '@grammyjs/conversations';
import { EditOrReplyFlavor } from 'grammy-edit-or-reply';
import { StoredChatFlavor } from './middlewares/store-telegram-chat.js';
import { AuthenticatedFlavor } from './middlewares/authenticate.js';
import { Logger, LoggerFlavor } from './logger.js';
import { SplitAndReplyFlavor } from './lib/split-and-reply.js';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SessionData {
  // field?: string;
}

type ExtendedContextFlavor = AppConfigFlavor & LoggerFlavor;

interface Dependencies {
  config: AppConfig;
  logger: Logger;
}

export type MySessionData = Record<string, never>;

export type MyBaseContext = TgComponentsFlavor<
  SplitAndReplyFlavor<ParseModeFlavor<ConversationFlavor<Context>>>
> &
  SessionFlavor<MySessionData> &
  I18nFlavor &
  TgCallbackFlavor &
  EditOrReplyFlavor &
  ExtendedContextFlavor;

export type MyContext = MyBaseContext & StoredChatFlavor & AuthenticatedFlavor;

export type MyConversation = Conversation<MyContext>;

export function createContextConstructor({ config, logger }: Dependencies) {
  return class extends Context implements ExtendedContextFlavor {
    config: AppConfig;
    logger: Logger;

    constructor(update: Update, api: Api, me: UserFromGetMe) {
      super(update, api, me);
      this.config = config;
      this.logger = logger.child({
        update_id: this.update.update_id,
      });
    }
  } as unknown as new (
    update: Update,
    api: Api,
    me: UserFromGetMe
  ) => MyContext;
}
