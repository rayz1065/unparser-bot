import { allowedUpdates, appConfig, pollingOptions } from '../config';
import { prisma } from '../prisma';
import { buildBot } from '../main';
import '../dayjs';
import { startServer } from '../server';

async function main() {
  const bot = buildBot();

  startServer(bot);

  if (!appConfig.USE_WEBHOOK) {
    console.log('Bot running in polling mode...');
    await bot.start(pollingOptions);
  } else {
    console.log('Bot running in webhook mode...');
    await bot.api.setWebhook(appConfig.WEBHOOK_URL!, {
      allowed_updates: allowedUpdates,
      secret_token: appConfig.WEBHOOK_SECRET,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
