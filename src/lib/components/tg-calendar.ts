import { Context } from 'grammy';
import {
  MaybeLazyProperty,
  TgComponent,
  TgDefaultProps,
  TgMessage,
} from './tg-components';
import dayjs, { Dayjs } from 'dayjs';
import { InlineKeyboardButton } from 'grammy/types';
import { TgCounter } from './tg-counter';
import { tgButtonsGrid } from './tg-buttons-grid';

interface CalendarLocaleData {
  weekdays: string[];
  weekdaysMin: string[];
  months: string[];
  monthsShort: string[];
  firstDayOfWeek: number;
}

type RequiredProps = TgDefaultProps<State>;

type OptionalProps = {
  ctx: Context | null;
  calendarLocaleData: MaybeLazyProperty<CalendarLocaleData, Props, State>;
};

type Props = RequiredProps & OptionalProps;

type State = {
  view: 'month' | 'year' | 'decade';
  decade: number;
  year: number;
  month: number;
};

/**
 * Produces the data required for localizing the calendar from dayjs.
 */
export function tgCalendarLocaleDataFromDayjs(
  locale: string | ILocale
): CalendarLocaleData {
  const localeData = dayjs().locale(locale).localeData();

  return {
    weekdays: localeData.weekdays(),
    weekdaysMin: localeData.weekdaysMin(),
    months: localeData.months(),
    monthsShort: localeData.monthsShort(),
    firstDayOfWeek: localeData.firstDayOfWeek(),
  };
}

export const tgCalendarDefaultProps = {
  ctx: null,
  calendarLocaleData: () => tgCalendarLocaleDataFromDayjs('en'),
} as const satisfies OptionalProps;

/**
 * Get the days of the calendar for the month view.
 * Month options are always displayed on 6 rows.
 * If the month starts on a monday the first row will be padding.
 */
function getCalendarDays(now: Dayjs, startOfWeek: number) {
  const startOfMonth = now.date(1);
  if (startOfMonth.day() === startOfWeek) {
    // add a padding week above
    now = now.day(startOfWeek - 7);
  } else {
    now = now.day(startOfWeek);
  }

  if (now.isAfter(startOfMonth)) {
    now = now.subtract(7, 'days');
  }

  const res: Dayjs[][] = [];
  for (let i = 0; i < 6 * 7; i++) {
    const day = now.add(i, 'days');
    if (i % 7 == 0) res.push([]);
    res[res.length - 1].push(day);
  }

  return res;
}

/**
 * A calendar with a day picker, month picker, and year picker.
 * You can pass a locale for the calendar through calendarLocaleData, the
 * interface is the same as that used by Dayjs, you can also use the
 * tgCalendarLocaleDataFromDayjs function to do all the work for you.
 *
 * Example:
 * ```ts
 * this.calendar = this.makeChild('c', TgCalendar, {
 *   ctx,
 *   calendarLocaleData: tgCalendarLocaleDataFromDayjs('it'),
 * });
 * ```
 */
export class TgCalendar extends TgComponent<State, Props> {
  public counter: TgCounter;

  handlers = {
    onWeekdayClick: {
      permanentId: 'w',
      handler: this.onWeekdayClick.bind(this),
    },
    onDateClick: {
      permanentId: 'd',
      handler: this.onDateClick.bind(this),
    },
    onMonthClick: {
      permanentId: 'm',
      handler: this.onMonthClick.bind(this),
    },
    onYearClick: {
      permanentId: 'y',
      handler: this.onYearClick.bind(this),
    },
    onMonthLabelClick: {
      permanentId: 'mm',
      handler: this.onMonthLabelClick.bind(this),
    },
    onYearLabelClick: {
      permanentId: 'yy',
      handler: this.onYearLabelClick.bind(this),
    },
    onDecadeLabelClick: {
      permanentId: 'YY',
      handler: this.onDecadeLabelClick.bind(this),
    },
  };

  constructor(props: RequiredProps & Partial<OptionalProps>) {
    super({ ...tgCalendarDefaultProps, ...props });

    const { ctx } = this.props;

    this.counter = this.addChild(
      'c',
      new TgCounter({
        label: async () => {
          const state = this.getState();
          const calendarLocaleData =
            await this.getProperty('calendarLocaleData');
          if (state.view === 'month') {
            return `${calendarLocaleData.monthsShort[state.month]} ${
              state.year
            }`;
          } else if (state.view === 'year') {
            return `${state.year}`;
          } else {
            return `${state.decade} - ${state.decade + 9}`;
          }
        },
        inlineLabelPrinter: (props) => props.label,
        ctx,
        options: [
          { delta: -1, label: '⬅️' },
          { delta: 1, label: '➡️' },
        ],
        ...this.getButtonProps('c'),
        getState: () => ({ value: 0 }),
        setState: () => {},
      })
    );

    this.counter.overrideHandler(
      this.counter.handlers.inlineLabelClicked,
      async () => {
        // switch to a higher-level view
        const state = this.getState();
        if (state.view === 'month') {
          await this.handle(this.handlers.onMonthLabelClick);
        } else if (state.view === 'year') {
          await this.handle(this.handlers.onYearLabelClick);
        } else {
          await this.handle(this.handlers.onDecadeLabelClick);
        }
      }
    );

    this.counter.overrideHandler(this.counter.handlers.add, async (delta) => {
      // moving through the pages of the calendar
      const state = this.getState();
      const monthStart = dayjs().year(state.year).month(state.month).date(1);
      let now: Dayjs;

      if (state.view === 'month') {
        now = monthStart.add(delta, 'months');
      } else if (state.view === 'year') {
        now = monthStart.add(delta, 'years');
      } else {
        now = monthStart.add(delta * 10, 'years');
      }

      this.setState({
        ...state,
        decade: now.year() - (now.year() % 10),
        year: now.year(),
        month: now.month(),
      });
    });
  }

