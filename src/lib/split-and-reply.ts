import { Context, MiddlewareFn } from 'grammy';
import { MessageEntity } from 'grammy/types';

type Tail<T extends Array<unknown>> = T extends [
  head: unknown,
  ...tail: infer E2,
]
  ? E2
  : [];

export type SplitAndReplyFlavor<C extends Context> = C & {
  splitAndReply: (
    text: string,
    other?: Parameters<C['reply']>[1],
    ...rest: Tail<Tail<Parameters<C['reply']>>>
  ) => Promise<Awaited<ReturnType<C['reply']>>[]>;
};

function checkEntityBounds(
  entity: MessageEntity,
  messageStart: number,
  messageEnd: number
): boolean {
  return (
    entity.offset <= messageEnd && entity.offset + entity.length >= messageStart
  );
}

function fixEntityBounds<T extends MessageEntity>(
  entity: T,
  messageStart: number,
  messageEnd: number
): T {
  const entityStart = Math.max(entity.offset, messageStart);
  const entityEnd = Math.min(entity.offset + entity.length - 1, messageEnd);

  return {
    ...entity,
    offset: entityStart - messageStart,
    length: entityEnd - entityStart + 1,
  };
}

export function splitAndReply<C extends Context>(options?: {
  maxMessageLength?: number;
}): MiddlewareFn<SplitAndReplyFlavor<C>> {
  const maxMessageLength = options?.maxMessageLength ?? 4096;

  return async (ctx, next) => {
    ctx.splitAndReply = async (text, other, ...rest) => {
      let messageIdx = 0;
      const results: Awaited<ReturnType<C['reply']>>[] = [];
      const entities = other?.entities ?? [];

      do {
        const start = messageIdx * maxMessageLength;
        const end = (messageIdx + 1) * maxMessageLength - 1; // inclusive

        results.push(
          (await ctx.reply(
            text.substring(start, end + 1),
            {
              ...other,
              parse_mode: undefined,
              entities: entities
                .filter((entity) => checkEntityBounds(entity, start, end))
                .map((entity) => fixEntityBounds(entity, start, end)),
            },
            ...rest
          )) as Awaited<ReturnType<C['reply']>>
        );
        messageIdx += 1;
      } while (messageIdx * maxMessageLength < text.length);

      return results;
    };

    await next();
  };
}
