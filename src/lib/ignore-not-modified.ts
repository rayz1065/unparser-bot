import { RawApi, Transformer } from 'grammy';

type Methods<R extends RawApi> = keyof R & string;

const enabledMethods = new Set([
  'editMessageText',
  'editMessageReplyMarkup',
  'editMessageMedia',
  'editMessageCaption',
] satisfies Methods<RawApi>[]);
function safeSetHas<T>(set: Set<T>, item: unknown): item is T {
  return set.has(item as T);
}

export function ignoreNotModified<R extends RawApi>(): Transformer<R> {
  return async (prev, method, payload, signal) => {
    const result = await prev(method, payload, signal);
    if (
      safeSetHas(enabledMethods, method) &&
      !result.ok &&
      result.description
        .toLowerCase()
        .startsWith('bad request: message is not modified:')
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      return { ok: true, result: true as any };
    }
    return result;
  };
}
