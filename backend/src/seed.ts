import prisma from './lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  const password = await bcrypt.hash('Admin123!', 10);

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      fullName: 'System Admin',
      email: 'admin@example.com',
      password,
      role: 'Super Admin',
      isActive: true,
    },
  });

  console.log('Seed completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
