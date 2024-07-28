import { allowedUpdates, appConfig, pollingOptions } from '../config';
import { prisma } from '../prisma';
import { buildBot } from '../main';
import '../dayjs';
import { startServer } from '../server';
import { logger } from '../logger';

async function main() {
  const bot = buildBot();

  const { server } = startServer({ bot, logger });

  onShutdown(async () => {
    logger.info('Shutting down');

    await Promise.all([
      server.close(),
      ...[!appConfig.USE_WEBHOOK ? [bot.stop()] : []],
    ]);

    await prisma.$disconnect();
    process.exit(0);
  });

  if (!appConfig.USE_WEBHOOK) {
    logger.info('Bot running in polling mode...');
    await bot.start(pollingOptions);
  } else {
    logger.info('Bot running in webhook mode...');
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
    logger.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

function onShutdown(cleanUp: () => Promise<void>) {
  let isShuttingDown = false;
  const handleShutdown = async () => {
    if (isShuttingDown) {
      return;
    }
    isShuttingDown = true;
    await cleanUp();
  };
  process.on('SIGINT', handleShutdown);
  process.on('SIGTERM', handleShutdown);
}
