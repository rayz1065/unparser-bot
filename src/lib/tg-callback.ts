import { Composer, Context, Filter, Middleware } from 'grammy';
import { InlineKeyboardButton } from 'grammy/types';
import { splitWithTail } from './utils';

export type TgCallbackFlavor = {
  callbackParams: unknown[];
};

type LocalContext = Context & TgCallbackFlavor;

type CallbackMiddleware<
  S extends LocalContext,
  T extends unknown[],
> = Middleware<
  Omit<Filter<S, 'callback_query:data'>, 'callbackParams'> & {
    callbackParams: T;
  }
>;

type TgCallbackMatchResult<S extends LocalContext, T extends unknown[]> = {
  match: TgCallback<S, T>;
  values: T;
} | null;

interface TgCallbackMatchable<S extends LocalContext, T extends unknown[]> {
  match(cbData: string): TgCallbackMatchResult<S, T>;
}

/**
 * creates a callback with a prefix and some params
 */
export class TgCallback<S extends LocalContext, T extends unknown[] = never[]>
  implements TgCallbackMatchable<S, T>
{
  public middleware: CallbackMiddleware<S, T>[];

  public constructor(
    private prefix: string,
    ...middleware: CallbackMiddleware<S, T>[]
  ) {
    if (this.prefix.indexOf('.') !== -1) {
      throw new Error("TgCallback prefix may not contain '.'");
    }
    this.middleware = middleware;
  }

  public getCb(values: T) {
    let valuesStr = JSON.stringify(values);
    valuesStr = valuesStr.substring(1, valuesStr.length - 1);
    return this.prefix + '.' + valuesStr;
  }

  public getBtn(
    text: string,
    ...values: T
  ): InlineKeyboardButton.CallbackButton {
    return {
      text,
      callback_data: this.getCb(values),
    };
  }

  public match(cbData: string) {
    const sections = splitWithTail(cbData, '.', 2);
    if (sections.length !== 2) {
      return null;
    }

    const [prefix, rest] = sections;
    if (prefix !== this.prefix) {
      return null;
    }

    let values: T;

    try {
      values = JSON.parse('[' + rest + ']');
    } catch (error) {
      return null;
    }

    return { match: this, values };
  }
}

/**
 * A composer dedicated to storing multiple instances of TgCallback.
 * The composer will automatically register any created TgCallback.
 */
export class TgCallbackComposer<S extends LocalContext>
  extends Composer<S>
  implements TgCallbackMatchable<S, unknown[]>
{
  private callbacks: TgCallback<S, any>[] = [];

  public constructor(
    private prefix: string,
    ...middleware: Middleware<S>[]
  ) {
    super(...middleware);

    if (this.prefix.indexOf('.') !== -1) {
      throw new Error("TgCallbackComposer prefix may not contain '.'");
    }

    super.on('callback_query:data').lazy(this.lazyMatchCallback.bind(this));
  }

  public match(cbData: string) {
    const sections = splitWithTail(cbData, '.', 2);
    if (sections.length !== 2) {
      return null;
    }

    const [prefix, rest] = sections;
    if (prefix !== this.prefix) {
      return null;
    }

    for (const callback of this.callbacks) {
      const result = callback.match(rest);
      if (result) {
        return result;
      }
    }

    return null;
  }

  private lazyMatchCallback(ctx: S) {
    const cbData = ctx.callbackQuery?.data ?? '';
    const result = this.match(cbData);

    if (!result) {
      return [];
    }

    const { match, values } = result;

    ctx.callbackParams = values;
    return match.middleware;
  }

  /**
   * Creates, stores, and returns a TgCallback.
   * The created TgCallback will be edited so that getCb contains the prefix,
   * of this composer in addition, this way we can route the requests properly.
   */
  public makeCallback<T extends unknown[] = never[]>(
    prefix: string,
    ...middleware: CallbackMiddleware<S, T>[]
  ) {
    const callback = new TgCallback<S, T>(prefix, ...middleware);

    const oldGetCb = callback.getCb.bind(callback);
    callback.getCb = (values: T) => this.prefix + '.' + oldGetCb(values);

    this.callbacks.push(callback);

    return callback;
  }

  public setPrefix(prefix: string) {
    this.prefix = prefix;
  }
}
