import { User } from 'grammy/types';

/**
 * Replaces all the inline mentions present in the text with ones of the
 * specified user.
 */
export function replaceMentions(user: User, text: string) {
  return text.replace(/tg:\/\/user\?id=(\d+)/g, () => {
    return `tg://user?id=${user.id}`;
  });
}
