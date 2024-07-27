import { Context, Middleware } from 'grammy';
import { AppConfigFlavor } from '../config';

export function isAdmin(ctx: Context & AppConfigFlavor): boolean {
  const userId = ctx.from?.id;
  if (!userId) {
    return false;
  }
  const adminUserIds = ctx.config.ADMIN_USER_IDS;

  return adminUserIds.includes(userId);
}

export function ensureAdmin(): Middleware<Context & AppConfigFlavor> {
  return (ctx, next) => {
    if (isAdmin(ctx)) {
      return next();
    }
  };
}
