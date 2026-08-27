import prisma from './lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  // 1. Seed Admin User
  const password = await bcrypt.hash('Admin123!', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      password,
      role: 'ADMIN',
      isActive: true,
    },
    create: {
      fullName: 'System Admin',
      email: 'admin@example.com',
      password,
      role: 'ADMIN',
      isActive: true,
    },
  });

  // Seed Super Admin User
  const superPassword = await bcrypt.hash('superadmin@123', 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@thinkcove.com' },
    update: {
      password: superPassword,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
    create: {
      fullName: 'Super Admin',
      email: 'superadmin@thinkcove.com',
      password: superPassword,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  // 2. Clear existing demo data
  await prisma.task.deleteMany({});
  await prisma.clientRequirement.deleteMany({});
  await prisma.project.deleteMany({});

  // 3. Seed Sample Projects
  const project1 = await prisma.project.create({
    data: {
      name: 'Alpha Portal Redesign',
      description: 'Migrating legacy portal to a modern responsive React layout.',
      status: 'In Progress',
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Cloud Migration Sync',
      description: 'Transitioning localized servers to cloud AWS clusters.',
      status: 'Planning',
    },
  });

  // 4. Seed Sample Requirements
  const req1 = await prisma.clientRequirement.create({
    data: {
      title: 'FR-01: User Profile Settings Panel',
      description: 'Allow staff users to edit names, emails, and passwords.',
      priority: 'High',
      projectId: project1.id,
    },
  });

  const req2 = await prisma.clientRequirement.create({
    data: {
      title: 'FR-02: Multi-Factor Authentication',
      description: 'Mandatory Google Authenticator login step for Admins.',
      priority: 'Medium',
      projectId: project2.id,
    },
  });

  // 5. Seed Sample Tasks
  await prisma.task.create({
    data: {
      title: 'Design CSS Glassmorphism login layouts',
      description: 'Create modern dark mode mockup cards.',
      status: 'FINISHED',
      assignee: admin.fullName,
      projectId: project1.id,
      requirementId: req1.id,
    },
  });

  await prisma.task.create({
    data: {
      title: 'Setup Cognito user pool credentials',
      description: 'Configure AWS client credentials and callback URLs.',
      status: 'IN_PROGRESS',
      assignee: admin.fullName,
      projectId: project2.id,
      requirementId: req2.id,
    },
  });

  await prisma.task.create({
    data: {
      title: 'Compile initial requirements checklist',
      description: 'Formulate client-specific compliance points.',
      status: 'TODO',
      assignee: admin.fullName,
      projectId: project1.id,
      requirementId: req1.id,
    },
  });

  console.log('Seed completed successfully with 1 Admin user, 2 Projects, 2 Requirements, and 3 Tasks.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
