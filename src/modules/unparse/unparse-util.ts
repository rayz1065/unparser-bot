import { MessageEntity } from 'grammy/types';
import { MyContext } from '../../context.js';
import { Filter } from 'grammy';
import { User } from 'grammy/types';

type TextEntities = {
  text: string;
  entities?: MessageEntity[];
};
type MakeRequired<T, K extends keyof T> = T & {
  [key in K]-?: T[key];
};

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

/**
 * Replaces all the inline mentions present in the text with ones of the
 * specified user.
 */
export function replaceMentions(user: User, text: string) {
  return text.replace(/tg:\/\/user\?id=(\d+)/g, () => {
    return `tg://user?id=${user.id}`;
  });
}
