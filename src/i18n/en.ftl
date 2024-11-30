-bot-creator = @rayz1065
-source = github.com/rayz1065/unparser-bot

# base
cancel = ❌ Cancel
back = 🔙 Back
back-to-menu = 🏘 Back to menu
confirm = ✅ Confirm

# bot names and descriptions
bot-name = Unparser Bot 🌐
bot-short-description = Convert Telegram messages to html and markdown
    🧑‍💻 Dev: {-bot-creator}
    📦 Source: {-source}
bot-description = 
    Convert Telegram messages to html and markdown

    • 💬 → 🌐 /html <message>
    • 💬 → ⬇️ /md <message>

    • 🌐 → 💬 /phtml <message>
    • ⬇️ → 💬 /pmd <message>

    🧑‍💻 Dev: {-bot-creator}
    📦 Source: {-source}

# commands
cmd-description-start = Start the bot
cmd-description-help = Get help for the bot
cmd-description-html = Convert message to HTML
cmd-description-md = Convert message to Markdown
cmd-description-both = Convert message to HTML and MarkdownV2
cmd-description-entities = Convert message to entities list
cmd-description-phtml = Parse HTML to message
cmd-description-pmd = Parse Markdown to message
cmd-description-htmlmd = Convert HTML to MarkdownV2
cmd-description-mdhtml = Convert Markdown to HTML

# main menu
welcome = 
    👋 Hello! To unparse a message simply use the command
    • 💬 → 🌐 /html &lt;message&gt;
    • 💬 → ⬇️ /md &lt;message&gt;
    • 💬 → 🌐⬇️ /both &lt;message&gt;
    • 💬 → 🧩 /entities &lt;message&gt;

    <i>The bot may produce redundant encodings, since it doesn't de-duplicate nested entities, and to avoid producing potentially broken formatting with MarkdownV2</>

    Test the parsing by using one of the following commands:
    • 🌐 → 💬 /phtml &lt;message&gt;
    • ⬇️ → 💬 /pmd &lt;message&gt;

    <i>You might need to send your text as code to prevent your Telegram client from pre-parsing it for you</>

    Finally, this bot can transpile between HTML and MarkdownV2 in a single command:
    • 🌐 → 💬 → ⬇️ /htmlmd &lt;message&gt;
    • ⬇️ → 💬 → 🌐 /mdhtml &lt;message&gt;

    ↩️ You can also use all these commands <b>in reply to</> the message to (un)parse

info-btn = ℹ️ Info and Links
info-message = 
    ℹ️ <b>About this bot</b>

    📦 <b>Source code</>: {-source}
    🛠 Built using <a href="https://grammy.dev">grammY</>
    📚 <b>Documentation</>: <a href="https://core.telegram.org/bots/api#formatting-options">Formatting options</>
    🧑‍💻 <b>Developer</>: {-bot-creator}
    📄 <b>License</>: <a href="https://www.gnu.org/licenses/agpl-3.0.en.html">AGPL-3.0-or-later</>

    <i>Feel free to contact me if you have any question</>

sample-btn = 📝 Sample
sample-reply-with-html-md =
    <i>👉 Reply to this message with /html, /md, /both, or /entities</>

documentation-btn = 📖 Documentation

# fallback
reply-to-unparse =
    Reply to this message to unparse it:
    • 💬 → 🌐 /html
    • 💬 → ⬇️ /md
    • 💬 → 🌐⬇️ /both
    • 💬 → 🧩 /entities
    Or to parse it:
    • 🌐 → 💬 /phtml
    • ⬇️ → 💬 /pmd
    Or to transpile it
    • 🌐 → ⬇️ /htmlmd
    • ⬇️ → 🌐 /mdhtml

# Inline mode
inline-loading = Loading...
inline-loading-info = In some cases (such as a anonymous admin) this will load forever...
inline-parse-md = Parse Markdown ⬇️ → 💬
inline-parse-md-description = Write some Markdown text to parse...
inline-parse-html = Parse HTML 🌐 → 💬
inline-parse-html-description = Write some HTML text to parse...
inline-help = Write some text to parse...
inline-help-description = Click here for an explanation
inline-help-text = ℹ️ You can write my username in any chat and pass the text you want to parse.
    Afterwards you can pick <b>{inline-parse-md}</> or <b>{inline-parse-html}</> to parse the text using the specified language.
inline-help-parse-some-text = 🌐 Parse some text ⬇️

# Inline results
inline-result-source = Source

# Documentation
documentation-source = Source
documentation-title = Documentation
documentation-official-documentation = 📚 <b>Official documentation</>: <a href="https://core.telegram.org/bots/api#formatting-options">Formatting options</>
documentation-show-more = Show more 👉
documentation-info-about = Info about <b>{$entityType}</>
documentation-subtitle = Here you can see the available formatting options in both &lt;u&gt;<u>HTML</u>&lt/u&gt; and **<b>MarkdownV2</b>**
documentation-pick-an-option-for-details = Pick an option for details
documentation-share = Share

# unparse
parsing-failed =
    Parsing failed: <code>{$error}</code>
parsing-failed-md =
    Parsing failed: `{$error}`
md-usage =
    <b>Usage</b>: /md &lt;message&gt;
    You can also reply to the message you want to unparse
html-usage =
    <b>Usage</b>: /html &lt;message&gt;
    You can also reply to the message you want to unparse
both-usage =
    <b>Usage</b>: /both &lt;message&gt;
    You can also reply to the message you want to unparse
mdhtml-usage =
    <b>Usage</b>: /mdhtml &lt;message&gt;
    You can also reply to the message you want to transpile from MarkdownV2 to HTML
htmlmd-usage =
    <b>Usage</b>: /htmlmd &lt;message&gt;
    You can also reply to the message you want to transpile from HTML to MarkdownV2
pmd-usage = 
    <b>Usage</b>: /pmd &lt;message&gt;
    You can also reply to the message you want to parse
phtml-usage = 
    <b>Usage</b>: /phtml &lt;message&gt;
    You can also reply to the message you want to parse
entities-usage =
    <b>Usage</b>: /entities &lt;message&gt;
    You can also reply to the message you want to extract the entities from
