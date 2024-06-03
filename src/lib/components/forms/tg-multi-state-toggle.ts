import { selectedBtnText } from '../../utils';
import { ExpandableComponent } from '../expandable-component';
import { tgButtonsGrid } from '../tg-buttons-grid';
import { GetPropsType, GetStateType, TgComponent } from '../tg-components';
import { MakeOptional } from '../types';
import { escapeHtml } from '../utils';
import { TgFormField, tgFormFieldDefaultProps } from './tg-form-field';

type TextTgFormField = TgFormField<string>;
const TextTgFormField = TgFormField<string>;

type State = GetStateType<TextTgFormField>;
type Props = Omit<
  GetPropsType<TextTgFormField>,
  'textPrinter' | 'inlineValuePrinter'
> & {
  options: { label: string; value: string }[];
  textPrinter: (props: Props, state: State) => string;
  inlineValuePrinter: (props: Props, state: State) => string;
};

export const tgMultiStateToggleDefaultProps = {
  ...tgFormFieldDefaultProps,
  textPrinter: (props, state) =>
    (state.expanded ? `<u>${props.label}</>` : props.label) +
    ': ' +
    (state.value !== null
      ? `<b>${escapeHtml(
          props.options.find((x) => x.value === state.value)?.label ?? '?'
        )}</b>`
      : `<i>${props.placeholder}</>`) +
    '\n' +
    (state.expanded ? props.description : ''),
  inlineValuePrinter: (props, state) =>
    `${state.value ? props.options.find((x) => x.value === state.value)?.label ?? '?' : '🌫'}`,
} satisfies Partial<Props>;

/**
 * A multi state toggle component with the style of `TgFormField`.
 * Clicking on the label will expand the field but will not request any text
 * input. Clicking on the value will toggle between the possible states.
 *
 * **NOTE**: the values are used in the callback, for deeply nested components
 * consider using very short value strings.
 *
 * Example:
 * ```ts
 * this.parseModeField = this.makeChild('p', TgMultiStateToggle, {
 *   label: "📝 Parse mode",
 *   ctx,
 *   options: [
 *     { label: 'HTML 🌐', value: 'HTML' },
 *     { label: 'Markdown ⬇️', value: 'MarkdownV2' },
 *     { label: 'Telegram ✈️', value: 'Telegram' },
 *   ],
 *   defaultValue: 'Telegram',
 *   description: `What parse mode should be used?\n`,
 * });
 * ```
 */
export class TgMultiStateToggle
  extends TgComponent<State, Props>
  implements ExpandableComponent
{
  handlers = {
    onValueClick: {
      permanentId: 'v',
      handler: this.onValueClick.bind(this),
    },
    onOptionClick: {
      permanentId: 'o',
      handler: this.onOptionClick.bind(this),
    },
  };

  public field: TextTgFormField;

  constructor(
    props: MakeOptional<Props, keyof typeof tgMultiStateToggleDefaultProps>
  ) {
    super({ ...tgMultiStateToggleDefaultProps, ...props });

    this.field = this.addChild(
      'f',
      new TextTgFormField({
        ...this.props,
        ...this.getEventProps('f'),
        label: this.props.label,
        description: this.props.description,
        ctx: this.props.ctx,
        getState: () => this.getState(),
        setState: (state) => this.setState(state),
        // no need to listen for text inputs
        listenForMessageInput: undefined,
        textPrinter: () => this.props.textPrinter(this.props, this.getState()),
        inlineValuePrinter: () =>
          this.props.inlineValuePrinter(this.props, this.getState()),
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
   * Called when the value is clicked, toggles the state to the next one.
   */
  public onValueClick() {
    const state = this.getState();
    const states = this.props.options;

    // NOTE: -1 is acceptable and makes the toggle switch to 0 on click
    const currentIndex = state.value
      ? states.findIndex((x) => x.value === state.value)
      : 0;

    this.patchState({
      value: states[(currentIndex + 1) % states.length].value,
    });
  }

  /**
   * Called when an option is clicked, only used when the component is expanded.
   *
   * If an invalid value is passed it is ignored.
   */
  public onOptionClick(value: string) {
    if (!this.props.options.find((x) => x.value === value)) {
      // ignore invalid option
      return;
    }

    this.patchState({ value });
  }

  public async render() {
    const field = await this.field.render();

    if (!this.isExpanded()) {
      return field;
    }

    const state = this.getState();
    const options = this.props.options.map((option) =>
      this.getButton(
        selectedBtnText(option.label, option.value === state.value),
        this.handlers.onOptionClick,
        option.value
      )
    );

    return {
      text: field.text,
      keyboard: [...field.keyboard, ...tgButtonsGrid(options)],
    };
  }
}
