import { pollingOptions } from '../config';
import { bot } from '../bot';
import { prisma } from '../prisma';
import { configureBot } from '../main';
import '../dayjs';

async function main() {
  console.log('Bot running...');
  configureBot(bot);
  await bot.start(pollingOptions);
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
