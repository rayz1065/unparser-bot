import assert from 'assert';
import { Api, Context } from 'grammy';
import { InputMedia } from 'grammy/types';
import {
  CaptionOther,
  MediaType,
  MessageData,
  MessageDataMedia,
  OldMessageInfo,
  OldMessageInfoChat,
  OldMessageInfoChatMessage,
  Other,
  messageDataHasMedia,
  oldMessageIsInline,
  oldMessageIsMessage,
} from './types';
import { getMessageInfo } from './message-info';

/**
 * Creates the `other` parameter with the specified keys.
 *
 * For media use `makeCaptionOther` instead, which deals with differently
 * specified entities and adds in text as caption if present.
 */
export function makeOther<T extends (keyof Other)[]>(
  messageData: MessageData,
  keys: T
): { [K in T[number]]?: Other[K] } {
  const other: { [K in T[number]]?: Other[K] } = {};

  keys.forEach((key: T[number]) => {
    if (key in messageData && messageData[key]) {
      other[key] = messageData[key] as any;
    }
  });

  return other;
}

/**
 * Creates the `other` parameter for a media, including `entities`,
 * `caption_entities`, and any other passed parameter.
 */
export function makeCaptionOther<T extends Exclude<keyof Other, 'entities'>[]>(
  messageData: MessageData,
  keys: T
): CaptionOther<T> {
  const result = {} as CaptionOther<T>;

  if ('entities' in messageData) {
    result.caption_entities = messageData.entities;
  }
  if ('text' in messageData) {
    result.caption = messageData.text;
  }

  return { ...result, ...makeOther(messageData, keys) };
}

/**
 * Creates the input media, adding available properties
 */
export function makeInputMedia(messageData: MessageDataMedia): InputMedia {
  const other: Parameters<typeof makeCaptionOther>[1] = ['parse_mode'];

  if (
    (['animation', 'photo', 'video'] as MediaType[]).includes(
      messageData.media.type
    )
  ) {
    other.push('has_spoiler', 'show_caption_above_media');
  }

  return {
    ...messageData.media,
    ...makeCaptionOther(messageData, other),
  };
}

/**
 * Sends a media to the specified chat in a new message
 */
export async function sendMedia(
  api: Api,
  messageData: MessageDataMedia,
  oldMessageInfo: OldMessageInfoChat | OldMessageInfoChatMessage
) {
  const { chatId } = oldMessageInfo;
  const {
    media: { media, type: mediaType },
  } = messageData;

  const defaultOther = [
    'business_connection_id',
    'disable_notification',
    'message_thread_id',
    'protect_content',
    'reply_markup',
    'reply_parameters',
    'message_effect_id',
    'parse_mode',
  ] as const satisfies (keyof Other)[];

  if (mediaType === 'photo') {
    return await api.sendPhoto(
      chatId,
      media,
      makeCaptionOther(messageData, [
        ...defaultOther,
        'has_spoiler',
        'show_caption_above_media',
      ])
    );
  } else if (mediaType === 'animation') {
    return await api.sendAnimation(
      chatId,
      media,
      makeCaptionOther(messageData, [
        ...defaultOther,
        'has_spoiler',
        'show_caption_above_media',
      ])
    );
  } else if (mediaType === 'audio') {
    return await api.sendAudio(
      chatId,
      media,
      makeCaptionOther(messageData, defaultOther)
    );
  } else if (mediaType === 'document') {
    return await api.sendDocument(
      chatId,
      media,
      makeCaptionOther(messageData, defaultOther)
    );
  } else if (mediaType === 'video') {
    return await api.sendVideo(
      chatId,
      media,
      makeCaptionOther(messageData, [
        ...defaultOther,
        'has_spoiler',
        'show_caption_above_media',
      ])
    );
  } else {
    throw new Error(`Unsupported media type: ${mediaType as string}`);
  }
}

/**
 * Tries deleting the specified message, does **not** throw an error on failure
 */
export function deleteStaleMessage(
  api: Api,
  oldMessageInfo: OldMessageInfoChatMessage
) {
  api
    .deleteMessage(oldMessageInfo.chatId, oldMessageInfo.messageId)
    .catch(() => {});
}

