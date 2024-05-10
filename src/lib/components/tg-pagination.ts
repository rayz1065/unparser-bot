import { Context } from 'grammy';
import { MaybePromise } from './maybe-callable';
import { tgButtonsGrid } from './tg-buttons-grid';
import { GetStateType, TgComponent } from './tg-components';
import { TgCounter } from './tg-counter';
import { InlineKeyboardButton } from 'grammy/types';
import {
  MakeOptional,
  MaybeLazyProperty,
  TgDefaultProps,
  TgMessage,
} from './types';

type PageInfo = {
  page: number;
  skip: number;
  perPage: number;
};
type PageRenderer<T> = (
  elements: T[],
  pageInfo: PageInfo
) => MaybePromise<TgMessage>;

type Props<T> = {
  renderPage: PageRenderer<T>;
  loadPage: (pageInfo: PageInfo) => MaybePromise<T[]>;
  total: MaybeLazyProperty<number, State>;
  perPage: MaybeLazyProperty<number, State>;
  ctx: Context | null;
  outOfBoundsLabel: MaybeLazyProperty<string, State>;
  previousPageLabel: MaybeLazyProperty<string, State>;
  nextPageLabel: MaybeLazyProperty<string, State>;
  paginationPosition: MaybeLazyProperty<'top' | 'bottom', State>;
} & TgDefaultProps<State>;

type State = GetStateType<TgCounter>;

export const tgPaginationDefaultProps = {
  perPage: 30,
  ctx: null,
  outOfBoundsLabel: '🚫',
  previousPageLabel: '⬅️',
  nextPageLabel: '➡️',
  paginationPosition: 'bottom',
} satisfies Partial<Props<any>>;

/**
 * Renders each element in the pagination as a button and optionally some text,
 * renders as a grid with the given number of columns.
 */
export function renderAsButtonsGrid<T>({
  columns,
  renderElement,
}: {
  columns: number;
  renderElement: (element: T) => {
    button: InlineKeyboardButton;
    text?: string;
  };
}): PageRenderer<T> {
  return async (elements: T[]) => {
    const items = await Promise.all(
      elements.map(async (element) => renderElement(element))
    );

    return {
      text: items
        .filter((x) => x.text !== undefined)
        .map((x) => x.text)
        .join(''),
      keyboard: tgButtonsGrid(
        items.map((x) => x.button),
        { columns }
      ),
    };
  };
}

/**
 * A component to paginate some elements.
 * You must provide the total number of elements to be paged, an async function
 * to load the data related to a page, and a page renderer. You can use
 * renderAsButtonsGrid as renderer for a simple grid of buttons, or you can
 * implement your own.
 *
 * Example:
 * ```ts
 * const total = 121;
 * this.pagination = this.makeChild('p', TgPagination<number>, {
 *   ctx,
 *   loadPage: ({ skip, perPage }) =>
 *     [...Array(perPage).keys()]
 *       .map((x) => x + skip)
 *       .filter((x) => x >= 0 && x < total),
 *   total,
 *   renderPage: renderAsButtonsGrid<number>({
 *     columns: 3,
 *     renderElement: (element) => {
 *       return {
 *         button: {
 *           text: `${element}`,
 *           url: `https://example.com/${element}`,
 *         },
 *       };
 *     },
 *   }),
 *   perPage: 30,
 * });
 * ```
 */
export class TgPagination<T = any> extends TgComponent<State, Props<T>> {
  public counter: TgCounter;
  handlers = {
    onOutOfBounds: {
      permanentId: 'o',
      handler: this.onOutOfBounds.bind(this),
    },
  };

  constructor(
    props: MakeOptional<Props<T>, keyof typeof tgPaginationDefaultProps>
  ) {
    super({ ...tgPaginationDefaultProps, ...props });

    this.counter = this.addChild(
      'c',
      new TgCounter({
        ...this.getEventProps('c'),
        getState: () => this.getState(),
        setState: (state) => this.setState(state),
        label: '📄',
        ctx: this.props.ctx,
        options: async (counterState) => {
          const page = counterState.value;

          const outOfBoundsLabel = await this.getProperty('outOfBoundsLabel');
          const previousPageLabel = await this.getProperty('previousPageLabel');
          const nextPageLabel = await this.getProperty('nextPageLabel');

          const maxPage = await this.getMaxPage();

          return [
            {
              delta: -1,
              label: page > 0 ? previousPageLabel : outOfBoundsLabel,
            },
            {
              delta: 1,
              label: page < maxPage ? nextPageLabel : outOfBoundsLabel,
            },
          ];
        },
        inlineLabelPrinter: async (counterProps, counterState) => {
          const maxPage = await this.getMaxPage();

          return `${counterProps.label} ${counterState.value + 1} / ${
            maxPage + 1
          }`;
        },
      })
    );

    this.counter.overrideHandler(this.counter.handlers.add, async (delta) => {
      // override setState function to avoid going out of bounds
      const maxPage = await this.getMaxPage();

      const state = this.getState();
      let page = state.value + delta;

      if (page < 0 || page > maxPage) {
        page = Math.max(0, Math.min(page, maxPage));
        await this.handle(this.handlers.onOutOfBounds);
      }

      this.counter.patchState({ value: page });
    });
  }

  public async getMaxPage() {
    const { perPage, total } = await this.getProperties('perPage', 'total');

    return Math.max(0, Math.ceil(total / Math.max(perPage, 1)) - 1);
  }

  /**
   * Called when moving to a page that negative or larger than the maximum.
   */
  public async onOutOfBounds() {
    if (this.props.ctx) {
      const outOfBoundsLabel = await this.getProperty('outOfBoundsLabel');
      await this.props.ctx.answerCallbackQuery(outOfBoundsLabel);
    }
  }

  public getDefaultState(): State {
    return this.counter.getDefaultState();
  }

  public async render() {
    const { renderPage } = this.props;
    const counter = await this.counter.render();
    const pageIndex = Math.min(this.getState().value, await this.getMaxPage());
    const { perPage, paginationPosition } = await this.getProperties(
      'perPage',
      'paginationPosition'
    );
    const pageInfo: PageInfo = {
      page: pageIndex,
      skip: pageIndex * perPage,
      perPage: perPage,
    };

    const elements = await this.props.loadPage(pageInfo);
    const page = await renderPage(elements, pageInfo);

    return {
      text: page.text,
      keyboard:
        paginationPosition === 'top'
          ? [...counter.keyboard, ...(page.keyboard ?? [])]
          : [...(page.keyboard ?? []), ...counter.keyboard],
    } satisfies TgMessage;
  }
}
