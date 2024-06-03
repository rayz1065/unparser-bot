import { EventRejectionError } from '../errors';
import { TgFormField, tgFormFieldDefaultProps } from './tg-form-field';
import { GetPropsType, GetStateType, TgComponent } from '../tg-components';
import { ExpandableComponent } from '../expandable-component';
import { MakeOptional } from '../types';
import { Context, Filter } from 'grammy';

type NumberTgFormField = TgFormField<number>;
const NumberTgFormField = TgFormField<number>;

type Props = GetPropsType<NumberTgFormField> & {
  integer: boolean;
};

type State = GetStateType<NumberTgFormField>;

export const tgNumberFormDefaultProps = {
  ...tgFormFieldDefaultProps,
  integer: false,
} satisfies Partial<Props>;

/**
 * A simple form field containing a number with the style of `TgFormField`.
 * When a text input is received it will be checked whether the value satisfies
 * the field restrictions (numeric, integer if `props.integer`), otherwise an
 * `EventRejectionError` will be raised from the handler.
 *
 * Example:
 * ```ts
 * this.numericField = this.makeChild('n', TgNumberFormField, {
 *   ctx,
 *   label: 'numeric',
 *   integer: true,
 * });
 * ```
 */
export class TgNumberFormField
  extends TgComponent<State, Props>
  implements ExpandableComponent
{
  handlers = {
    onTextInput: {
      permanentId: 't',
      handler: this.onTextInput.bind(this),
    },
  };

  public field: NumberTgFormField;

  constructor(
    props: MakeOptional<Props, keyof typeof tgNumberFormDefaultProps>
  ) {
    super({ ...tgNumberFormDefaultProps, ...props });

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
   * the passed text is not a valid number (or a valid integer).
   */
  public onTextInput(messageCtx: Filter<Context, 'message:text'>) {
    const {
      message: { text },
    } = messageCtx;

    const value = Number(text);
    if (isNaN(value)) {
      throw new EventRejectionError('tgc.errors.value-is-not-numeric', {
        value,
      });
    }

    if (this.props.integer && !Number.isInteger(value)) {
      throw new EventRejectionError('tgc.errors.value-is-not-integer', {
        value,
      });
    }

    this.patchState({
      value,
    });

    this.collapse();
  }

  public render() {
    return this.field.render();
  }
}
