import { InlineKeyboard } from 'grammy';
import { InlineKeyboardButton } from 'grammy/types';

export class TextKeyboardParsingError extends Error {
  constructor(
    public rowIdx: number,
    public colIdx: number,
    public button: string
  ) {
    super(`Malformed '${button}' at ${rowIdx}.${colIdx}`);
  }
}

/**
 * Parses a human-readable textual inline keyboard, throws
 * `TextKeyboardParsingError` if the keyboard is malformed.
 */
export function parseTextualKeyboard(text: string) {
  const keyboard = new InlineKeyboard();
  const rows = text.trim().split('\n');
  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx];
    const buttons = row.split(' && ');

    for (let colIdx = 0; colIdx < buttons.length; colIdx++) {
      const button = buttons[colIdx];
      const buttonParts = button.split(' - ');

      if (buttonParts.length !== 2) {
        throw new TextKeyboardParsingError(rowIdx, colIdx, button);
      }
      keyboard.url(buttonParts[0], buttonParts[1]);
    }
    keyboard.row();
  }
  return keyboard;
}

/**
 * Prints an inline keyboard in a human-readable way.
 */
export function printTextualKeyboard(
  keyboard: InlineKeyboard | InlineKeyboardButton[][]
) {
  keyboard =
    'inline_keyboard' in keyboard ? keyboard.inline_keyboard : keyboard;

  return keyboard
    .map((row) =>
      row
        .filter((button) => 'url' in button)
        .map(
          (button) => `${button.text} - ${'url' in button ? button.url : '?'}`
        )
        .join(' && ')
    )
    .join('\n');
}
