import { EventRejectionError } from '../errors';
import { TgFormField, tgFormFieldDefaultProps } from './tg-form-field';
import { GetPropsType, GetStateType, TgComponent } from '../tg-components';
import { ExpandableComponent } from '../expandable-component';
import { MakeOptional } from '../types';
import { InlineKeyboardButton } from 'grammy/types';
import {
  TextKeyboardParsingError,
  parseTextualKeyboard,
  printTextualKeyboard,
} from '../../text-keyboard';
import { escapeHtml } from '../utils';
import { Context, Filter, InlineKeyboard } from 'grammy';

type KeyboardTgFormField = TgFormField<InlineKeyboardButton[][]>;
const KeyboardTgFormField = TgFormField<InlineKeyboardButton[][]>;

type Props = GetPropsType<KeyboardTgFormField>;

type State = GetStateType<KeyboardTgFormField>;

export const tgKeyboardFormDefaultProps = {
  ...tgFormFieldDefaultProps,
  textPrinter: (props, state) =>
    (state.expanded ? `<u>${props.label}</>` : props.label) +
    ': ' +
    (state.value !== null
      ? `<code>${printTextualKeyboard(state.value)}</code>`
      : `<i>${props.placeholder}</>`) +
    '\n' +
    (state.expanded ? props.description : ''),
  inlineValuePrinter: (props, state) =>
    `${state.value ? '⌨️' : '🌫'}` +
    (state.expanded && state.value !== null ? ' 🗑' : ''),
} satisfies Partial<Props>;

/**
 * A form field to input an inline keyboard in the style of `TgFormField`.
 * When a text input is received it will be checked whether the value is a
 * valid keyboard, otherwise `EventRejectionError` will be raised from the
 * handler.
 *
 * Example:
 * ```ts
 * this.keyboardField = this.makeChild('kb', TgKeyboardFormField, {
 *   label: "Keyboard",
 * });
 * this.keyboardField.overrideHandler(
 *   this.keyboardField.handlers.onTextInput,
 *   this.testKeyboardAndSet.bind(this)
 * );
 * ```
 */
export class TgKeyboardFormField
  extends TgComponent<State, Props>
  implements ExpandableComponent
{
  handlers = {
    onTextInput: {
      permanentId: 't',
      handler: this.onTextInput.bind(this),
    },
  };

  public field: KeyboardTgFormField;

  constructor(
    props: MakeOptional<Props, keyof typeof tgKeyboardFormDefaultProps>
  ) {
    super({ ...tgKeyboardFormDefaultProps, ...props });

    this.field = this.addChild(
      'f',
      new TgFormField({
        ...this.props,
        ...this.getEventProps('f'),
        getState: () => this.props.getState(),
        setState: (state) => this.props.setState(state),
      })
    );

    this.field.overrideHandler(this.field.handlers.onTextInput, (...args) =>
      this.handle(this.handlers.onTextInput, ...args)
    );
  }

  public getDefaultState() {
    return this.field.getDefaultState();
  }

  public isExpanded() {
    return this.field.isExpanded();
  }

  public collapse() {
    return this.field.collapse();
  }

  public expand() {
    return this.field.expand();
  }

  public toggleExpanded() {
    return this.field.toggleExpanded();
  }

  /**
   * Called when a text input is passed. Will raise `EventRejectionError` if
   * the passed text is not a valid keyboard.
   */
  public onTextInput(messageCtx: Filter<Context, 'message:text'>) {
    let value: InlineKeyboard;
    const {
      message: { text },
    } = messageCtx;

    try {
      value = parseTextualKeyboard(text);
    } catch (error) {
      if (!(error instanceof TextKeyboardParsingError)) {
        throw error;
      }

      throw new EventRejectionError('tgc-errors-keyboard-parsing-error', {
        row: error.rowIdx + 1,
        col: error.colIdx + 1,
        button: escapeHtml(error.button),
      });
    }

    this.patchState({
      value: value.inline_keyboard,
    });

    this.collapse();
  }

  public render() {
    return this.field.render();
  }
}
