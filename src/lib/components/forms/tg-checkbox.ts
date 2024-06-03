import { ExpandableComponent } from '../expandable-component';
import { GetPropsType, GetStateType, TgComponent } from '../tg-components';
import { MakeOptional } from '../types';
import { TgFormField, tgFormFieldDefaultProps } from './tg-form-field';

type BooleanTgFormField = TgFormField<boolean>;
const BooleanTgFormField = TgFormField<boolean>;

type State = GetStateType<BooleanTgFormField>;

type Props = GetPropsType<BooleanTgFormField>;

export const tgCheckboxDefaultProps = {
  ...tgFormFieldDefaultProps,
  inlineValuePrinter: (props, state) => (state.value ? '✅' : '❌'),
  textPrinter: (props, state) =>
    (state.expanded ? `<u>${props.label}</>` : props.label) +
    ': ' +
    (state.value ? '✅' : '❌') +
    '\n' +
    (state.expanded ? props.description : ''),
  defaultValue: false,
} satisfies Partial<Props>;

/**
 * A simple checkbox component with the style of `TgFormField`.
 * Clicking on the label will expand the field but will not request any text
 * input. Clicking on the value will collapse the field and toggle the state.
 *
 * By default ✅ and ❌ are used to indicate the state.
 *
 * Example:
 * ```ts
 * this.checkboxField = this.makeChild('c', TgCheckbox, {
 *   ctx,
 *   label: 'check',
 * });
 * ```
 */
export class TgCheckbox
  extends TgComponent<State, Props>
  implements ExpandableComponent
{
  handlers = {
    onValueClick: {
      permanentId: 'v',
      handler: this.onValueClick.bind(this),
    },
  };

  public field: TgFormField<boolean>;

  constructor(props: MakeOptional<Props, keyof typeof tgCheckboxDefaultProps>) {
    super({ ...tgCheckboxDefaultProps, ...props });

    this.field = this.addChild(
      'f',
      new BooleanTgFormField({
        ...this.props,
        ...this.getEventProps('f'),
        getState: () => this.getState(),
        setState: (state) => this.setState(state),
        // no need to listen for text inputs
        listenForMessageInput: undefined,
      })
    );

    this.field.overrideHandler(this.field.handlers.onValueClick, (...args) =>
      this.handle(this.field.handlers.onValueClick, ...args)
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
   * Called when the value is clicked, switches the state of the checkbox.
   */
  public onValueClick() {
    const state = this.getState();
    this.patchState({
      value: !state.value,
    });

    this.collapse();
  }

  public render() {
    return this.field.render();
  }
}
