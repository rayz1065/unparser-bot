import { InlineKeyboardButton, InlineKeyboardMarkup } from 'grammy/types';

export function makeId(length: number) {
  const res = [];
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    res.push(chars.charAt(Math.floor(Math.random() * chars.length)));
  }
  return res.join('');
}

export function escapeHtml(text: string) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
  };

  return text.replace(/[&<>]/g, (m) => map[m as keyof typeof map]);
}

export function ik(keyboard: InlineKeyboardButton[][]): {
  reply_markup: InlineKeyboardMarkup;
} {
  return { reply_markup: { inline_keyboard: keyboard } };
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
