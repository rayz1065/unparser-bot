export type MaybePromise<T> = T | Promise<T>;

export type MaybeCallable<T, Args extends any[]> =
  | T
  | ((...args: Args) => MaybePromise<T>);

export type MaybeCalled<T extends MaybeCallable<any, any[]>> =
  T extends MaybeCallable<infer S, any[]> ? MaybePromise<S> : never;

export function isCallable<T, Args extends any[]>(
  value: MaybeCallable<T, Args>
): value is (...args: Args) => MaybePromise<T> {
  return typeof value === 'function';
}

export function maybeCall<T, Args extends any[]>(
  value: MaybeCallable<T, Args>,
  ...args: Args
): MaybePromise<T> {
  return isCallable(value) ? value(...args) : value;
}