/**
 * Use this when context is not available but you still have data regarding the
 * message that needs to be edited (if any).
 */
export async function editOrReplyMessage(
  api: Api,
  messageData: MessageData,
  oldMessageInfo: OldMessageInfo
) {
  if (oldMessageIsInline(oldMessageInfo)) {
    const { inlineMessageId, hasMedia } = oldMessageInfo;

    if (!hasMedia && messageDataHasMedia(messageData)) {
      throw Error(
        'Original inline message had no media, ' +
          'but trying to add a media while editing'
      );
    }

    if (hasMedia && messageDataHasMedia(messageData)) {
      // we can edit the media as well
      return await api.editMessageMediaInline(
        inlineMessageId,
        makeInputMedia(messageData),
        makeOther(messageData, ['reply_markup'])
      );
    } else if (hasMedia) {
      // we can't remove the media, but we can still try changing the caption
      return await api.editMessageCaptionInline(
        inlineMessageId,
        makeCaptionOther(messageData, ['reply_markup', 'parse_mode'])
      );
    } else {
      // we can simply edit the text
      assert(!messageDataHasMedia(messageData));
      return await api.editMessageTextInline(
        inlineMessageId,
        messageData.text,
        makeOther(messageData, [
          'entities',
          'link_preview_options',
          'reply_markup',
          'parse_mode',
        ])
      );
    }
  }

  if (oldMessageIsMessage(oldMessageInfo)) {
    const { chatId, hasMedia, messageId } = oldMessageInfo;

    if (hasMedia && messageDataHasMedia(messageData)) {
      // we can edit the media as well
      return await api.editMessageMedia(
        chatId,
        messageId,
        makeInputMedia(messageData),
        makeOther(messageData, ['reply_markup'])
      );
    } else if (hasMedia) {
      // delete the existing message, send a new one without media
      assert(!messageDataHasMedia(messageData));
      const result = await api.sendMessage(
        chatId,
        messageData.text,
        makeOther(messageData, [
          'business_connection_id',
          'disable_notification',
          'entities',
          'link_preview_options',
          'parse_mode',
          'protect_content',
          'reply_markup',
          'reply_parameters',
          'message_effect_id',
        ])
      );
      deleteStaleMessage(api, oldMessageInfo);
      return result;
    } else if (messageDataHasMedia(messageData)) {
      // send the media to the chat
      const result = await sendMedia(api, messageData, oldMessageInfo);
      deleteStaleMessage(api, oldMessageInfo);
      return result;
    } else {
      // neither have media, we can edit the message text
      assert(!messageDataHasMedia(messageData));
      const { text } = messageData;
      return await api.editMessageText(
        chatId,
        messageId,
        text,
        makeOther(messageData, [
          'entities',
          'link_preview_options',
          'parse_mode',
          'reply_markup',
        ])
      );
    }
  }

  // no option but to send the message to the chat
  const { chatId } = oldMessageInfo;
  if (!messageDataHasMedia(messageData)) {
    // send message without media
    return await api.sendMessage(
      chatId,
      messageData.text,
      makeOther(messageData, [
        'business_connection_id',
        'disable_notification',
        'entities',
        'link_preview_options',
        'message_thread_id',
        'parse_mode',
        'protect_content',
        'reply_markup',
        'reply_parameters',
        'message_effect_id',
      ])
    );
  } else {
    // send the media to the chat
    return await sendMedia(api, messageData, oldMessageInfo);
  }
}

/**
 * Edits or sends a message to the current chat. The data of the current
 * message is obtained through `getMessageInfo`, if the message is inaccessible
 * or the update is a callback on an inline message it will assume the original
 * message has a media if and only if the new message has a media.
 *
 * If you have the data of the old message use `editOrReplyMessage` directly.
 */
export async function editOrReply<C extends Context>(
  ctx: C,
  messageData: MessageData
) {
  return await editOrReplyMessage(
    ctx.api,
    messageData,
    getMessageInfo(ctx, messageDataHasMedia(messageData))
  );
}
