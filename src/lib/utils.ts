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

export function previewOptions(options: LinkPreviewOptions): {
  link_preview_options: LinkPreviewOptions;
} {
  return {
    link_preview_options: options,
  };
}

export function noPreview(): { link_preview_options: LinkPreviewOptions } {
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
