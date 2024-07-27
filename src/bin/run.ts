import { pollingOptions } from '../config';
import { prisma } from '../prisma';
import { buildBot } from '../main';
import '../dayjs';

async function main() {
  console.log('Bot running...');
  const bot = buildBot();
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
