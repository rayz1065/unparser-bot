import { InlineKeyboardButton } from 'grammy/types';
import { MaybePromise } from './maybe-callable';
import { TgComponent } from './tg-components';

export interface ExpandableComponent {
  isExpanded(): MaybePromise<boolean>;
  collapse(): MaybePromise<void>;
  expand(): MaybePromise<void>;
  toggleExpanded(): MaybePromise<void>;
}

type ExpandableComponentRecord = Record<
  string,
  ExpandableComponent & TgComponent<any, any>
>;
type Rendered<T extends TgComponent<any, any>> = Awaited<
  ReturnType<T['render']>
>;

/**
 * Finds and returns the first component which is marked as expanded.
 */
export async function findFirstExpanded<T extends ExpandableComponentRecord>(
  components: T
): Promise<keyof T | null> {
  for (const key in components) {
    const component = components[key];
    if (await component.isExpanded()) {
      return key;
    }
  }

  return null;
}

/**
 * Renders all of the expandable components present in the passed object, if
 * one is expanded it will be returned in `expanded`. The combined texts and
 * keyboards will be returned in `combined`.
 *
 * Works well together with `memorizeTextInputRequests`.
 *
 * Example:
 * ```ts
 * const { expanded, combined } = await renderExpandableComponents({
 *   f: this.formField,
 *   n: this.numericField,
 *   s: this.selectField,
 *   c: this.checkboxField,
 * });
 *
 * if (expanded) {
 *   const request = this.requestedTextInput[expanded.key];
 *   if (request) {
 *     await this.listenForTextInput(request);
 *   }
 * }
 *
 * return {
 *   text: combined.text,
 *   keyboard: expanded ? expanded.rendered.keyboard : combined.keyboard,
 * };
 * ```
 */
export async function renderExpandableComponents<
  T extends ExpandableComponentRecord,
>(
  components: T
): Promise<{
  expanded: {
    key: keyof T;
    component: T[keyof T];
    rendered: Rendered<T[keyof T]>;
  } | null;
  rendered: { [K in keyof T]: Rendered<T[K]> };
  combined: {
    text: string;
    keyboard: InlineKeyboardButton[][];
  };
}> {
  const rendered = Object.fromEntries(
    await Promise.all(
      Object.entries(components).map(async ([key, value]) => {
        return [key, await value.render()];
      })
    )
  ) as { [K in keyof T]: Rendered<T[K]> };

  const expandedKey = await findFirstExpanded(components);

  return {
    rendered,
    expanded: expandedKey
      ? {
          key: expandedKey,
          component: components[expandedKey],
          rendered: rendered[expandedKey],
        }
      : null,
    combined: {
      text: Object.entries(rendered)
        .map(([, value]) => value.text)
        .join(''),
      keyboard: Object.entries(rendered).reduce<InlineKeyboardButton[][]>(
        (acc, [, value]) => acc.concat(value.keyboard ?? []),
        []
      ),
    },
  };
}
