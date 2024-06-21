import { Composer, Context, Filter, MiddlewareFn } from 'grammy';
import { TgComponent } from './tg-components';
import {
  Conversation,
  ConversationFlavor,
  createConversation,
} from '@grammyjs/conversations';
import {
  TgComponentsConversationData,
  TgComponentsFlavor,
} from './tg-components-middleware';
import { EditOrReplyFlavor } from 'grammy-edit-or-reply';
import { TgDefaultProps } from './types';
import { TgCallback, TgCallbackFlavor, TgCallbacksBag } from '../tg-callback';
import { MaybePromise } from './maybe-callable';
import { EventRejectionError } from './errors';

type LocalContext = Context &
  TgComponentsFlavor & {
    conversationData?: TgComponentsConversationData;
  } & TgCallbackFlavor &
  ConversationFlavor &
  EditOrReplyFlavor;

type TgRootOptions<C extends LocalContext, T extends unknown[] = never[]> = {
  /**
   * Create a custom state key based on the params, this is useful if the state
   * must be distinct based on the params.
   */
  getStateKey?: (...params: T) => string;

  /**
   * A factory that returns the component, it may load data based on the
   * params, it should pass the default props to the created component.
   */
  componentFactory: (
    ctx: C,
    defaultProps: TgDefaultProps<any>,
    ...params: T
  ) => MaybePromise<TgComponent<any, any, C>>;
};

type TgRootCallbackParams<T extends any[]> = [
  T,
  permanentId: string | null,
  ...args: any[],
];

/**
 * This class offers a simple way to register a TgComponent as an interactive
 * UI element within your bot, it will deal with listening to callbacks and
 * messages directed to the component, handling them, and re-rendering the
 * component afterwards.
 *
 * The `rootId` is used to specify what callback queries the component will
 * handle, it may not contain dots, all callbacks of the form
 * `${rootId}.h${string}` will then be consumed by this component.
 *
 * To listen for messages, this class will set up a conversation and
 * automatically enters it when a message is needed, exits when it's not.
 *
 * The root will keep track of the state of the component by storing it in the
 * key specified by the `rootId` within the space allocated by the
 * `tg-components` plugin in the session.
 *
 * There are some cases in which you may want the key to be dynamic (example:
 * the component keeps track about the info of a group, and there are multiple
 * groups to keep track of).
 * To deal with this, specify the parameters as the generic type `T` (e.g.
 * `[groupId: number]`) and pass a custom `getStateKey` within the options.
 *
 * **Please note**: the parameters you pass within `T` must be JSON
 * serializable and must be rather short in order to fit (alongside other data)
 * within the 64 bytes of telegram callback queries.
 *
 * These parameters are also passed to the `componentFactory` and can be used
 * to load props (e.g. loading the group info from the database).
 *
 * Example:
 * ```typescript
 * const myRoot = new TgRoot<MyContext>('unique-id', {
 *   componentFactory: (ctx, defaultProps) =>
 *     new MyComponent({
 *       ctx,
 *       ...defaultProps,
 *     }),
 * });
 * bot.use(myRoot);
 * ```
 */
export class TgRoot<C extends LocalContext, T extends unknown[] = never[]> {
  private callbacksBag: TgCallbacksBag<C>;
  private callback: TgCallback<C, TgRootCallbackParams<T>>;
  private composer: Composer<C>;

  public constructor(
    private rootId: string,
    private options: TgRootOptions<C, T>
  ) {
    this.composer = new Composer<C>();

    // messages listener
    this.composer.use(
      createConversation(this.conversation.bind(this), {
        id: this.getConversationKey(),
      })
    );

    // callback listener
    this.callbacksBag = new TgCallbacksBag(rootId);
    this.callback = this.callbacksBag.makeCallback<TgRootCallbackParams<T>>(
      'h',
      this.callbackHandler.bind(this)
    );
    this.composer.use(this.callbacksBag);
  }

