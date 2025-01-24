/**
 * Utility script to perform the bot setup, run with --help for usage
 */
import { Option, program } from 'commander';
import {
  appConfig,
  botProperties,
  channelDefaultAdministratorRights,
  groupDefaultAdministratorRights,
  myCommands,
  setupGuideManualSteps,
  worksInChannels,
  worksInGroups,
} from '../config.js';
import { i18n } from '../i18n.js';
import { BotCommandScope, LanguageCode } from 'grammy/types';
import { Api } from 'grammy';

const availableLocales: {
  locale: string;
  languageCode: LanguageCode | undefined;
  name: string;
}[] = [
  ...i18n.locales.map((locale) => ({
    locale,
    languageCode: locale as LanguageCode,
    name: locale,
  })),
  {
    locale: process.env.DEFAULT_LOCALE ?? 'en',
    languageCode: undefined,
    name: 'default',
  },
];
const localesToUpdate: typeof availableLocales = [];

program
  .option('--name', 'Update the name of the bot')
  .option('--commands', 'Update the bot commands')
  .option('--description', 'Update the description of the bot')
  .option('--short_description', 'Update the short description of the bot')
  .option('--rights', 'Updates the requested rights in channels and groups')
  .addOption(
    new Option('--all', 'Update everything').implies({
      name: true,
      commands: true,
      description: true,
      short_description: true,
      rights: true,
    })
  )
  .addOption(
    new Option('--lang <string>', 'Update just a single language').choices(
      availableLocales.map((x) => x.name)
    )
  )
  .addHelpText('beforeAll', 'This utility script can help you setup your bot')
  .addHelpText('afterAll', furtherSetup());

program.parse();

const options: {
  name?: true;
  commands?: true;
  description?: true;
  short_description?: true;
  rights?: true;
  all?: true;
  lang?: string;
} = program.opts();

const api = new Api(appConfig.BOT_TOKEN);

async function setMyName() {
  for (const locale of localesToUpdate) {
    await api.setMyName(i18n.translate(locale.locale, 'bot-name'), {
      language_code: locale.languageCode,
    });

    console.log('Updated name for locale', locale.name);
  }
}

async function setMyCommands() {
  const commandsByScope: Record<string, string[]> = {};
  for (const command of myCommands) {
    const scope = command.scope ?? { type: 'default' };
    const key = JSON.stringify(scope);
    commandsByScope[key] ??= [];
    commandsByScope[key].push(command.command);
  }

  for (const locale of localesToUpdate) {
    for (const key in commandsByScope) {
      const scope = JSON.parse(key) as BotCommandScope;
      await api.setMyCommands(
        commandsByScope[key].map((command) => ({
          command,
          description: i18n.t(locale.locale, `cmd-description-${command}`),
        })),
        { language_code: locale.languageCode, scope }
      );
    }

    console.log('Updated commands for locale', locale.name);
  }
}

async function setMyDescription() {
  for (const locale of localesToUpdate) {
    await api.setMyDescription(i18n.t(locale.locale, 'bot-description'), {
      language_code: locale.languageCode,
    });

    console.log('Updated description for locale', locale.name);
  }
}

async function setMyShortDescription() {
  for (const locale of localesToUpdate) {
    await api.setMyShortDescription(
      i18n.t(locale.locale, 'bot-short-description'),
      { language_code: locale.languageCode }
    );

    console.log('Updated short description for locale', locale.name);
  }
}

async function setMyDefaultChannelAdministratorRights() {
  const rights = worksInChannels
    ? channelDefaultAdministratorRights
    : undefined;

  await api.setMyDefaultAdministratorRights({
    for_channels: true,
    rights,
  });

  console.log('Updated channel administrator rights');
}

async function setMyDefaultGroupAdministratorRights() {
  const rights = worksInGroups ? groupDefaultAdministratorRights : undefined;

  await api.setMyDefaultAdministratorRights({
    for_channels: false,
    rights,
  });

  console.log('Updated group administrator rights');
}

async function setMyDefaultAdministratorRights() {
  await setMyDefaultChannelAdministratorRights();
  await setMyDefaultGroupAdministratorRights();
}

function furtherSetup() {
  return (
    "To complete the setup, if you haven't already done it:\n" +
    setupGuideManualSteps()
      .map((x) => `- ${x}`)
      .join('\n')
  );
}

async function checkBotProperties() {
  console.log('Checking bot properties...');
  const me = await api.getMe();

  let fail = false;

  for (const key_ in botProperties) {
    const key = key_ as keyof typeof botProperties;
    const expected = botProperties[key];
    const found = me[key];
    if (found !== expected) {
      fail = true;
      console.warn(`${key} is set incorrectly`, { found, expected });
    }
  }

  if (!fail) {
    console.log('All properties are set correctly');
  } else {
    console.warn('Please fix the properties through @BotFather');
  }
}

async function main() {
  if (
    !options.name &&
    !options.commands &&
    !options.description &&
    !options.short_description &&
    !options.rights
  ) {
    program.outputHelp();
    process.exit();
  }

  if (options.lang) {
    const lang = options.lang as LanguageCode | 'default';
    localesToUpdate.push(availableLocales.find((x) => x.name === lang)!);
  } else {
    localesToUpdate.push(...availableLocales);
  }

  if (options.name) {
    await setMyName();
  }
  if (options.commands) {
    await setMyCommands();
  }
  if (options.description) {
    await setMyDescription();
  }
  if (options.short_description) {
    await setMyShortDescription();
  }
  if (options.rights) {
    await setMyDefaultAdministratorRights();
  }

  console.log();
  console.log(furtherSetup());

  await checkBotProperties();
}

void main();
