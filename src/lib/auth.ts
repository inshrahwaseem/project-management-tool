/**
 * NextAuth.js Configuration
 * JWT strategy with credentials + Google OAuth providers.
 */

import { type NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
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
    ...(process.env.GOOGLE_CLIENT_ID && 
    process.env.GOOGLE_CLIENT_ID !== "" && 
    process.env.GOOGLE_CLIENT_SECRET && 
    process.env.GOOGLE_CLIENT_SECRET !== ""
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
          });

          if (!existingUser) {
            // Create user + default org for OAuth sign-in
            const slug = user.name
              ? user.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
              : `user-${Date.now()}`;

            const newUser = await prisma.user.create({
              data: {
                name: user.name || 'User',
                email: user.email!,
                image: user.image,
                emailVerified: new Date(),
                role: 'USER',
              },
            });

            await prisma.organization.create({
              data: {
                name: `${newUser.name}'s Workspace`,
                slug: `${slug}-${Date.now().toString(36)}`,
                ownerId: newUser.id,
              },
            });

            await prisma.account.create({
              data: {
                userId: newUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
              },
            });
          }
          return true;
        } catch (error) {
          logger.error('OAuth sign-in error', error);
          return false;
        }
      }
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
