-bot-creator = @rayz1065
-source = github.com/rayz1065/unparser-bot

# base
cancel = ❌ Cancel
back = 🔙 Back
back-to-menu = 🔙 Back to menu
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
cmd-description-html = Convert message to HTML
cmd-description-phtml = Parse HTML to message
cmd-description-md = Convert message to Markdown
cmd-description-pmd = Parse Markdown to message

# main menu
welcome = 
    👋 Hello! To unparse a message simply use the command
    • 💬 → 🌐 /html &lt;message&gt;
    • 💬 → ⬇️ /md &lt;message&gt;

    <i>The bot may produce redundant encodings, since it doesn't de-duplicate nested entities, and to avoid producing potentially broken formatting with MarkdownV2</>

    Test the parsing by using one of the following commands:
    • 🌐 → 💬 /phtml &lt;message&gt;
    • ⬇️ → 💬 /pmd &lt;message&gt;

    <i>You might need to send your text as code to avoid your Telegram client to pre-parse it for you</>

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
    <i>👉 Reply to this message with /html or /md</>

# fallback
reply-to-unparse =
    Reply to this message to unparse it:
    • 💬 → 🌐 /html
    • 💬 → ⬇️ /md
    Or to parse it:
    • 🌐 → 💬 /phtml
    • 🌐 → ⬇️ /pmd

# unparse
parsing-failed =
    Parsing failed: <code>{$error}</code>
md-usage =
    <b>Usage</b>: /md &lt;message&gt;
    You can also reply to the message you want to unparse
html-usage =
    <b>Usage</b>: /html &lt;message&gt;
    You can also reply to the message you want to unparse
pmd-usage = 
    <b>Usage</b>: /pmd &lt;message&gt;
    You can also reply to the message you want to parse
phtml-usage = 
    <b>Usage</b>: /phtml &lt;message&gt;
    You can also reply to the message you want to parse
