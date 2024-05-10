import { InlineKeyboardButton } from 'grammy/types';
import { TgComponent } from './tg-components';
import { Context } from 'grammy';
import { MaybePromise } from './maybe-callable';
import { MakeOptional, MaybeLazyProperty, TgDefaultProps } from './types';

interface State {
  value: number;
}

type Props = TgDefaultProps<State> & {
  label: MaybeLazyProperty<string, State>;
  inlineLabelPosition: MaybeLazyProperty<
    'left' | 'center' | 'right' | 'none',
    State
  >;
  inlineLabelPrinter: (
    props: Omit<Props, 'label'> & { label: string },
    state: State
  ) => MaybePromise<string>;
  textPrinter: (
    props: Omit<Props, 'label'> & { label: string },
    state: State
  ) => MaybePromise<string>;
  ctx: null | Context;
  options: MaybeLazyProperty<{ delta: number; label: string }[], State>;
};

export const tgCounterDefaultProps = {
  inlineLabelPosition: 'center',
  textPrinter: (props, state) => `${props.label}: <b>${state.value}</>\n`,
  inlineLabelPrinter: (props, state) => `${props.label}: ${state.value}`,
  ctx: null,
  options: [
    { delta: -1, label: '➖' },
    { delta: 1, label: '➕' },
  ],
} as const satisfies Partial<Props>;

/**
 * A simple counter component, you can pass in custom options and pick the
 * position of the label (or if you prefer to remove the label).
 * When the label is clicked the text of the label is displayed, you can
 * override the `inlineLabelClicked` handler if you want to change this.
 *
 * Example:
 *
 * ```ts
 * this.counter = this.makeChild('c', TgCounter, {
 *   label: 'counter',
 *   inlineLabelPosition: 'left',
 * });
 * ```
 */
export class TgCounter extends TgComponent<State, Props> {
  handlers = {
    add: {
      permanentId: 'a',
      handler: this.add.bind(this),
    },
    inlineLabelClicked: {
      permanentId: 'n',
      handler: this.inlineLabelClicked.bind(this),
    },
  };

  public constructor(
    props: MakeOptional<Props, keyof typeof tgCounterDefaultProps>
  ) {
    super({ ...tgCounterDefaultProps, ...props });
  }

  public getDefaultState(): State {
    return { value: 0 };
  }

  public add(delta: number) {
    const state = this.getState();
    this.patchState({
      value: state.value + delta,
    });
  }

  public async inlineLabelClicked() {
    const label = await this.getProperty('label');
    if (this.props.ctx) {
      await this.props.ctx.answerCallbackQuery(
        await this.props.inlineLabelPrinter(
          { ...this.props, label },
          this.getState()
        )
      );
    }
  }

  public async render() {
    const props = this.props;
    const { textPrinter, inlineLabelPrinter } = props;
    const state = this.getState();

    const options = await this.getProperty('options');
    const inlineLabelPosition = await this.getProperty('inlineLabelPosition');
    const label = await this.getProperty('label');

    const inlineLabelIdx = {
      center: Math.round(options.length / 2),
      left: 0,
      right: options.length,
      none: null,
    }[inlineLabelPosition];

    const buttons: InlineKeyboardButton[] = [];
    const inlineLabel = this.getButton(
      await inlineLabelPrinter({ ...this.props, label }, state),
      this.handlers.inlineLabelClicked
    );

    for (let idx = 0; idx <= options.length; idx++) {
      if (idx === inlineLabelIdx) {
        buttons.push(inlineLabel);
      }
      if (idx < options.length) {
        const { delta, label } = options[idx];
        buttons.push(this.getButton(label, this.handlers.add, delta));
      }
    }

    return {
      text: await textPrinter({ ...this.props, label }, state),
      keyboard: [buttons],
    };
  }
}
