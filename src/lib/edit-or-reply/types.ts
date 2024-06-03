import {
  Animation,
  Audio,
  Document,
  InlineKeyboardButton,
  InputMedia,
  LinkPreviewOptions,
  MessageEntity,
  ParseMode,
  PhotoSize,
  ReplyParameters,
  Video,
} from 'grammy/types';

export type Other = {
  reply_markup?: { inline_keyboard: InlineKeyboardButton[][] };
  parse_mode?: ParseMode;
  entities?: MessageEntity[];
  link_preview_options?: LinkPreviewOptions;
  disable_notification?: boolean;
  protect_content?: boolean;
  message_thread_id?: number;
  business_connection_id?: string;
  has_spoiler?: boolean;
  reply_parameters?: ReplyParameters;
};

export type MediaOther<
  T extends Exclude<keyof Other, 'parse_mode' | 'entities'>[],
> = {
  caption?: string;
  caption_entities?: MessageEntity[];
  parse_mode?: ParseMode;
} & { [K in T[number]]?: Other[K] };

export type MessageDataMedia = {
  text?: string;
  media: Omit<InputMedia, 'caption' | 'caption_entities' | 'parse_mode'>;
} & Other;

export type MessageDataText = {
  text: string;
} & Other;

export type MessageData = MessageDataMedia | MessageDataText;

export function messageDataHasMedia(
  messageData: MessageData
): messageData is MessageDataMedia {
  return 'media' in messageData && messageData.media !== undefined;
}

export type MessageMediaInfo =
  | {
      type: 'photo';
      media: PhotoSize[];
      fileId: string;
    }
  | {
      type: 'animation';
      media: Animation;
      fileId: string;
    }
  | {
      type: 'audio';
      media: Audio;
      fileId: string;
    }
  | {
      type: 'document';
      media: Document;
      fileId: string;
    }
  | {
      type: 'video';
      media: Video;
      fileId: string;
    };

export type OldMessageInfoChatMessage = {
  hasMedia: boolean;
  chatId: number;
  messageId: number;
};

export type OldMessageInfoChat = {
  chatId: number;
};

export type OldMessageInfoInline = {
  hasMedia: boolean;
  inlineMessageId: string;
};

export type OldMessageInfo =
  | OldMessageInfoChat
  | OldMessageInfoInline
  | OldMessageInfoChatMessage;

export function oldMessageIsInline(
  oldMessageInfo: OldMessageInfo
): oldMessageInfo is OldMessageInfoInline {
  return (
    'inlineMessageId' in oldMessageInfo &&
    oldMessageInfo.inlineMessageId !== undefined
  );
}

export function oldMessageIsMessage(
  oldMessageInfo: OldMessageInfo
): oldMessageInfo is OldMessageInfoChatMessage {
  return (
    'messageId' in oldMessageInfo && oldMessageInfo.messageId !== undefined
  );
}

export function oldMessageIsChat(
  oldMessageInfo: OldMessageInfo
): oldMessageInfo is OldMessageInfoChat {
  return (
    'chatId' in oldMessageInfo &&
    oldMessageInfo.chatId !== undefined &&
    !oldMessageIsMessage(oldMessageInfo)
  );
}
