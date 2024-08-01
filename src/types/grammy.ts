import { Conversation, ConversationFlavor } from '@grammyjs/conversations';
import { I18nFlavor } from '@grammyjs/i18n';
import { ParseModeFlavor } from '@grammyjs/parse-mode';
import { Context, SessionFlavor } from 'grammy';
import { StoredChatFlavor } from '../middlewares/store-telegram-chat';
import { AuthenticatedFlavor } from '../middlewares/authenticate';
import { TgCallbackFlavor } from 'grammy-tg-components';
import { TgComponentsFlavor } from 'grammy-tg-components';
import { EditOrReplyFlavor } from 'grammy-edit-or-reply';
import { SplitAndReplyFlavor } from '../lib/split-and-reply';

export type MySessionData = Record<string, never>;

export type MyBaseContext = TgComponentsFlavor<
  SplitAndReplyFlavor<ParseModeFlavor<ConversationFlavor<Context>>>
> &
  SessionFlavor<MySessionData> &
  I18nFlavor &
  TgCallbackFlavor &
  EditOrReplyFlavor;

export type MyContext = MyBaseContext & StoredChatFlavor & AuthenticatedFlavor;

export type MyConversation = Conversation<MyContext>;
