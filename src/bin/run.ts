import { pollingOptions } from '../config.js';
import { prisma } from '../prisma.js';
import { buildBot } from '../main.js';
import '../dayjs.js';
import { logger } from '../logger.js';

async function main() {
  const bot = buildBot();

  onShutdown(async () => {
    logger.info('Shutting down');

    await bot.stop();

    await prisma.$disconnect();
    process.exit(0);
  });

  logger.info('Bot running in polling mode...');
  await bot.start(pollingOptions);
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
  process.on('SIGINT', () => {
    void handleShutdown();
  });
  process.on('SIGTERM', () => {
    void handleShutdown();
  });
}
