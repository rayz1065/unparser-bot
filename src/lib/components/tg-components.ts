import { Context, Filter } from 'grammy';
import { MaybeCalled, MaybePromise, maybeCall } from './maybe-callable';
import { stringifyHash } from './stringify-hash';
import {
  HandlerData,
  HandlerFunction,
  MakeOptional,
  MessageFilterQuery,
  MessageInputEventListener,
  TgButtonGetter,
  TgDefaultProps,
  TgMessage,
  TgPropsBase,
  TgStateBase,
  TgStateProps,
} from './types';

export type GetPropsType<T extends TgComponent<any, any, any>> =
  T extends TgComponent<any, infer P, any> ? P : never;

export type GetStateType<T extends TgComponent<any, any, any>> =
  T extends TgComponent<infer S, any, any> ? S : never;

/**
 * A TgComponent is a reactive stateful component within telegram.
 * The component takes as input a set of props, the most important ones are
 * - getState, setState, related to state management;
 * - getButton, a function that returns a button, when the button is called
 *   the parent component is tasked to call the respective handler;
 * - listenForMessageInput, a function to be used in the rendering method if the
 *   component is expecting the user to write a message. See
 *   `memorizeMessageInputRequests` for how this behavior can be customized.
 */
export abstract class TgComponent<
  State extends TgStateBase = null,
  Props extends TgPropsBase<State> = TgPropsBase<State>,
  C extends Context = Context,
