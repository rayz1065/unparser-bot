import { InlineKeyboardButton, Message } from 'grammy/types';
import { Context } from 'grammy';
import { Conversation } from '@grammyjs/conversations';

export type ConversationUtilsFlavor = {
  conversationData?: {
    messageId?: number;
  } & Record<string, any>;
};

type LocalContext = Context & ConversationUtilsFlavor;
type LocalConversation = Conversation<LocalContext>;

/**
 * tries deleting the a message, on failure clears the message id
 * so that a new message can be sent
 */
export async function conversationDelete(ctx: LocalContext, messageId: number) {
  if (!ctx.chat || !ctx.conversationData) {
    throw new Error('Conversation edit does not have relevant data');
  }

  try {
    await ctx.api.deleteMessage(ctx.chat.id, messageId);
  } catch (error) {
    // clear out the conversation message id
    ctx.conversationData.messageId = undefined;
  }
}

export async function conversationEdit(
  ctx: LocalContext,
  ...args: Parameters<LocalContext['editMessageText']>
) {
  if (!ctx.chat || !ctx.conversationData) {
    throw new Error('Conversation edit does not have relevant data');
  }

  if (ctx.conversationData.messageId) {
    await ctx.api.editMessageText(
      ctx.chat.id,
      ctx.conversationData.messageId,
      ...args
    );
  } else {
    const res = await ctx.reply(...args);
    ctx.conversationData.messageId = res.message_id;
  }
}

export async function skipCommands(
  conversation: LocalConversation,
  message?: Message
) {
  if (message?.text && message.text.startsWith('/')) {
    await conversation.skip();
  }
}

type MaybePromise<T> = Promise<T> | T;

export async function tgValidate(
  conversation: LocalConversation,
  ctx: LocalContext,
  validator: () => MaybePromise<string | undefined>,
  options?: {
    getMessage?: (error: string) => {
      text: string;
      keyboard?: InlineKeyboardButton[][];
    };
    baseText?: string;
    keyboard?: InlineKeyboardButton[][];
  }
) {
  options ??= {};
  const baseText = options.baseText ?? '';
  const keyboard = options.keyboard ?? [];
  const getMessage =
    options.getMessage ??
    ((error) => ({
      text: `${baseText}\n\n⚠️ ${error}`,
      keyboard,
    }));
  const error = await validator();
  if (error) {
    const { text, keyboard } = getMessage(error);
    try {
      await conversationEdit(ctx, text, {
        reply_markup: { inline_keyboard: keyboard ?? [] },
      });
    } finally {
      await conversation.skip({ drop: true });
    }
  }
}
