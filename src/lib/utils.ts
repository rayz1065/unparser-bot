import {
  InlineKeyboardButton,
  InlineKeyboardMarkup,
  LinkPreviewOptions,
} from 'grammy/types';

export function makeId(length: number) {
  const res = [];
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    res.push(chars.charAt(Math.floor(Math.random() * chars.length)));
  }
  return res.join('');
}

/**
 * All <, > and & symbols that are not a part of a tag or an HTML entity must
 * be replaced with the corresponding HTML entities (< with &lt;, > with &gt;
 * and & with &amp;).
 */
export function escapeHtml(text: string) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
  };

  return text.replace(/[&<>]/g, (m) => map[m as keyof typeof map]);
}

/**
 * Inside the (...) part of the inline link and custom emoji definition, all
 * ')' and '\\' must be escaped with a preceding '\\' character.
 */
export function escapeMdUrl(text: string) {
  return text.replace(/[)\\]/g, (match) => '\\' + match);
}

/**
 * Inside pre and code entities, all '`' and '\\' characters must be escaped
 * with a preceding '\\' character.
 */
export function escapeMdPre(text: string) {
  return text.replace(/[`\\]/g, (match) => '\\' + match);
}

/**
 * In all other places characters '_', '*', '[', ']', '(', ')', '~', '`', '>',
 * '#', '+', '-', '=', '|', '{', '}', '.', '!' must be escaped with the
 * preceding character '\\'.
 */
export function escapeMd(text: string) {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, (match) => '\\' + match);
}

export function ik(keyboard: InlineKeyboardButton[][]): {
  reply_markup: InlineKeyboardMarkup;
} {
  return { reply_markup: { inline_keyboard: keyboard } };
}

export function previewOptions<T extends LinkPreviewOptions>(
  options: T
): { link_preview_options: T } {
  return { link_preview_options: options };
}

export function noPreview() {
  return previewOptions({ is_disabled: true });
}

export function selectedBtnText(text: string, isMatched: boolean) {
  return isMatched ? `• ${text} •` : text;
}

/**
 * Resulting array will have at most "limit" elements
 */
export function splitWithTail(str: string, separator: string, limit: number) {
  const parts = str.split(separator);
  const tail = parts.slice(limit - 1).join(separator);
  const result = parts.slice(0, limit - 1);
  result.push(tail);

  return result;
}
