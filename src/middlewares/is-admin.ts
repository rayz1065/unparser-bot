import { Context, Middleware } from 'grammy';

export function isAdmin(ctx: Context): boolean {
  const userId = ctx.from?.id;
  if (!userId) {
    return false;
  }
  const adminUserId = process.env.ADMIN_USER_ID;
  if (!adminUserId) {
    return false;
  }
  return userId === +adminUserId;
}

export const ensureAdmin: Middleware<Context> = async (ctx, next) => {
  const userId = ctx.from?.id;
  if (!userId) {
    return;
  }
  const adminUserId = process.env.ADMIN_USER_ID;
  if (adminUserId && userId === +adminUserId) {
    await next();
  }
};
