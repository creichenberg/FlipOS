import { PrismaClient } from '@prisma/client';
import { seedDemoFlips } from '@/lib/demoData';

const db = new PrismaClient();

async function main() {
  const user = await db.user.upsert({
    where: { email: 'demo@flipos.app' },
    update: {},
    create: { email: 'demo@flipos.app', name: 'Demo Flipper' },
  });

  const count = await seedDemoFlips(db, user.id);
  console.log(`Seeded demo user + ${count} sample flips`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
