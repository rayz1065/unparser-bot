import { Conversation, ConversationFlavor } from '@grammyjs/conversations';
import { I18nFlavor } from '@grammyjs/i18n';
import { ParseModeFlavor } from '@grammyjs/parse-mode';
import { User } from '@prisma/client';
import { Context, SessionFlavor } from 'grammy';

export type MySessionData = Record<string, never>;

export type MyContext = ParseModeFlavor<
  SessionFlavor<MySessionData> & ConversationFlavor<Context> & I18nFlavor
> & {
  callbackParams: any;
  dbUser: User;
  conversationData?: {
    messageId?: number;
  } & Record<string, any>;
};

export type MyConversation = Conversation<MyContext>;