  /**
   * Get the default props for the component rooted through this root, using
   * these will ensure that all requests are routed properly and the state is
   * maintained.
   */
  public getDefaultProps(ctx: C, ...params: T) {
    const stateKey = this.getStateKey(...params);

    const defaultProps: TgDefaultProps<any> = {
      getButton: (text, permanentId, ...args) =>
        this.getBtn(text, params, permanentId, ...args),
      getState: () => ctx.components.get(stateKey),
      setState: (state) => ctx.components.set(stateKey, state),
      listenForMessageInput: async (permanentId, filter) => {
        ctx.conversationData = {
          components: { permanentId, filter, params },
        };

        await ctx.conversation.reenter(this.getConversationKey());
      },
    };

    return defaultProps;
  }

  /**
   * Gets the component associated to this root, useful if you want to enter
   * the component within one of your regular handlers.
   *
   * Example:
   * ```
   * bot.command('gallery', async (ctx) => {
   *   const component = await galleryRoot.getComponent(ctx);
   *   await ctx.editOrReply(await component.render());
   * });
   * ```
   */
  public async getComponent(ctx: C, ...params: T) {
    return await this.options.componentFactory(
      ctx,
      this.getDefaultProps(ctx, ...params),
      ...params
    );
  }

  /**
   * Gets a callback button to run a handler over this component, useful to
   * enter the component from a different section of the bot.
   *
   * Example:
   * ```typescript
   * // creates a back button for the menu passing no params and no handler
   * // when this button is pressed it will only render the menu, without
   * // running any handler
   * const backButton = menuRoot.getBtn('Back 🔙', [], null);
   * ```
   *
   * Run `getButton` on an instance of the component for more useful typing
   * information if you need to run a handler.
   */
  public getBtn(text: string, ...values: TgRootCallbackParams<T>) {
    return this.callback.getBtn(text, ...values);
  }

  /**
   * Get the conversation key used by this root.
   */
  public getConversationKey() {
    return `.tgc_${this.rootId}`;
  }

  /**
   * Get the key of the state, either using the `getStateKey` option if one was
   * provided or the `rootId` as fallback.
   */
  public getStateKey(...params: T) {
    return this.options.getStateKey
      ? this.options.getStateKey(...params)
      : this.rootId;
  }

  /**
   * Get the middleware to register on your bot.
   *
   * Example:
   * ```
   * bot.use(myRoot);
   * ```
   */
  public middleware(): MiddlewareFn<C> {
    return (ctx, next) => {
      return this.composer.middleware()(ctx, next);
    };
  }

  private async callbackHandler(
    ctx: Omit<Filter<C, 'callback_query:data'>, 'callbackParams'> & {
      callbackParams: TgRootCallbackParams<T>;
    }
  ) {
    const [params, permanentId, ...args] = ctx.callbackParams;
    const component = await this.getComponent(ctx as C, ...params);
    await ctx.conversation.exit(this.getConversationKey());

    if (permanentId !== null) {
      try {
        await component.handle(permanentId, ...args);
      } catch (error) {
        if (error instanceof EventRejectionError) {
          await ctx.components.eventRejectionHandler(error);
          return;
        }

        throw error;
      }
    }

    await ctx.editOrReply(await component.render());
  }

  private async conversation(conversation: Conversation<C>, ctx: C) {
    if (!ctx.conversationData?.components) {
      throw Error('Expected to find components in conversation data');
    }

    const { params, permanentId, filter } = ctx.conversationData.components;
    if (!params || !permanentId || !filter) {
      throw Error('Missing required component data from conversation data');
    }

    const messageCtx = await conversation.waitFor(filter);

    const component = await this.getComponent(messageCtx, ...(params as T));

    try {
      await component.handle(permanentId, messageCtx);
    } catch (error) {
      if (error instanceof EventRejectionError) {
        await messageCtx.components.eventRejectionHandler(error);
        await conversation.skip({ drop: true });
      }

      throw error;
    }

    await messageCtx.editOrReply(await component.render());
  }
}
