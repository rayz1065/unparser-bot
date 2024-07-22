import { Context, Middleware } from 'grammy';
import { appConfig } from '../config';

export function isAdmin(ctx: Context): boolean {
  const userId = ctx.from?.id;
  if (!userId) {
    return false;
  }
  const adminUserIds = appConfig.ADMIN_USER_IDS;

  return adminUserIds.includes(userId);
}

export function ensureAdmin(): Middleware<Context> {
  return (ctx, next) => {
    if (isAdmin(ctx)) {
      return next();
    }
  };
}
