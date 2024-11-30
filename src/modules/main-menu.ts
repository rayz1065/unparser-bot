import { Composer } from 'grammy';
import { MyContext } from '../context.js';
import { TgCallbacksBag } from 'grammy-tg-components';
import { documentationMenuCb } from './unparse/documentation.js';

export const mainMenuModule = new Composer<MyContext>();
const _mainMenuModule = mainMenuModule.chatType(['private']);
const callbacksBag = new TgCallbacksBag<MyContext>('menu');
_mainMenuModule.use(callbacksBag);

async function replyWithMainMenu(ctx: MyContext) {
  await ctx.editOrReply({
    text: ctx.t('welcome'),
    keyboard: [
      [documentationMenuCb.getBtn(ctx.t('documentation-btn'), false)],
      [infoCb.getBtn(ctx.t('info-btn'))],
      [sampleCb.getBtn(ctx.t('sample-btn'))],
    ],
  });
}

_mainMenuModule.command('start', replyWithMainMenu);
export const menuCb = callbacksBag.makeCallback('menu', replyWithMainMenu);

/**
 * Sample formatting taken from https://core.telegram.org/bots/api#html-style
 */
const sampleCb = callbacksBag.makeCallback('sample', async (ctx) => {
  await ctx.editOrReply({
    text:
      `<b>bold</b>, <strong>bold</strong>
<i>italic</i>, <em>italic</em>
<u>underline</u>, <ins>underline</ins>
<s>strikethrough</s>, <strike>strikethrough</strike>, <del>strikethrough</del>
<span class="tg-spoiler">spoiler</span>, <tg-spoiler>spoiler</tg-spoiler>
<b>bold <i>italic bold <s>italic bold strikethrough <span class="tg-spoiler">italic bold strikethrough spoiler</span></s> <u>underline italic bold</u></i> bold</b>
<a href="http://www.example.com/">inline URL</a>
<a href="tg://user?id=${ctx.from.id}">inline mention of a user</a>
<tg-emoji emoji-id="5368324170671202286">👍</tg-emoji>
<code>inline fixed-width code</code>
<pre>pre-formatted fixed-width code block</pre>
<pre><code class="language-python">pre-formatted fixed-width code block written in the Python programming language</code></pre>
<blockquote>Block quotation started\nBlock quotation continued\nThe last line of the block quotation</blockquote>
<blockquote expandable>Expandable block quotation started\nExpandable block quotation continued\nExpandable block quotation continued\nHidden by default part of the block quotation started\nExpandable block quotation continued\nThe last line of the block quotation</blockquote>\n\n` +
      ctx.t('sample-reply-with-html-md'),
    keyboard: [[menuCb.getBtn(ctx.t('back-to-menu'))]],
  });
});

async function replyWithInfo(ctx: MyContext) {
  await ctx.editOrReply({
    text: ctx.t('info-message'),
    keyboard: [
      [
        { text: '📦', url: 'https://github.com/rayz1065/unparser-bot' },
        { text: '🛠', url: 'https://grammy.dev' },
        {
          text: '📚',
          url: 'https://core.telegram.org/bots/api#formatting-options',
        },
        { text: '🧑‍💻', url: 'https://t.me/rayz1065' },
        { text: '📄', url: 'https://www.gnu.org/licenses/agpl-3.0.en.html' },
      ],
      [menuCb.getBtn(ctx.t('back-to-menu'))],
    ],
  });
}

const infoCb = callbacksBag.makeCallback('info', replyWithInfo);
_mainMenuModule.command('help', replyWithInfo);
_mainMenuModule.command('info', replyWithInfo);
_mainMenuModule.command('developer_info', replyWithInfo);
