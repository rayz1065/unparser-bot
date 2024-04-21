import { Filter, Middleware } from 'grammy';
import { MyContext } from '../types/grammy';
import { InlineKeyboardButton } from 'grammy/types';
import { splitWithTail } from './utils';

type CallbackMiddleware<T extends any[] = any[]> = Middleware<
  Omit<Filter<MyContext, 'callback_query:data'>, 'callbackParams'> & {
    callbackParams: T;
  }
>;

/**
 * creates a callback with a string prefix and some params
 */
export class TgCallback<T extends any[] = any[]> {
  private prefix = 'tgb';
  public middleware: CallbackMiddleware<T>[];

  public constructor(
    private name: string,
    ...middleware: CallbackMiddleware<T>[]
  ) {
    if (this.name.indexOf('.') !== -1) {
      throw new Error("TgCallback name may not contain '.'");
    }
    this.middleware = middleware;
  }

  public setPrefix(prefix: string) {
    if (prefix.indexOf('.') !== -1) {
      throw new Error("TgCallback prefix may not contain '.'");
    }
    this.prefix = prefix;
    return this;
  }

  public getCb(values: T) {
    let valuesStr = JSON.stringify(values);
    valuesStr = valuesStr.substring(1, valuesStr.length - 1);
    return [this.prefix, this.name, valuesStr].join('.');
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

  public match(prefix: string, name: string) {
    return this.prefix === prefix && this.name === name;
  }
}

export function cbValidate<T extends any[]>(
  key: number,
  validator: (value: string) => boolean
): CallbackMiddleware<T> {
  return async (ctx, next) => {
    if (validator(`${ctx.callbackParams[key]}`)) {
      return await next();
    }
    await ctx.answerCallbackQuery(`Invalid value for ${key}`);
  };
}

export function findTgCallback(
  callbacks: TgCallback<any>[],
  cbData: string
): { match: TgCallback | null; values: any[] } {
  const sections = splitWithTail(cbData, '.', 3);
  if (sections.length !== 3) {
    return { match: null, values: [] };
  }

  const [prefix, name, valuesStr] = sections;
  let values: any;
  try {
    values = JSON.parse(`[${valuesStr}]`);
  } catch (error) {
    return { match: null, values: [] };
  }

  const match = callbacks.find((callback) => callback.match(prefix, name));
  return { match: match ?? null, values };
}

/**
 * Usage:
 *
 * module
 *   .on('callback_query:data')
 *   .lazy(
 *     tgLazyCallbackMiddleware(
 *       [fooCb, barCb].map((x) =>
 *         x.setPrefix('foobar')
 *       )
 *     )
 *   );
 */
export function tgLazyCallbackMiddleware(callbacks: TgCallback<any>[]) {
  return (ctx: MyContext) => {
    const { match, values } = findTgCallback(
      callbacks,
      ctx.callbackQuery?.data ?? ''
    );
    if (!match) {
      return [];
    }

    ctx.callbackParams = values;
    return match.middleware;
  };
}
