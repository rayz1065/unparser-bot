import { Context, Filter } from 'grammy';
import { TgFormField } from './tg-form-field';

/**
 * A simple form field containing a string in the style of `TgFormField`.
 * No checks are performed on the passed text input. Can be used in place of
 * `TgFormField` for the simplest implementation possible of the text input
 * handler.
 */
export class TgTextFormField extends TgFormField<string> {
  /**
   * Called when text is received, updates the state and collapses the field.
   */
  onTextInput(messageCtx: Filter<Context, 'message:text'>) {
    const {
      message: { text },
    } = messageCtx;
    this.patchState({
      value: text,
    });

    this.collapse();
  }
}