  /**
   * Called when a weekday on the header of the month view is clicked.
   */
  public async onWeekdayClick(day: number) {
    const calendarLocaleData = await this.getProperty('calendarLocaleData');
    await this.props.ctx?.answerCallbackQuery(calendarLocaleData.weekdays[day]);
  }

  /**
   * Called when a date on the month view is clicked.
   */
  public async onDateClick(year: number, month: number, date: number) {
    const now = dayjs().year(year).month(month).date(date);
    await this.props.ctx?.answerCallbackQuery(now.format('YYYY-MM-DD'));
  }

  /**
   * Called when a month in the year view is clicked.
   */
  public async onMonthClick(month: number) {
    this.patchState({ month, view: 'month' });
  }

  /**
   * Called when a year in the decade view is clicked.
   */
  public async onYearClick(year: number) {
    this.patchState({ year, view: 'year' });
  }

  /**
   * Called when the month label in the month view is clicked.
   */
  public async onMonthLabelClick() {
    this.patchState({ view: 'year' });
  }

  /**
   * Called when the year label in the year view is clicked.
   */
  public async onYearLabelClick() {
    this.patchState({ view: 'decade' });
  }

  /**
   * Called when the decade label in the decade view is clicked.
   */
  public async onDecadeLabelClick() {
    const state = this.getState();
    await this.props.ctx?.answerCallbackQuery(
      `${state.decade} - ${state.decade + 9}`
    );
  }

  public getDefaultState(): State {
    const now = dayjs();

    return {
      view: 'month',
      decade: now.year() - (now.year() % 10),
      year: now.year(),
      month: now.month(),
    };
  }

  public async getMonthView() {
    const { month, year } = this.getState();
    const calendarLocaleData = await this.getProperty('calendarLocaleData');

    const monthStart = dayjs().year(year).month(month).date(1);

    const daysHeader: InlineKeyboardButton[] = [];
    for (let idx = 0; idx < 7; idx++) {
      const day = idx + calendarLocaleData.firstDayOfWeek;
      const dayName = calendarLocaleData.weekdaysMin[day % 7];
      daysHeader.push(
        this.getButton(dayName, this.handlers.onWeekdayClick, day % 7)
      );
    }

    const calendar = getCalendarDays(
      monthStart,
      calendarLocaleData.firstDayOfWeek
    );

    const monthOptions = calendar.map((week) =>
      week.map((day) =>
        this.getButton(
          day.format('D'),
          this.handlers.onDateClick,
          day.year(),
          day.month(),
          day.date()
        )
      )
    );

    return {
      text: '',
      keyboard: [daysHeader, ...monthOptions],
    } satisfies TgMessage;
  }

  public async getYearView() {
    const calendarLocaleData = await this.getProperty('calendarLocaleData');
    const { year } = this.getState();
    const yearStart = dayjs().year(year).month(0).date(1);

    const keyboard = tgButtonsGrid(
      calendarLocaleData.months.map((month, idx) =>
        this.getButton(month, this.handlers.onMonthClick, idx)
      ),
      { columns: 2 }
    );

    return {
      text: yearStart.format('YYYY'),
      keyboard,
    } satisfies TgMessage;
  }

  public async getDecadeView() {
    const { decade } = this.getState();

    const keyboard = tgButtonsGrid(
      [...Array(12).keys()].map((idx) =>
        this.getButton(
          `${decade + idx - 1}`,
          this.handlers.onYearClick,
          decade + idx - 1
        )
      ),
      { columns: 2 }
    );

    return {
      text: '',
      keyboard,
    } satisfies TgMessage;
  }

  public async render() {
    const counter = await this.counter.render();
    const { view } = this.getState();

    let renderedView: { text: string; keyboard: InlineKeyboardButton[][] };

    if (view === 'month') {
      renderedView = await this.getMonthView();
    } else if (view === 'year') {
      renderedView = await this.getYearView();
    } else {
      renderedView = await this.getDecadeView();
    }

    return {
      text: renderedView.text,
      keyboard: [...renderedView.keyboard, ...counter.keyboard],
    };
  }
}
