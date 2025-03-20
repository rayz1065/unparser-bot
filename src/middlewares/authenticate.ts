import { Context, Middleware } from 'grammy';
import { prisma } from '../prisma.js';
import { Prisma } from '@prisma/client';
import { I18nFlavor } from '@grammyjs/i18n';
import { User } from 'grammy/types';
import { appConfig } from '../config.js';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

// add any missing includes here
export const userInclude = {
  telegram_chat: true,
} as const satisfies Prisma.UserInclude;

// compute the result of including the above
type UserIncludeResult<T extends Prisma.UserInclude> = Awaited<
  ReturnType<typeof prisma.user.findFirstOrThrow<{ include: T }>>
>;
type UserWithIncludes = UserIncludeResult<typeof userInclude>;

// resulting flavor
export interface AuthenticatedFlavor {
  dbUser: UserWithIncludes;
}

/**
 * Get the user based on the `from` received from telegram. The value of
 * `isPersonalChatOpenUpdate` will be used to fill the corresponding field in
 * the database. If `undefined` is passed:
 * - on update, no update is performed
 * - on creation, value is defaulted to `false`.
 */
export async function upsertUser(
  user: User,
  isPersonalChatOpenUpdate: boolean | undefined = undefined
) {
  let dbUser: UserWithIncludes;
  const updateData = {
    is_bot: user.is_bot,
    is_premium: user.is_premium ?? false,
    added_to_attachment_menu: user.added_to_attachment_menu ?? false,
    telegram_language_code: user.language_code ?? null,
    is_personal_chat_open: isPersonalChatOpenUpdate,
  } as const satisfies Prisma.UserUpdateInput;

  try {
    dbUser = await prisma.user.update({
      where: { telegram_chat_id: user.id },
      data: updateData,
      include: userInclude,
    });
  } catch (error) {
    if (
      !(error instanceof PrismaClientKnownRequestError) ||
      error.code !== 'P2025'
    ) {
      throw error;
    }

    const createData: Prisma.UserCreateInput = {
      ...updateData,
      is_personal_chat_open: updateData.is_personal_chat_open ?? false,
      language: updateData.telegram_language_code ?? appConfig.DEFAULT_LOCALE,
      telegram_chat: {
        connectOrCreate: {
          where: { id: user.id },
          create: {
            id: user.id,
            type: 'private',
            first_name: user.first_name,
            last_name: user.last_name,
            username: user.username,
            is_forum: null,
            title: null,
          },
        },
      },
    };

    dbUser = await prisma.user.create({
      data: createData,
      include: userInclude,
    });
  }

  return { user: dbUser };
}

export async function getUserFromUpdate(ctx: Context) {
  if (!ctx.from) {
    throw new Error('Ctx does not have a from field');
  }

  let isPersonalChatOpenUpdate =
    ctx.chat?.id === ctx.from.id ? true : undefined; // don't update if not needed

  if (ctx.myChatMember) {
    const myChatMember = ctx.myChatMember;
    const newChatMember = myChatMember.new_chat_member;
    if (myChatMember.chat.type === 'private') {
      const blocked =
        newChatMember.status === 'kicked' || newChatMember.status === 'left';

      isPersonalChatOpenUpdate = !blocked;
    }
  }

  return upsertUser(ctx.from, isPersonalChatOpenUpdate);
}

export const authenticate: Middleware<
  Context & AuthenticatedFlavor & I18nFlavor
> = async (ctx, next) => {
  if (ctx.from) {
    const { user } = await getUserFromUpdate(ctx);
    ctx.dbUser = user;
    await ctx.i18n.renegotiateLocale();
  }

  await next();
};
