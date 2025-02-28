import { PollingOptions } from 'grammy';
import {
  BotCommandScope,
  ChatAdministratorRights,
  LanguageCode,
} from 'grammy/types';
import z from 'zod';

/**
 * The setup script will read the following items from translation files:
 * - bot-name
 * - bot-description
 * - bot-short-description
 * - bot commands (described below)
 *
 * Make sure to change them
 */

/**
 * Add here the list of commands for the bot, with scope if necessary
 * The descriptions will be taken from the translation files as
 * `cmd-description-${command}`
 */
export const myCommands: { command: string; scope?: BotCommandScope }[] = [
  { command: 'start', scope: { type: 'all_private_chats' } },
  { command: 'help', scope: { type: 'all_private_chats' } },
  { command: 'html', scope: { type: 'all_private_chats' } },
  { command: 'html' },
  { command: 'md', scope: { type: 'all_private_chats' } },
  { command: 'md' },
  { command: 'both', scope: { type: 'all_private_chats' } },
  { command: 'both' },
  { command: 'entities', scope: { type: 'all_private_chats' } },
  { command: 'entities' },
  { command: 'phtml', scope: { type: 'all_private_chats' } },
  { command: 'phtml' },
  { command: 'pmd', scope: { type: 'all_private_chats' } },
  { command: 'pmd' },
  { command: 'htmlmd', scope: { type: 'all_private_chats' } },
  { command: 'htmlmd' },
  { command: 'mdhtml', scope: { type: 'all_private_chats' } },
  { command: 'mdhtml' },
];

/**
 * Set the relevant rights for channels and groups
 * If worksInChannels (worksInGroups) is set to false, the default
 * administrator rights will be unset
 */

export const worksInChannels = false;
export const channelDefaultAdministratorRights: ChatAdministratorRights = {
  can_manage_chat: true,
  can_change_info: false,
  can_invite_users: true,
  can_delete_messages: true,
  can_delete_stories: false,
  can_edit_stories: false,
  can_post_stories: false,
  can_manage_video_chats: false,
  can_promote_members: false,
  can_restrict_members: false,
  is_anonymous: false,
  can_edit_messages: true,
  can_post_messages: true,
} as const;

export const worksInGroups = true;
export const groupDefaultAdministratorRights: ChatAdministratorRights = {
  can_manage_chat: false,
  can_change_info: false,
  can_invite_users: false,
  can_delete_messages: false,
  can_delete_stories: false,
  can_edit_stories: false,
  can_post_stories: false,
  can_manage_video_chats: false,
  can_promote_members: false,
  can_restrict_members: false,
  is_anonymous: false,
  can_manage_topics: false,
  can_pin_messages: false,
} as const;

/**
 * List of allowed updates
 * Leave an empty list to receive all updates except a few specified on the API documentation
 * (message_reaction, message_reaction_count, chat_member as of right now)
 */
export const allowedUpdates: PollingOptions['allowed_updates'] = [
  // received by default
  // 'message',
  // 'edited_message',
  // 'channel_post',
  // 'edited_channel_post',
  // 'business_connection',
  // 'business_message',
  // 'edited_business_message',
  // 'deleted_business_messages',
  // 'inline_query',
  // 'chosen_inline_result',
  // 'callback_query',
  // 'shipping_query',
  // 'pre_checkout_query',
  // 'poll',
  // 'poll_answer',
  // 'my_chat_member',
  // 'chat_join_request',
  // 'chat_boost',
  // 'removed_chat_boost',
  //
  // not received by default
  // 'message_reaction',
  // 'message_reaction_count',
  // 'chat_member',
];

export const pollingOptions: PollingOptions = {
  allowed_updates: allowedUpdates,
};

/**
 * Add any further steps required to properly configure the bot
 * that cannot be done automatically through the API
 */
export function setupGuideManualSteps() {
  return ['Update the bot picture', 'Set inline feedback to 100%'];
}

/**
 * Properties that must be set through BotFather
 */
export const botProperties = {
  can_join_groups: worksInGroups,
  can_read_all_group_messages: false,
  supports_inline_queries: true,
  can_connect_to_business: false,
} as const;

/**
 * A list of supported locales
 */
export const supportedLocales = ['en'] as const satisfies LanguageCode[];

/**
 * Creates the config for the app by parsing the env
 */
function getAppConfig(env: NodeJS.ProcessEnv) {
  const res = z
    .object({
      TZ: z.string(),
      BOT_TOKEN: z.string(),
      ADMIN_USER_IDS: z.preprocess(
        (x) => JSON.parse(String(x)),
        z.array(z.number())
      ),
      DEFAULT_LOCALE: z.enum(supportedLocales).default('en'),
      USE_WEBHOOK: z
        .preprocess((x) => x === 'true', z.boolean())
        .default(false),
      WEBHOOK_SECRET: z.string().default(''),
      API_ROOT_URL: z.string(),
      WEBHOOK_URL: z.string().optional(),
      NODE_ENV: z.enum(['development', 'production']).default('development'),
      LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    })
    .parse(env);

  if (res.ADMIN_USER_IDS.length === 0) {
    console.warn('Config warning: ADMIN_USER_IDS is empty');
  }

  if (res.USE_WEBHOOK && !res.WEBHOOK_SECRET) {
    throw new Error(
      'Config error: WEBHOOK_SECRET is required when using webhook'
    );
  }

  return res;
}

export type AppConfig = ReturnType<typeof getAppConfig>;
export type AppConfigFlavor = { config: AppConfig };
export const appConfig = getAppConfig(process.env);
