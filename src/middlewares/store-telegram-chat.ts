import { Context, Middleware } from 'grammy';
import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { Chat } from 'grammy/types';

// add any missing includes here
const telegramChatInclude = {} as const satisfies Prisma.TelegramChatInclude;

// compute the result of including the above
type ChatIncludeResult<T extends Prisma.TelegramChatInclude> = Awaited<
  ReturnType<typeof prisma.telegramChat.findFirstOrThrow<{ include: T }>>
>;
type TelegramChatWithIncludes = ChatIncludeResult<typeof telegramChatInclude>;

// resulting flavor
export type StoredChatFlavor = {
  dbChat: TelegramChatWithIncludes;
};

export async function upsertTelegramChat(chat: Chat) {
  let updateData: Prisma.TelegramChatCreateInput = {
    type: chat.type,
    title: null,
    username: null,
    first_name: null,
    last_name: null,
    is_forum: null,
  };

  if (chat.type === 'channel') {
    updateData = {
      ...updateData,
      title: chat.title,
      username: chat.username,
    };
  } else if (chat.type === 'group') {
    updateData = {
      ...updateData,
      title: chat.title,
    };
  } else if (chat.type === 'supergroup') {
    updateData = {
      ...updateData,
      is_forum: chat.is_forum,
      title: chat.title,
      username: chat.username,
    };
  } else if (chat.type === 'private') {
    updateData = {
      ...updateData,
      first_name: chat.first_name,
      last_name: chat.last_name,
      username: chat.username,
    };
  }

  let dbChat: TelegramChatWithIncludes;
  try {
    dbChat = await prisma.telegramChat.update({
      where: { id: chat.id },
      data: updateData,
      include: telegramChatInclude,
    });
  } catch (error) {
    dbChat = await prisma.telegramChat.create({
      data: {
        ...updateData,
        id: chat.id,
      },
      include: telegramChatInclude,
    });
  }

  return { chat: dbChat };
}

export async function getChatFromUpdate(ctx: Context) {
  if (!ctx.chat) {
    throw new Error('Ctx does not have a chat field');
  }

  return upsertTelegramChat(ctx.chat);
}

export const storeTelegramChat: Middleware<Context & StoredChatFlavor> = async (
  ctx,
  next
) => {
  if (ctx.chat) {
    const { chat } = await getChatFromUpdate(ctx);
    ctx.dbChat = chat;
  }

  await next();
};
