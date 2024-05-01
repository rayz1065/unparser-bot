import { Context } from 'grammy';
import { InlineKeyboardButton } from 'grammy/types';
import {
  MaybeCallable,
  MaybeCalled,
  MaybePromise,
  maybeCall,
} from './maybe-callable';
import { stringifyHash } from './stringify-hash';

type Other<C extends Context> = Parameters<C['api']['sendMessage']>[2];

export type GetPropsType<T extends TgComponent<any, any, any>> =
  T extends TgComponent<any, infer P, any> ? P : never;
export type GetStateType<T extends TgComponent<any, any, any>> =
  T extends TgComponent<infer S, any, any> ? S : never;

export type MaybeLazyProperty<T, Props, State> = MaybeCallable<
  T,
  [Props, State]
>;

export interface TgMessage<C extends Context = Context> {
  text: string;
  keyboard?: InlineKeyboardButton[][];
  other?: Omit<Other<C>, 'reply_markup'>;
}

type TgStateBase = Record<string, any>;

type TgButtonGetter = (
  text: string,
  handler: string,
  ...args: any[]
) => InlineKeyboardButton;
type TgStateGetter<State extends TgStateBase = TgStateBase> =
  () => State | null;
type TgStateSetter<State extends TgStateBase = TgStateBase> = (
  state: State
) => void;

export type TgDefaultProps<State extends TgStateBase> = {
  getButton: TgButtonGetter;
  getState: TgStateGetter<State>;
  setState: TgStateSetter<State>;
};

type TgPropsBase<State extends TgStateBase> = Record<string, any> &
  TgDefaultProps<State>;

/**
 * A TgComponent is a reactive stateful component within telegram.
 * The component takes as input a set of props, the most important ones are
 * - getState, setState, related to state management
 * - getButton, a function that returns a button, when the button is called
 *   the parent component is tasked to call the respective handler
 */
export abstract class TgComponent<
  State extends TgStateBase = Record<string, never>,
  Props extends TgPropsBase<State> = TgPropsBase<State>,
  C extends Context = Context,
> {
  protected handlers: { [key: string]: (...args: any[]) => void } = {};
  protected children: Record<string, TgComponent<any, any, C>> = {};

  /**
   * Cache for lazily-loaded props.
   */
  private propsCache: Partial<{
    [K in keyof Props]: MaybeCalled<K>;
  }> = {};

  /**
   * The state for which the props cache is valid (JSON encoded).
   * If the state changes, the props have to be recomputed.
   */
  private propsCacheState = '';

  constructor(public props: Props) {}

  public abstract render(): MaybePromise<TgMessage<C>>;

  public abstract getDefaultState(): State;

  protected getChildrenState() {
    return Object.fromEntries(
      Object.entries(this.children).map(([key, child]) => [
        key,
        child.getDefaultState(),
      ])
    );
  }

  /**
   * Returns a button with the specified text for the handler.
   * When the button is pressed, the handler will be invoked.
   */
  public getButton(text: string, handler: string, ...args: any[]) {
    return this.props.getButton(text, handler, ...args);
  }

  /**
   * Returns the current state of the component, including the values specified
   * by the getDefaultState function.
   *
   * Important: only access the state through this function when the components
   * are fully constructed or the state might be malformed, if necessary use
   * this.props.getState() instead
   */
  public getState(): State {
    return { ...this.getDefaultState(), ...this.props.getState() };
  }

  /**
   * Alias for this.props.setState(state)
   */
  public setState(state: State) {
    this.props.setState(state);
  }

  /**
   * Helper function to partially update the state.
   */
  public patchState(state: Partial<State>) {
    this.setState({
      ...this.getState(),
      ...state,
    });
  }

  /**
   * Calls a handler after ensuring it exists.
   */
  public handle(handlerName: string, ...args: any[]) {
    if (!this.hasHandler(handlerName)) {
      throw Error(`No handler with name ${handlerName} found`);
    }

    this.handlers[handlerName](...args);
  }

  public hasHandler(action: string): boolean {
    return action in this.handlers;
  }

  public getHandlers() {
    return this.handlers;
  }

  /**
   * Adds a child to the current component, this will in turn create a tree of
   * components where the key is used for routing within the tree.
   * Since telegram callback queries have a very short limit, ensure that the
   * key is as short as possible, possibly a single character.
   */
  public addChild<T extends TgComponent<any, any, C>>(
    key: string,
    child: T
  ): T {
    if (key.indexOf('.') !== -1) {
      throw Error(`Child key ${key} cannot contain dots`);
    }

    this.children[key] = child;

    for (const handlerKey in child.getHandlers()) {
      const newHandlerKey = `${key}.${handlerKey}`;

      if (this.handlers[newHandlerKey]) {
        throw Error(
          `Trying to register ${key} but handler ${newHandlerKey} already exists`
        );
      }

      this.handlers[newHandlerKey] = (...args: any[]) =>
        this.children[key].handle(handlerKey, ...args);
    }

    return child;
  }

  /**
   * Constructs a child component and adds it to the tree.
   * This utility function already handles getting and setting the state by
   * allocating the given key on the state object to the child.
   * It also handles routing clicks, as the getButton function will be updated
   * with the required routing information.
   */
  public makeChild<
    Key extends keyof State & string,
    PropsArg extends TgPropsBase<State[Key]>,
    T extends TgComponent<State[Key], PropsArg, C>,
  >(
    key: Key,
    ctor: new (props: PropsArg) => T,
    props: Pick<PropsArg, Exclude<keyof PropsArg, keyof TgDefaultProps<any>>>
    // note: adding the following breaks the typing inference in unexpected ways
    // & Partial<TgDefaultProps<State[Key]>>
  ): T {
    return this.addChild(
      key,
      new ctor({
        ...this.getDefaultProps(key),
        ...props,
      } as PropsArg)
    );
  }

  /**
   * Creates all the default props for the given key.
   * This can be used in cases makeChild does not cover.
   */
  public getDefaultProps<K extends keyof State & string>(
    key: K
  ): TgDefaultProps<State[K]> {
    return {
      getState: () => this.getState()[key],
      setState: (state) => {
        // using patchState here leads to an error
        this.setState({
          ...this.getState(),
          [key]: state,
        });
      },
      getButton: (text, handler, ...args) =>
        this.getButton(text, `${key}.${handler}`, ...args),
    };
  }

  /**
   * Get the value of a lazy loaded property, the value is also cached
   */
  public async getProperty<K extends keyof Props & string>(
    key: K
  ): Promise<MaybeCalled<Props[K]>> {
    const stateStr = stringifyHash(this.getState());
    if (this.propsCacheState !== stateStr) {
      this.propsCacheState = stateStr;
      this.propsCache = {};
    }

    const cached = this.propsCache[key];
    if (cached) {
      return cached;
    }

    const prop = await maybeCall(this.props[key], this.props, this.getState());
    this.propsCache[key] = prop;
    return prop;
  }
}
