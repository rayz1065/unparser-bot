import { Conversation, ConversationFlavor } from '@grammyjs/conversations';
import { I18nFlavor } from '@grammyjs/i18n';
import { ParseModeFlavor } from '@grammyjs/parse-mode';
import { Context, SessionFlavor } from 'grammy';
import { StoredChatFlavor } from '../middlewares/store-telegram-chat';
import { AuthenticatedFlavor } from '../middlewares/authenticate';
import { ConversationUtilsFlavor } from '../lib/conversations-utils';
import { TgCallbackFlavor } from '../lib/tg-callback';
import { TgComponentsFlavor } from '../lib/components/tg-components-middleware';
import { EditOrReplyFlavor } from '../../../tg-components-plugin/out/types';

export type MySessionData = Record<string, never>;

export type MyBaseContext = TgComponentsFlavor<
  ParseModeFlavor<ConversationFlavor<Context>>
> &
  SessionFlavor<MySessionData> &
  I18nFlavor &
  ConversationUtilsFlavor &
  TgCallbackFlavor &
  EditOrReplyFlavor;

export type MyContext = MyBaseContext & StoredChatFlavor & AuthenticatedFlavor;

export type MyConversation = Conversation<MyContext>;
