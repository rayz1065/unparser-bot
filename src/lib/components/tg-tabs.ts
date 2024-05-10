import { TgComponent } from './tg-components';
import { MaybePromise } from './maybe-callable';
import { TgNavbar } from './tg-navbar';
import {
  MakeOptional,
  MaybeLazyProperty,
  TgDefaultProps,
  TgMessage,
} from './types';

type Props = {
  tabs: MaybeLazyProperty<
    {
      label: string;
      value: string;
    }[],
    State
  >;
  defaultTab: string;
  renderTab: (tab: string) => MaybePromise<TgMessage>;
  labelPrinter: (label: string, selected: boolean) => string;
  columns: MaybeLazyProperty<number, State>;
  includeNavbarTitle: MaybeLazyProperty<boolean, State>;
} & TgDefaultProps<State>;

type State = {
  tab: string;
};

export const tgTabsDefaultProps = {
  // surround with dots
  labelPrinter: (label, selected) => (selected ? `• ${label} •` : label),
  columns: 3,
  includeNavbarTitle: true,
} satisfies Partial<Props>;

/**
 *
 *
 * Example:
 * ```ts
 * this.tabs = this.makeChild('t', TgTabs, {
 *   defaultTab: 'c',
 *   tabs: [
 *     { label: 'Count 🔢', value: 'c' },
 *     { label: 'Events 🗓', value: 'b' },
 *     { label: 'Pages 📄', value: 'p' },
 *   ],
 *   renderTab: (tab) => {
 *     if (tab === 'c') return this.counterArray.render();
 *     if (tab === 'b') return this.calendar.render();
 *     if (tab === 'p') return this.pagination.render();
 *     return {
 *       text: '?',
 *     };
 *   },
 * });
 * ```
 */
export class TgTabs extends TgComponent<State, Props> {
  handlers = {
    onTabClick: {
      permanentId: 't',
      handler: this.onTabClick.bind(this),
    },
  };

  public navbar: TgNavbar;

  public constructor(
    props: MakeOptional<Props, keyof typeof tgTabsDefaultProps>
  ) {
    super({ ...props, ...tgTabsDefaultProps });

    this.navbar = this.addChild(
      'n',
      new TgNavbar({
        ...this.getEventProps('n'),
        selectedItem: () => this.getState().tab,
        items: async () =>
          (await this.getProperty('tabs')).map((tab) => ({
            ...tab,
            getButton: (label, value) =>
              this.getButton(label, this.handlers.onTabClick, value),
          })),
        labelPrinter: this.props.labelPrinter,
        columns: async () => await this.getProperty('columns'),
      })
    );
  }

  /**
   * Called when a tab is clicked.
   */
  public onTabClick(value: string) {
    this.patchState({ tab: value });
  }

  public getDefaultState(): State {
    return {
      tab: this.props.defaultTab,
    };
  }

  public async render() {
    const state = this.getState();
    const { tab: selectedTab } = state;

    const navbar = await this.navbar.render();
    const renderedTab = await this.props.renderTab(selectedTab);

    const includeNavbarTitle = await this.getProperty('includeNavbarTitle');

    const text = includeNavbarTitle
      ? `${navbar.text}${renderedTab.text}`
      : renderedTab.text;

    return {
      text,
      keyboard: [...navbar.keyboard, ...(renderedTab.keyboard ?? [])],
    };
  }
}
