import { Context, Middleware } from 'grammy';
import { prisma } from '../prisma';
import { Prisma } from '@prisma/client';
import { I18nFlavor } from '@grammyjs/i18n';

// add any missing includes here
const userInclude: Prisma.UserInclude = {
  telegram_chat: true,
} as const;

// compute the result of including the above
type UserIncludeResult<T extends Prisma.UserInclude> = Awaited<
  ReturnType<typeof prisma.user.findFirstOrThrow<{ include: T }>>
>;
type UserWithIncludes = UserIncludeResult<typeof userInclude>;

// resulting flavor
export interface AuthenticatedFlavor {
  dbUser: UserWithIncludes;
}

export async function getUserFromUpdate(ctx: Context) {
  if (!ctx.from) {
    throw new Error('Ctx does not have a from field');
  }

  const isPersonalChatOpenUpdate =
    ctx.chat?.id === ctx.from.id ? true : undefined; // don't update if not needed

  const from = ctx.from;
  let user: UserWithIncludes;
  const updateData = {
    is_bot: from.is_bot,
    is_premium: from.is_premium ?? false,
    added_to_attachment_menu: from.added_to_attachment_menu ?? false,
    telegram_language_code: from.language_code ?? null,
    is_personal_chat_open: isPersonalChatOpenUpdate,
  } as const satisfies Prisma.UserUpdateInput;

  try {
    user = await prisma.user.update({
      where: { telegram_chat_id: from.id },
      data: updateData,
      include: userInclude,
    });
  } catch (error) {
    const createData: Prisma.UserCreateInput = {
      ...updateData,
      is_personal_chat_open: updateData.is_personal_chat_open ?? false,
      language:
        updateData.telegram_language_code ?? process.env.DEFAULT_LOCALE ?? 'en',
      telegram_chat: {
        connectOrCreate: {
          where: { id: from.id },
          create: {
            id: from.id,
            type: 'private',
            first_name: from.first_name,
            last_name: from.last_name,
            username: from.username,
            is_forum: null,
            title: null,
          },
        },
      },
    };

    user = await prisma.user.create({
      data: createData,
      include: userInclude,
    });
  }

  return user;
}

export const authenticate: Middleware<
  Context & AuthenticatedFlavor & I18nFlavor
> = async (ctx, next) => {
  if (ctx.from) {
    ctx.dbUser = await getUserFromUpdate(ctx);
    await ctx.i18n.renegotiateLocale();
  }

  await next();
};
