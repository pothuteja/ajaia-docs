import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, USER_COOKIE_NAME } from '@/lib/auth';

const switchUserSchema = z.object({
  userId: z.string().min(1),
});

export async function GET() {
  try {
    const [users, currentUser] = await Promise.all([
      prisma.user.findMany({ orderBy: { createdAt: 'asc' } }),
      getCurrentUser(),
    ]);

    return NextResponse.json({ users, currentUser });
  } catch (error) {
    console.error('GET /api/users error:', error);
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = switchUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: parsed.data.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const response = NextResponse.json({ currentUser: user });
    response.cookies.set(USER_COOKIE_NAME, user.id, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('POST /api/users error:', error);
    return NextResponse.json({ error: 'Failed to switch user' }, { status: 500 });
  }
}