import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const alice = await prisma.user.upsert({
    where: { email: 'alice@ajaia.dev' },
    update: {},
    create: { email: 'alice@ajaia.dev', name: 'Alice Chen' },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@ajaia.dev' },
    update: {},
    create: { email: 'bob@ajaia.dev', name: 'Bob Patel' },
  });

  await prisma.user.upsert({
    where: { email: 'charlie@ajaia.dev' },
    update: {},
    create: { email: 'charlie@ajaia.dev', name: 'Charlie Kim' },
  });

  const existingDoc = await prisma.document.findFirst({
    where: { ownerId: alice.id },
  });

  if (!existingDoc) {
    const doc = await prisma.document.create({
      data: {
        title: 'Q4 Product Roadmap',
        content:
          '<h1>Q4 Product Roadmap</h1><p>Welcome to <strong>Ajaia Docs</strong>. This document is owned by Alice and shared with Bob.</p><ul><li><p>Rich-text editing</p></li><li><p>Markdown &amp; Text file import</p></li><li><p>Role-based sharing</p></li></ul>',
        ownerId: alice.id,
      },
    });

    await prisma.documentShare.create({
      data: {
        documentId: doc.id,
        userId: bob.id,
        role: 'EDITOR',
      },
    });
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });