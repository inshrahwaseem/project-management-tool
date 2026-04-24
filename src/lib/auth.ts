/**
 * NextAuth.js Configuration
 * JWT strategy with credentials provider.
 */

import { type NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';

import { compare } from 'bcryptjs';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email.toLowerCase(),
            deletedAt: null,
          },
          include: {
            ownedOrganizations: true,
          },
        });

        if (!user || !user.passwordHash) {
          throw new Error('Invalid email or password');
        }

        // Check account lockout
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          throw new Error('Account temporarily locked. Try again later.');
        }

        const isValid = await compare(credentials.password, user.passwordHash);

        if (!isValid) {
          // Increment failed attempts
          const failedAttempts = user.failedAttempts + 1;
          const updateData: { failedAttempts: number; lockedUntil?: Date } = {
            failedAttempts,
          };

          // Lock after 5 failed attempts for 15 minutes
          if (failedAttempts >= 5) {
            updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
            logger.warn('Account locked due to failed attempts', {
              userId: user.id,
              failedAttempts,
            });
          }

          await prisma.user.update({
            where: { id: user.id },
            data: updateData,
          });

          throw new Error('Invalid email or password');
        }

        // Reset failed attempts on successful login
        if (user.failedAttempts > 0) {
          await prisma.user.update({
            where: { id: user.id },
            data: { failedAttempts: 0, lockedUntil: null },
          });
        }

        // Log successful login
        await prisma.activityLog.create({
          data: {
            action: 'user.login',
            entityType: 'user',
            entityId: user.id,
            userId: user.id,
            metadata: { method: 'credentials' },
          },
        });

        const orgId = user.ownedOrganizations[0]?.id || null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          orgId,
        };
      },
    }),
  ],
  callbacks: {
    async signIn() {
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        
        let orgId = (user as any).orgId;
        if (!orgId) {
          try {
            const org = await prisma.organization.findFirst({
              where: { ownerId: user.id },
              select: { id: true }
            });
            orgId = org?.id || null;
          } catch (error) {
            logger.error('Failed to fetch orgId in jwt callback', error);
          }
        }
        token.orgId = orgId;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).id = token.id;
        (session.user as Record<string, unknown>).role = token.role;
        (session.user as Record<string, unknown>).orgId = token.orgId;
      }
      return session;
    },
  },
};
