/**
 * POST /api/auth/register
 * @description Register a new user account with email and password.
 * Creates a default organization for the user.
 */

import { NextRequest } from 'next/server';
import { registerSchema } from '@/lib/validators/auth.schema';
import { hashPassword } from '@/lib/auth-utils';
import { successResponse, errorResponse } from '@/lib/api-response';
import { slugify } from '@/lib/utils';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';

import { rateLimit } from '@/lib/rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (5 requests per minute per IP)
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
    try {
      await limiter.check(5, ip);
    } catch {
      return errorResponse({
        message: 'Too many registration attempts. Please try again later.',
        status: 429,
      });
    }

    const body = await request.json();

    // Validate input
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const errors: Record<string, string[]> = {};
      parsed.error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        if (!errors[path]) errors[path] = [];
        errors[path].push(issue.message);
      });
      return errorResponse({ message: 'Validation failed', status: 400, errors });
    }

    const { name, email, password } = parsed.data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return errorResponse({
        message: 'An account with this email already exists',
        status: 409,
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user and default organization in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          passwordHash,
          role: 'USER',
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      // Create default organization
      const orgSlug = `${slugify(name)}-${Date.now().toString(36)}`;
      const org = await tx.organization.create({
        data: {
          name: `${name}'s Workspace`,
          slug: orgSlug,
          ownerId: user.id,
        },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          action: 'user.registered',
          entityType: 'user',
          entityId: user.id,
          userId: user.id,
          metadata: { orgId: org.id },
        },
      });

      return { user, org };
    });

    logger.info('User registered successfully', { userId: result.user.id });

    return successResponse({
      data: {
        user: result.user,
        organization: result.org,
      },
      message: 'Account created successfully',
      status: 201,
    });
  } catch (error: any) {
    logger.error('Registration error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    
    // Return specific error message if it's a known Prisma error or has a message
    return errorResponse({ 
      message: `Registration failed: ${error.message || 'An unexpected error occurred'}`, 
      status: 500 
    });
  }
}
