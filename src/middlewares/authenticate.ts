import { Middleware } from 'grammy';
import { prisma } from '../prisma';
import { MyContext } from '../types/grammy';

const userInclude = undefined as never;

export async function getUserFromUpdate(ctx: MyContext) {
  if (!ctx.from) {
    throw new Error('Ctx does not have a from field');
  }

  const from = ctx.from;
  let user: MyContext['dbUser'];
  const updateData = {
    first_name: from.first_name,
    last_name: from.last_name,
    username: from.username,
  };

  try {
    user = await prisma.user.update({
      where: { telegram_chat_id: from.id },
      data: updateData,
      include: userInclude,
    });
  } catch (error) {
    user = await prisma.user.create({
      data: {
        telegram_chat_id: from.id,
        ...updateData,
        language: from.language_code,
        is_personal_chat_open: ctx.chat?.id === from.id,
      },
      include: userInclude,
    });
  }

  return user;
}

export const authenticate: Middleware<MyContext> = async (ctx, next) => {
  if (!ctx.from) {
    return;
  }

  const user = await getUserFromUpdate(ctx);
  ctx.dbUser = user;
  await ctx.i18n.renegotiateLocale();
  await next();
};