> {
  public handlers: { [key: string]: HandlerData } = {};
  protected children: Record<string, TgComponent<any, any, C>> = {};

  /**
   * Cache for lazily-loaded props.
   */
  private propsCache: Partial<{
    [K in keyof Props]: MaybeCalled<Props[K]>;
  }> = {};

  /**
   * The state for which the props cache is valid (JSON encoded).
   * If the state changes, the props have to be recomputed.
   */
  private propsCacheState = '';

  /**
   * If `memorizeMessageInputRequests` is used, the (latest) request for each
   * child will be stored in this variable. It can then be used to decide
   * whether the child should have the request fulfilled.
   *
   * See `this.memorizeMessageInputRequests` for an example of usage.
   */
  public requestedMessageInput: Record<
    string,
    Parameters<MessageInputEventListener>
  > = {};

  constructor(public props: Props) {}

  public abstract render(): MaybePromise<TgMessage>;

  public abstract getDefaultState(): State;

  protected getChildrenDefaultState() {
    return Object.fromEntries(
      Object.entries(this.children)
        .map(([key, child]) => [key, child.getDefaultState()])
        .filter(([, state]) => state !== null)
    );
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
  public patchState(state: State extends null ? never : Partial<State>) {
    this.setState({
      ...this.getState(),
      ...state,
    });
  }

  /**
   * Finds the handler indicated by the permanentId, returns null on failure.
   */
  public findHandler(permanentId: string) {
    for (const key in this.handlers) {
      if (this.handlers[key].permanentId === permanentId) {
        return this.handlers[key];
      }
    }

    return null;
  }

  /**
   * Returns a button with the specified text for the handler.
   * When the button is pressed, the handler will be invoked.
   */
  public getButton<T extends any[]>(
    text: string,
    permanentId: string | HandlerData<T>,
    ...args: T
  ) {
    permanentId =
      typeof permanentId === 'string' ? permanentId : permanentId.permanentId;

    return this.props.getButton(text, permanentId, ...args);
  }

  /**
   * Register a listener for a message input for the given handler.
   *
   * Pass a filter to make sure the right update is received in your handler,
   * for example `message:photo` for photos.
   *
   * You can also use `listenForTextInput`.
   */
  public listenForMessageInput<T extends MessageFilterQuery = 'message'>(
    permanentId: string | HandlerData<[Filter<C, T>]>,
    filter: T
  ) {
    permanentId =
      typeof permanentId === 'string' ? permanentId : permanentId.permanentId;

    return this.props.listenForMessageInput?.(permanentId, filter);
  }

  /**
   * Register a listener for a text message input for the given handler.
   */
  public listenForTextInput(
    permanentId: string | HandlerData<[Filter<C, 'message:text'>]>
  ) {
    return this.listenForMessageInput(permanentId, 'message:text');
  }

  /**
   * Register a new handler that can be used for routing calls.
   * The permanentId is used in routing, it should be 1 or 2 characters and
   * must be unique. The permanentId cannot be changed after deploying the
   * component to avoid breaking stale UIs.
   *
   * **IMPORTANT**: make sure the handler is properly bound to the right object
   * if it needs to access `this`.
   */
  public registerHandler(permanentId: string, handler: HandlerFunction) {
    const handlerKey = `.${permanentId}`;

    if (this.findHandler(permanentId)) {
      throw Error(`Trying to re-register existing handler id ${permanentId}`);
    }
    if (handlerKey in this.handlers) {
      throw Error(`Trying to re-register existing handler key ${handlerKey}`);
    }

    this.handlers[handlerKey] = { permanentId, handler };
  }

  /**
   * Overrides an existing handler with a new one.
   *
   * **IMPORTANT**: make sure the handler is properly bound to the right object
   * if it needs to access `this` (or use an arrow function to capture the
   * local `this`).
   */
  public overrideHandler<T extends any[] = any[]>(
    permanentId: string | HandlerData<T>,
    newHandler: HandlerFunction<T>
  ) {
    permanentId =
      typeof permanentId === 'string' ? permanentId : permanentId.permanentId;

    const handler = this.findHandler(permanentId);
    if (!handler) {
      throw Error(`Trying to override ${permanentId} but it does not exist`);
    }

    (handler as HandlerData<T>).handler = newHandler;
  }

  /**
   * Calls a handler after ensuring it exists.
   * Note that the actual handler called may not be the one you passed, in case
   * it has been overridden.
   */
  public async handle<T extends any[] = any[]>(
    permanentId: string | HandlerData<T>,
    ...args: T
  ) {
    permanentId =
      typeof permanentId === 'string' ? permanentId : permanentId.permanentId;

    const handler = this.findHandler(permanentId);
    if (!handler) {
      throw Error(`Handler ${permanentId} not found`);
    }

    await handler.handler(...args);
  }

  public hasHandler(permanentId: string) {
    return this.findHandler(permanentId) !== null;
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

    const childHandlers = child.handlers;
    for (const handlerKey in childHandlers) {
      const childPermanentId = childHandlers[handlerKey].permanentId;
      const newHandlerKey = `${key}.${childPermanentId}`;

      this.registerHandler(newHandlerKey, async (...args: any[]) => {
        await this.children[key].handle(childPermanentId, ...args);
      });
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
    Ctor extends new (props: any) => any,
  >(
    key: Key,
    ctor: Ctor,
    // NoInfer ensures that the type of props is not inferred from the value of
    // props but from the type of Ctor.
    props: NoInfer<
      MakeOptional<ConstructorParameters<Ctor>[0], keyof TgDefaultProps<any>>
    >
  ): InstanceType<Ctor> {
    return this.addChild(
      key,
      new ctor({
        ...this.getDefaultProps(key),
        ...props,
      })
    );
  }

  /**
   * Creates all the default props for the given key.
   * This can be used in cases makeChild does not cover.
   */
  public getDefaultProps<Key extends keyof State & string>(
    key: Key
  ): TgDefaultProps<State extends null ? null : State[Key]> {
    return {
      ...this.getEventProps(key),
      ...this.getStateProps(key),
    };
  }

  /**
   * Creates just the default props relating to the events for the given key.
   * This can be used in cases makeChild does not cover.
   * It also does not require the key to be a valid key of the state.
   */
  public getEventProps(key: string): {
    getButton: TgButtonGetter;
    listenForMessageInput: MessageInputEventListener;
  } {
    return {
      getButton: (text, handler, ...args) =>
        this.props.getButton(text, `${key}.${handler}`, ...args),
      listenForMessageInput: (permanentId, filter) =>
        this.listenForMessageInput(`${key}.${permanentId}`, filter),
    };
  }

  /**
   * Instead of transparently passing the listenForMessageInput request to the
   * parent you can control exactly how and when the text input requests are
   * allowed through. If a request is made by component `key`, the request will
   * be found on `this.requestedMessageInput[key]`.
   *
   * This is useful when multiple children can request text inputs but some are
   * not rendered.
   *
   * Example:
   * ```ts
   * // constructor
   * this.makeChild('f', TgTextFormField, {
   *  label: 'Text field',
   *  ...this.memorizeMessageInputRequests('f'),
   * });
   *
   * //...
   *
   * // render
   * const state = this.getState();
   * const request = this.requestedMessageInput[state.activeKey];
   * if (request && state.enabled) {
   *   await this.listenForMessageInput(...request);
   * }
   * ```
   */
  public memorizeMessageInputRequests(key: string): {
    listenForMessageInput?: MessageInputEventListener;
  } {
    return {
      listenForMessageInput: (permanentId, filter) => {
        this.requestedMessageInput[key] = [`${key}.${permanentId}`, filter];
      },
    };
  }

  /**
   * Creates just the default props relating to state for the given key.
   * This can be used in cases makeChild does not cover.
   */
  public getStateProps<Key extends keyof State & string>(
    key: Key
  ): TgStateProps<State extends null ? null : State[Key]> {
    return {
      getState: () => {
        const state = this.getState();
        return state === null ? null : state[key];
      },
      setState: (state) => {
        // using patchState here leads to an error
        this.setState({
          ...this.getState(),
          [key]: state,
        });
      },
    };
  }

  /**
   * Loads all of the indicated properties and returns them in a single object.
   */
  public async getProperties<T extends (keyof Props & string)[]>(
    ...properties: T
  ): Promise<{
    [Key in keyof Pick<Props, T[number]>]: Awaited<MaybeCalled<Props[Key]>>;
  }> {
    return Object.fromEntries(
      await Promise.all(
        properties.map(async (key) => [key, await this.getProperty(key)])
      )
    );
  }

  /**
   * Get the value of a lazy loaded property, the value is also cached.
   * Ensure that the key refers to a lazy property and not a different
   * callable, as the function will be called with the state of the component.
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

    const prop = await maybeCall(this.props[key], this.getState());
    this.propsCache[key] = prop;
    return prop;
  }
}
