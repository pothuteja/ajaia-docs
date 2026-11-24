import { cookies } from 'next/headers';
import { prisma } from './prisma';

export const USER_COOKIE_NAME = 'ajaia_user_id';

export type AccessRole = 'OWNER' | 'EDITOR' | 'VIEWER' | 'NONE';

/**
 * Pure helper function to determine a user's access level on a document.
 * Kept pure so it can be cleanly unit-tested with Vitest.
 */
export function getDocumentAccessRole(
  userId: string,
  ownerId: string,
  shares: Array<{ userId: string; role: string }>
): AccessRole {
  if (userId === ownerId) return 'OWNER';
  const share = shares.find((s) => s.userId === userId);
  if (!share) return 'NONE';
  return share.role === 'VIEWER' ? 'VIEWER' : 'EDITOR';
}

export function canEditDocument(role: AccessRole): boolean {
  return role === 'OWNER' || role === 'EDITOR';
}

/**
 * Gets the currently active user from the session cookie.
 * Defaults to Alice (the first seeded user) so reviewers can test immediately.
 */
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get(USER_COOKIE_NAME)?.value;

  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) return user;
  }

  // Fallback to first seeded user (Alice) for frictionless reviewer experience
  return prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });
}