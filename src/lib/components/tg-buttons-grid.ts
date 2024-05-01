import { InlineKeyboard } from 'grammy';
import { InlineKeyboardButton } from 'grammy/types';

/**
 * Makes a grid out of the buttons passed as input.
 */
export function tgButtonsGrid(
  items: InlineKeyboardButton[],
  options?: { columns?: number }
) {
  options ??= {};
  const columns = options.columns ?? 2;
  const buttons = new InlineKeyboard();

  items.forEach((item, idx) => {
    buttons.add(item);
    if ((idx + 1) % columns === 0 || idx + 1 === items.length) {
      buttons.row();
    }
  });

  return buttons.inline_keyboard;
}
