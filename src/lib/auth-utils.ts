/**
 * Auth Utilities — Password hashing, token helpers, session getter
 */

import { hash, compare } from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import type { SessionUser } from '@/types';

const SALT_ROUNDS = 12;

/**
 * Hash a password with bcryptjs.
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash.
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword);
}

/**
 * Get the current authenticated user from the session.
 * Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  return {
    id: (session.user as Record<string, unknown>).id as string,
    name: session.user.name || '',
    email: session.user.email || '',
    image: session.user.image,
    role: (session.user as Record<string, unknown>).role as SessionUser['role'],
    orgId: (session.user as Record<string, unknown>).orgId as string | undefined,
  };
}

/**
 * Require authentication — throws if not authenticated.
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}
