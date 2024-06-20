import {
  Composer,
  Context,
  Filter,
  Middleware,
  MiddlewareFn,
  NextFunction,
} from 'grammy';
import { InlineKeyboardButton } from 'grammy/types';
import { splitWithTail } from './utils';

export type TgCallbackFlavor = {
  callbackParams: unknown[];
};

type LocalContext = Context & TgCallbackFlavor;

type CallbackMiddleware<
  C extends LocalContext,
  T extends unknown[],
> = Middleware<
  Omit<Filter<C, 'callback_query:data'>, 'callbackParams'> & {
    callbackParams: T;
  }
>;

type TgCallbackMatchResult<C extends LocalContext, T extends unknown[]> = {
  match: TgCallback<C, T>;
  values: T;
} | null;

interface TgCallbackMatchable<C extends LocalContext, T extends unknown[]> {
  match(cbData: string): TgCallbackMatchResult<C, T>;
}

/**
 * Creates a callback with a prefix and the specified parameters.
 *
 * You should use `TgCallbacksBag` to manage your callbacks.
 */
export class TgCallback<C extends LocalContext, T extends unknown[] = never[]>
  implements TgCallbackMatchable<C, T>
{
  public middleware: CallbackMiddleware<C, T>[];

  public constructor(
    private prefix: string,
    ...middleware: CallbackMiddleware<C, T>[]
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
 * Sourced from https://github.com/grammyjs/grammY/blob/main/src/composer.ts
 */
function flatten<C extends Context>(mw: Middleware<C>): MiddlewareFn<C> {
  return typeof mw === 'function'
    ? mw
    : (ctx, next) => mw.middleware()(ctx, next);
}

/**
 * Class to store, create, and register a list of tg callbacks.
 *
 * Example:
 * ```
 * const callbacksBag = new TgCallbacksBag<MyContext>('bag-id');
 * bot.use(callbacksBag);
 *
 * const menuCb = callbacksBag.makeCallback('menu', async (ctx) => {
 *   await ctx.answerCallbackQuery("Hello world!");
 * })
 * ```
 *
 * **NOTE**: the middleware will consume all callbacks matched by the bag,
 * i.e. callbacks in the format `${prefix}.${callbackId}` where `callbackId`
 * is the id of one of the child callbacks, make sure that callbacks of this
 * form are not used anywhere else.
 */
export class TgCallbacksBag<C extends LocalContext> {
  private callbacks: TgCallback<C, any>[] = [];

  public constructor(private prefix: string) {
    if (this.prefix.indexOf('.') !== -1) {
      throw new Error("TgCallbackBag prefix may not contain '.'");
    }
  }

  /**
   * Finds a TgCallback matching the data within the bag or returns `null`.
   */
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

  /**
   * Creates, stores, and returns a TgCallback.
   * The created TgCallback will be edited so that getCb contains the prefix,
   * of this composer in addition, this way we can route the requests properly.
   */
  public makeCallback<T extends unknown[] = never[]>(
    prefix: string,
    ...middleware: CallbackMiddleware<C, T>[]
  ) {
    const callback = new TgCallback<C, T>(prefix, ...middleware);

    const oldGetCb = callback.getCb.bind(callback);
    callback.getCb = (values: T) => this.prefix + '.' + oldGetCb(values);

    this.callbacks.push(callback);

    return callback;
  }

  /**
   * Updates the prefix, must be used before any call to getBtn or getCb.
   */
  public setPrefix(prefix: string) {
    this.prefix = prefix;
  }

  /**
   * Register a middleware for your callbacks, simply call
   * `bot.use(callbacksBag)` to register all the callbacks in the bag.
   */
  public middleware() {
    return async (ctx: C, next: NextFunction) => {
      if (ctx.callbackQuery?.data === undefined) {
        return next();
      }

      const cbData = ctx.callbackQuery.data;
      const result = this.match(cbData);

      if (!result) {
        return next();
      }

      const { match, values } = result;

      ctx.callbackParams = values;

      return await flatten(
        new Composer<Filter<C, 'callback_query:data'>>(...match.middleware)
      )(ctx as Filter<C, 'callback_query:data'>, next);
    };
  }
}
