import { Context, Middleware, SessionFlavor } from 'grammy';
import { JsonValue } from './safe-json';
import { MessageFilterQuery } from './types';
import { EventRejectionError } from './errors';
import { MaybePromise } from './maybe-callable';

export type TgComponentState<T extends Record<string, JsonValue>> = T;

type TgComponentMetaState<T extends Record<string, JsonValue>> = {
  lastUpdate: string;
  state: TgComponentState<T>;
};

export type TgComponentsSessionData = {
  components?: Record<string, TgComponentMetaState<any>>;
};

export type TgComponentsConversationData = {
  components?: {
    filter: MessageFilterQuery;
    permanentId: string;
    params?: unknown[];
  };
};

export type TgComponentsFlavor<C extends Context | undefined = undefined> = {
  components: {
    /**
     * Get the state for the specified componentKey.
     */
    get: (componentKey: string) => TgComponentState<any>;
    /**
     * Set the state for the specified componentKey, must be JSON-serializable.
     */
    set: (componentKey: string, locationState: TgComponentState<any>) => void;
    /**
     * Unsets the state for the specified componentKey.
     */
    unset: (componentKey: string) => void;
    /**
     * Handler for the `EventRejectionError` error, should be specified by the
     * user.
     */
    eventRejectionHandler: (error: EventRejectionError) => MaybePromise<void>;
  };
} & (C extends Context
  ? C & SessionFlavor<TgComponentsSessionData>
  : SessionFlavor<TgComponentsSessionData>) & {
    conversationData?: TgComponentsConversationData;
  };

/**
 * Register the utility storage for TgComponents state in the session.
 */
export const tgComponentsMiddleware: <C extends Context>(options?: {
  eventRejectionHandler?: (
    ctx: TgComponentsFlavor<C>,
    error: EventRejectionError
  ) => MaybePromise<void>;
}) => Middleware<TgComponentsFlavor<C>> = (options?) => {
  return async (ctx, next) => {
    ctx.components = {
      get: (componentKey) => {
        return ctx.session.components?.[componentKey]?.state ?? {};
      },
      set: (componentKey, state) => {
        ctx.session.components ??= {};
        ctx.session.components[componentKey] = {
          lastUpdate: new Date().toISOString(),
          state,
        };
      },
      unset: (componentKey) => {
        delete ctx.session.components?.[componentKey];
      },
      eventRejectionHandler: async (error) => {
        if (options?.eventRejectionHandler) {
          await options.eventRejectionHandler(ctx, error);
        } else {
          console.warn('Unhandled EventRejectionError', error);
        }
      },
    };
    await next();
  };
};
