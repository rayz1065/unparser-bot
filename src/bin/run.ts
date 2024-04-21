import { pollingOptions } from '../config';
import { bot } from '../main';
import { prisma } from '../prisma';

async function main() {
  console.log('Bot running...');
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
