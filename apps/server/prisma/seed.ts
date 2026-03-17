import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  const hashedPassword = await bcrypt.hash('Admin@1234', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@timely.local' },
    update: {},
    create: {
      email: 'admin@timely.local',
      hashedPassword,
      name: 'Admin',
    },
  });

  console.log('Admin user ensured:', {
    id: admin.id,
    email: admin.email,
    name: admin.name,
  });

  console.log('Database seed completed!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
