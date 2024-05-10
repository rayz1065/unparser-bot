import { Context } from 'grammy';
import { TgComponent } from '../tg-components';
import { escapeHtml } from '../utils';
import { ExpandableComponent } from '../expandable-component';
import { MakeOptional, TgDefaultProps, TgMessage } from '../types';

type Props<T> = {
  label: string;
  placeholder: string;
  description: string;
  textPrinter: (props: Props<T>, state: State<T>) => string;
  inlineLabelPrinter: (props: Props<T>, state: State<T>) => string;
  inlineValuePrinter: (props: Props<T>, state: State<T>) => string;
  ctx: Context | null;
  defaultValue: T | null;
} & TgDefaultProps<State<T>>;

type State<T> = {
  value: T | null;
  expanded: boolean;
};

export const tgFormFieldDefaultProps = {
  placeholder: '<tg-spoiler>🌫</>',
  description: '',
  textPrinter: (props, state) =>
    (state.expanded ? `<u>${props.label}</>` : props.label) +
    ': ' +
    (state.value !== null
      ? `<b>${escapeHtml(`${state.value}`)}</b>`
      : `<i>${props.placeholder}</>`) +
    '\n' +
    (state.expanded ? props.description : ''),
  inlineLabelPrinter: (props, state) =>
    `${props.label}` + (state.expanded ? ' ➖' : ' ➕'),
  inlineValuePrinter: (props, state) =>
    `${state.value ?? '🌫'}` +
    (state.expanded && state.value !== null ? ' 🗑' : ''),
  ctx: null,
  defaultValue: null,
} satisfies Partial<Props<any>>;

/**
 * A simple form field, renders with two keyboard buttons, one with the label
 * and one with the value. By default clicking on the label or value will
 * expand the field, clicking on the value while the field is expanded will
 * clear it.
 *
 * This component should not be used directly since the `onTextInput` method is
 * not implemented, you should either override the `onTextInput` handler or use
 * a more specific implementation such as `TgTextFormField`.
 */
export class TgFormField<T>
  extends TgComponent<State<T>, Props<T>>
  implements ExpandableComponent
{
  handlers = {
    onInlineLabelClick: {
      permanentId: 'l',
      handler: this.onInlineLabelClick.bind(this),
    },
    onValueClick: {
      permanentId: 'v',
      handler: this.onValueClick.bind(this),
    },
    onTextInput: {
      permanentId: 't',
      handler: this.onTextInput.bind(this),
    },
  };

  constructor(
    props: MakeOptional<Props<T>, keyof typeof tgFormFieldDefaultProps>
  ) {
    super({ ...tgFormFieldDefaultProps, ...props });
  }

  public isExpanded() {
    return this.getState().expanded;
  }

  public collapse() {
    this.patchState({ expanded: false });
  }

  public expand() {
    this.patchState({ expanded: true });
  }

  public toggleExpanded() {
    const state = this.getState();
    this.patchState({ expanded: !state.expanded });
  }

  public getDefaultState(): State<T> {
    return {
      expanded: false,
      value: this.props.defaultValue,
    };
  }

  /**
   * Handler called when the inline label is clicked.
   */
  public async onInlineLabelClick() {
    const state = this.getState();

    await this.props.ctx?.answerCallbackQuery(
      this.props.inlineLabelPrinter(this.props, state)
    );

    this.toggleExpanded();
  }

  /**
   * Handler called when the inline value is clicked.
   */
  public async onValueClick() {
    const state = this.getState();

    this.patchState({
      value: state.expanded ? null : state.value,
    });

    this.toggleExpanded();
  }

  /**
   * Handled called when a text input is passed.
   * Only called when the field is expanded.
   *
   * **NOTE**: an implementation is not offered, override the handler ot use.
   */
  public onTextInput(
    text: string // eslint-disable-line @typescript-eslint/no-unused-vars
  ) {
    throw new Error('Method not implemented.');
  }

  public async render() {
    const state = this.getState();

    if (state.expanded) {
      await this.listenForTextInput(this.handlers.onTextInput);
    }

    return {
      text: this.props.textPrinter(this.props, state),
      keyboard: [
        [
          this.getButton(
            this.props.inlineLabelPrinter(this.props, state),
            this.handlers.onInlineLabelClick
          ),
          this.getButton(
            this.props.inlineValuePrinter(this.props, state),
            this.handlers.onValueClick
          ),
        ],
      ],
    } satisfies TgMessage;
  }
}
