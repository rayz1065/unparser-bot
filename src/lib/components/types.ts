import { Context, Filter, FilterQuery } from 'grammy';
import { InlineKeyboardButton } from 'grammy/types';
import { MaybeCallable, MaybePromise } from './maybe-callable';
import { MessageData } from 'grammy-edit-or-reply';

// messages

export type TgMessage = MessageData;

// state and props

export type TgStateBase = Record<string, any> | null;

export type TgButtonGetter<T extends any[] = any[]> = (
  text: string,
  permanentId: string,
  ...args: T
) => InlineKeyboardButton;

export type TgStateGetter<State extends TgStateBase = TgStateBase> =
  () => State | null;

export type TgStateSetter<State extends TgStateBase = TgStateBase> = (
  state: State
) => void;

export type TgStateProps<State extends TgStateBase> = {
  getState: TgStateGetter<State>;
  setState: TgStateSetter<State>;
};

export type TgDefaultProps<State extends TgStateBase> = {
  getButton: TgButtonGetter;
  listenForMessageInput?: MessageInputEventListener;
} & TgStateProps<State>;

export type TgPropsBase<State extends TgStateBase> = Record<string, any> &
  TgDefaultProps<State>;

export type MaybeLazyProperty<T, State extends TgStateBase> = MaybeCallable<
  T,
  [State]
>;

// events and handlers

export type MessageFilterQuery = FilterQuery &
  ('message' | `message:${string}`);

export type MessageInputEventListener = (
  permanentId: string,
  filter: MessageFilterQuery
) => MaybePromise<void>;

export type HandlerFunction<T extends any[] = any[]> = (
  ...args: T
) => MaybePromise<void>;

export type MessageHandlerFunction<
  C extends Context,
  T extends MessageFilterQuery,
> = (ctx: Filter<C, T>) => MaybePromise<void>;

export type HandlerData<T extends any[] = any[]> = {
  permanentId: string;
  handler: HandlerFunction<T>;
};

// utils

export type MakeOptional<T extends Record<any, any>, K extends keyof T> = Omit<
  T,
  K
> &
  Partial<Pick<T, K>>;
