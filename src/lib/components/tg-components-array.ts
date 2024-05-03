import { Context } from 'grammy';
import { TgComponent, TgDefaultProps } from './tg-components';
import { InlineKeyboardButton } from 'grammy/types';

type GetChildState<ChildComponent extends TgComponent<any, any, any>> =
  ChildComponent extends TgComponent<infer T, any, any> ? T : never;

type State<
  ChildComponent extends TgComponent<any, any, C>,
  C extends Context,
> = Record<string, GetChildState<ChildComponent>>;

type Props<
  ChildCtor extends new (...args: any[]) => TgComponent<any, any, C>,
  C extends Context,
> = {
  ctor: ChildCtor;
  children: (Omit<
    ConstructorParameters<ChildCtor>[0],
    keyof TgDefaultProps<any>
  > &
    Partial<TgDefaultProps<any>>)[];
} & TgDefaultProps<State<InstanceType<ChildCtor>, C>>;

/**
 * Class to display an entire array of TgComponents of the same type.
 * Keys of children will simply be the (stringified) index.
 *
 * Example:
 * const TgCounterArray = TgComponentsArray<typeof TgCounter>;
 * type TgCounterArray = TgComponentsArray<typeof TgCounter>;
 *
 * ...
 *
 * this.counterArray = this.makeChild('a', TgCounterArray, {
 *   ctor: TgCounter,
 *   children: [
 *     { ctx, label: 'test1', inlineLabelPosition: 'left' },
 *     { ctx, label: 'test2', inlineLabelPosition: 'center' },
 *     { ctx, label: 'test3', inlineLabelPosition: 'right' },
 *   ],
 * });
 */
export class TgComponentsArray<
  ChildCtor extends new (...args: any[]) => TgComponent<any, any, C>,
  C extends Context = Context,
> extends TgComponent<State<InstanceType<ChildCtor>, C>, Props<ChildCtor, C>> {
  public override children: Record<string, InstanceType<ChildCtor>>;

  public constructor(props: Props<ChildCtor, C>) {
    super(props);
    this.children = {};
    for (const [idx, childProps] of props.children.entries()) {
      this.makeChild(idx.toString(), props.ctor, childProps);
    }
  }

  public getDefaultState(): State<InstanceType<ChildCtor>, C> {
    return this.getChildrenDefaultState();
  }

  public async render() {
    const renderedChildren = await this.renderMany();

    return {
      text: renderedChildren.map((child) => child.text).join(''),
      keyboard: renderedChildren
        .map((child) => child.keyboard)
        .filter((keyboard): keyboard is InlineKeyboardButton[][] => !!keyboard)
        .flat(),
    };
  }

  public renderMany() {
    return Promise.all(
      Object.entries(this.children)
        .map(([key, child]) => [key, child.render()])
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(
          ([, child]) => child as ReturnType<InstanceType<ChildCtor>['render']>
        )
    );
  }
}
