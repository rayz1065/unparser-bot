import { Message, MessageEntity, ReplyParameters } from 'grammy/types';

function checkEntityBounds(
  entity: MessageEntity,
  start: number,
  end: number
): boolean {
  return entity.offset < end && entity.offset + entity.length >= start;
}

function fixEntityBounds<T extends MessageEntity>(
  entity: T,
  start: number,
  end: number
): T {
  const entityStart = Math.max(entity.offset, start);
  const entityEnd = Math.min(entity.offset + entity.length, end);

  return {
    ...entity,
    offset: entityStart - start,
    length: entityEnd - entityStart,
  };
}

/**
 * End is exclusive
 */
export function quoteMessage(message: Message, start: number, end: number) {
  const text = message.text ?? message.caption;
  const entities = message.entities ?? message.caption_entities ?? [];
  if (text === undefined) {
    throw new Error('You should decide how you want to handle this...');
  }
  return {
    message_id: message.message_id,
    chat_id: message.chat.id,
    quote: text.substring(start, end),
    quote_entities: entities
      .filter((entity) => checkEntityBounds(entity, start, end))
      .map((entity) => fixEntityBounds(entity, start, end)),
    quote_position: start,
  } satisfies ReplyParameters;
}
