import { MessageEntity } from 'grammy/types';
import { MyContext } from '../../context.js';
import { Filter } from 'grammy';

type UnparsedMessage = (
  | string
  | { is_start: boolean; entity: MessageEntity }
)[];

type TextEntities = {
  text: string;
  entities?: MessageEntity[];
};
type MakeRequired<T, K extends keyof T> = T & {
  [key in K]-?: T[key];
};

/**
 * Unparses a message and returns a list of tokens, which can be characters or
 * start/end entities.
 */
export function unparse({ text, entities }: TextEntities): UnparsedMessage {
  entities ??= [];
  let entitiesIdx = 0;
  const entitiesStack: MessageEntity[] = [];
  const result: UnparsedMessage = [];

  for (let i = 0; i < text.length; i++) {
    while (
      entitiesIdx < entities.length &&
      entities[entitiesIdx].offset === i
    ) {
      const entity = entities[entitiesIdx];
      result.push({ entity, is_start: true });
      entitiesStack.push(entity);
      entitiesIdx += 1;
    }

    result.push(text[i]);

    while (
      entitiesStack.length &&
      entitiesStack.at(-1)!.length + entitiesStack.at(-1)!.offset === i + 1
    ) {
      result.push({ entity: entitiesStack.at(-1)!, is_start: false });
      entitiesStack.pop();
    }
  }

  return result;
}

/**
 * Picks the right message to unparse, removes irrelevant commands from the
 * text and adjusts entities as needed.
 */
export function getMessageToUnparse(
  ctx: Filter<MyContext, 'message'>
): MakeRequired<TextEntities, 'entities'> {
  const { message } = ctx;
  if (message.reply_to_message) {
    const replyToMessage = message.reply_to_message;
    return {
      text: replyToMessage.text ?? replyToMessage.caption ?? '',
      entities:
        replyToMessage.entities ?? replyToMessage.caption_entities ?? [],
    };
  }

  if (!ctx.match) {
    return {
      text: message.text ?? message.caption ?? '',
      entities: message.entities ?? message.caption_entities ?? [],
    };
  }

  if (typeof ctx.match !== 'string') {
    throw new Error('Unexpected match type');
  }

  const messageText = ctx.match;
  const entities = (message.entities ?? [])
    .map((x) => ({
      ...x,
      offset: x.offset - ctx.message.text!.length + messageText.length,
    }))
    .filter((x) => x.offset + x.length > 0)
    .map((x) => ({
      ...x,
      offset: Math.max(x.offset, 0),
      length: x.length + x.offset - Math.max(x.offset, 0),
    }));

  return {
    text: messageText,
    entities,
  };
}
