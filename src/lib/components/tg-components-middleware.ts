import { Context, Middleware, SessionFlavor } from 'grammy';
import { JsonValue } from './safe-json';

export type TgComponentState<T extends Record<string, JsonValue>> = T;

type TgComponentMetaState<T extends Record<string, JsonValue>> = {
  lastUpdate: string;
  permanent: boolean;
  state: TgComponentState<T>;
};

type ComponentKey = string;

type StateGetter = (componentKey: ComponentKey) => TgComponentState<any>;

type StateSetter = (
  componentKey: ComponentKey,
  locationState: TgComponentState<any>,
  permanent?: boolean
) => void;

type StateUnsetter = (componentKey: ComponentKey) => void;

export type TgComponentsSessionData = {
  components?: Record<ComponentKey, TgComponentMetaState<any>>;
};

export type TgComponentsFlavor<C extends Context | undefined = undefined> = {
  components: {
    get: StateGetter;
    set: StateSetter;
    unset: StateUnsetter;
  };
} & (C extends Context
  ? C & SessionFlavor<TgComponentsSessionData>
  : SessionFlavor<TgComponentsSessionData>);

/**
 * Register the utility storage for TgComponents state in the session.
 */
export const tgComponentsMiddleware: <C extends Context>(
  options?: Record<string, never>
) => Middleware<TgComponentsFlavor<C>> = () => {
  return async (ctx, next) => {
    ctx.components = {
      get: (componentKey) => {
        return ctx.session.components?.[componentKey]?.state ?? {};
      },
      set: (componentKey, state, permanent = false) => {
        // TODO expiration and cleanup of non-permanent keys
        ctx.session.components ??= {};
        ctx.session.components[componentKey] = {
          lastUpdate: new Date().toISOString(),
          permanent,
          state,
        };
      },
      unset: (componentKey) => {
        delete ctx.session.components?.[componentKey];
      },
    };
    await next();
  };
};
