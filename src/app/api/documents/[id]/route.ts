import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, getDocumentAccessRole, canEditDocument } from '@/lib/auth';

const updateDocSchema = z.object({
  title: z.string().trim().min(1, 'Title cannot be empty').max(200).optional(),
  content: z.string().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const doc = await prisma.document.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        shares: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const role = getDocumentAccessRole(user.id, doc.ownerId, doc.shares);
    if (role === 'NONE') {
      return NextResponse.json({ error: 'You do not have access to this document' }, { status: 403 });
    }

    return NextResponse.json({ document: doc, role });
  } catch (error) {
    console.error('GET /api/documents/[id] error:', error);
    return NextResponse.json({ error: 'Failed to load document' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const doc = await prisma.document.findUnique({
      where: { id },
      include: { shares: true },
    });

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const role = getDocumentAccessRole(user.id, doc.ownerId, doc.shares);
    if (!canEditDocument(role)) {
      return NextResponse.json({ error: 'You have view-only access to this document' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateDocSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid update data' },
        { status: 400 }
      );
    }

    const updated = await prisma.document.update({
      where: { id },
      data: {
        ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
        ...(parsed.data.content !== undefined ? { content: parsed.data.content } : {}),
      },
    });

    return NextResponse.json({ document: updated });
  } catch (error) {
    console.error('PATCH /api/documents/[id] error:', error);
    return NextResponse.json({ error: 'Failed to save document' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const doc = await prisma.document.findUnique({ where: { id } });

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (doc.ownerId !== user.id) {
      return NextResponse.json({ error: 'Only the document owner can delete it' }, { status: 403 });
    }

    await prisma.document.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/documents/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}