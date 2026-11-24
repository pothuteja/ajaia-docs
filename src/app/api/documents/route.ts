import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

const createDocSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  content: z.string().optional(),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No active user found' }, { status: 401 });
    }

    const [owned, sharedRecords] = await Promise.all([
      prisma.document.findMany({
        where: { ownerId: user.id },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          shares: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.documentShare.findMany({
        where: { userId: user.id },
        include: {
          document: {
            include: {
              owner: { select: { id: true, name: true, email: true } },
            },
          },
        },
        orderBy: { document: { updatedAt: 'desc' } },
      }),
    ]);

    const shared = sharedRecords.map((record) => ({
      ...record.document,
      myRole: record.role,
    }));

    return NextResponse.json({ owned, shared });
  } catch (error) {
    console.error('GET /api/documents error:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No active user found' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = createDocSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid document payload' }, { status: 400 });
    }

    const doc = await prisma.document.create({
      data: {
        title: parsed.data.title || 'Untitled Document',
        content: parsed.data.content || '<p></p>',
        ownerId: user.id,
      },
    });

    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (error) {
    console.error('POST /api/documents error:', error);
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
  }
}