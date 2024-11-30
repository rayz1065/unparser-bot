import { Composer } from 'grammy';
import { MyContext } from '../../context.js';
import { getMessageToUnparse } from './unparse.js';
import { fmt, pre } from '@grammyjs/parse-mode';

export const unparseEntitiesModule = new Composer<MyContext>();
const _unparseEntitiesModule = unparseEntitiesModule.chatType([
  'private',
  'group',
  'supergroup',
]);

_unparseEntitiesModule.command('entities', async (ctx) => {
  if (!ctx.match && !ctx.message.reply_to_message) {
    return await ctx.reply(ctx.t('entities-usage'));
  }

  const toUnparse = getMessageToUnparse(ctx);
  const entities = toUnparse.entities.map((entity) => ({
    ...entity,
    text: toUnparse.text.substring(
      entity.offset,
      entity.offset + entity.length
    ),
  }));

  const prettyRes = fmt`${pre(JSON.stringify(entities, null, 2), 'JSON')}`;
  await ctx.splitAndReply(prettyRes.text, { entities: prettyRes.entities });
});
