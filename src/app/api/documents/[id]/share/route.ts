import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

const shareSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['EDITOR', 'VIEWER']).default('EDITOR'),
});

const revokeSchema = z.object({
  userId: z.string().min(1),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const doc = await prisma.document.findUnique({ where: { id } });

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (doc.ownerId !== currentUser.id) {
      return NextResponse.json({ error: 'Only the owner can share this document' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = shareSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid share request' },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: `No user found with email ${parsed.data.email}` },
        { status: 404 }
      );
    }

    if (targetUser.id === currentUser.id) {
      return NextResponse.json({ error: 'You already own this document' }, { status: 400 });
    }

    const share = await prisma.documentShare.upsert({
      where: {
        documentId_userId: {
          documentId: id,
          userId: targetUser.id,
        },
      },
      update: { role: parsed.data.role },
      create: {
        documentId: id,
        userId: targetUser.id,
        role: parsed.data.role,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ share }, { status: 201 });
  } catch (error) {
    console.error('POST /api/documents/[id]/share error:', error);
    return NextResponse.json({ error: 'Failed to share document' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const doc = await prisma.document.findUnique({ where: { id } });

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (doc.ownerId !== currentUser.id) {
      return NextResponse.json({ error: 'Only the owner can revoke access' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = revokeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    await prisma.documentShare.delete({
      where: {
        documentId_userId: {
          documentId: id,
          userId: parsed.data.userId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/documents/[id]/share error:', error);
    return NextResponse.json({ error: 'Failed to revoke access' }, { status: 500 });
  }
}