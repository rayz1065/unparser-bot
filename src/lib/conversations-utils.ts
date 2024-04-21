import { InlineKeyboardButton, Message } from 'grammy/types';
import { MyContext, MyConversation } from '../types/grammy';

/**
 * tries deleting the a message, on failure clears the message id
 * so that a new message can be sent
 */
export async function conversationDelete(ctx: MyContext, messageId: number) {
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
  ctx: MyContext,
  ...args: Parameters<MyContext['editMessageText']>
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
  conversation: MyConversation,
  message?: Message
) {
  if (message?.text && message.text.startsWith('/')) {
    await conversation.skip();
  }
}

type MaybePromise<T> = Promise<T> | T;

export async function tgValidate(
  conversation: MyConversation,
  ctx: MyContext,
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
