import { tgButtonsGrid } from './tg-buttons-grid';
import {
  MaybeLazyProperty,
  TgComponent,
  TgDefaultProps,
  TgStateProps,
} from './tg-components';
import { InlineKeyboardButton } from 'grammy/types';

type RequiredProps = {
  items: MaybeLazyProperty<
    {
      label: string;
      value: string;
      getButton: (label: string, value: string) => InlineKeyboardButton;
    }[],
    Props,
    State
  >;
  selectedItem: MaybeLazyProperty<string, Props, State>;
} & Pick<
  TgDefaultProps<State>,
  Exclude<keyof TgDefaultProps<any>, keyof TgStateProps<any>>
>;

type OptionalProps = {
  labelPrinter: (label: string, selected: boolean) => string;
  columns: MaybeLazyProperty<number, Props, State>;
} & TgStateProps<State>;

type Props = RequiredProps & OptionalProps;

type State = null;

export const tgNavbarDefaultProps = {
  labelPrinter: (label, selected) => (selected ? `• ${label} •` : label),
  columns: 3,
  getState: () => null,
  setState: () => {},
} as const satisfies OptionalProps;

/**
 * A simple navbar to be integrated within another component, can be used
 * directly when more control over what components are generated is needed,
 * for example when lazily generating components is needed.
 * If that's not a requirement, TgTabs can be used instead.
 *
 * Example:
 * ```ts
 * function getMenuNavbarProps() {
 *   return {
 *     items: [
 *       {
 *         label: 'Count 🔢',
 *         value: 'c',
 *         getButton: (label) => countersHandler.getBtn(label),
 *       },
 *       {
 *         label: 'Events 🗓',
 *         value: 'b',
 *         getButton: (label) => calendarHandler.getBtn(label),
 *       },
 *       {
 *         label: 'Pages 📄',
 *         value: 'p',
 *         getButton: (label) => paginationHandler.getBtn(label),
 *       },
 *     ],
 *     columns: 3,
 *   } as const satisfies Partial<TgNavbar['props']>;
 * }
 *
 * // ...
 *
 * this.navbar = this.addChild(
 *   'n',
 *   new TgNavbar({
 *     ...getMenuNavbarProps(),
 *     ...this.getButtonProps('n'),
 *     selectedItem: 'c',
 *   })
 * );
 * ```
 */
export class TgNavbar extends TgComponent<State, Props> {
  public constructor(props: RequiredProps & Partial<OptionalProps>) {
    super({ ...props, ...tgNavbarDefaultProps });
  }

  public getDefaultState(): State {
    return null;
  }

  public async render() {
    const selectedItem = await this.getProperty('selectedItem');
    const items = await this.getProperty('items');
    const columns = await this.getProperty('columns');

    const selectedItemLabel = items.find((item) => item.value === selectedItem);

    const buttons = items.map((item) =>
      item.getButton(
        this.props.labelPrinter(item.label, selectedItem === item.value),
        item.value
      )
    );

    return {
      text: selectedItemLabel ? `<b>${selectedItemLabel.label}</b>\n` : '',
      keyboard: [...tgButtonsGrid(buttons, { columns })],
    };
  }
}
