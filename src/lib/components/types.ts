import { Context } from 'grammy';
import { InlineKeyboardButton } from 'grammy/types';
import { MaybeCallable, MaybePromise } from './maybe-callable';

// messages

type Other<C extends Context> = Parameters<C['api']['sendMessage']>[2];

export interface TgMessage<C extends Context = Context> {
  text: string;
  keyboard?: InlineKeyboardButton[][];
  other?: Omit<Other<C>, 'reply_markup'>;
}

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
  listenForTextInput?: TextInputEventListener;
} & TgStateProps<State>;

export type TgPropsBase<State extends TgStateBase> = Record<string, any> &
  TgDefaultProps<State>;

export type MaybeLazyProperty<T, State extends TgStateBase> = MaybeCallable<
  T,
  [State]
>;

// events and handlers

export type TextInputEventListener = (
  permanentId: string
) => MaybePromise<void>;

export type HandlerFunction<T extends any[] = any[]> = (
  ...args: T
) => MaybePromise<void>;

export type HandlerData<T extends any[] = any[]> = {
  permanentId: string;
  handler: HandlerFunction<T>;
};

export type TextInputHandlerData<T extends any[] = any[]> = {
  permanentId: string;
  handler: HandlerFunction<[string, ...T]>;
};

// utils

export type MakeOptional<
  T extends Record<any, any>,
  K extends string | number | symbol,
> = Omit<T, K> & Partial<Pick<T, K>>;
