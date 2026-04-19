/**
 * GET /api/v1/notifications — User notifications
 * PATCH /api/v1/notifications — Mark all as read
 */

import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import prisma from '@/lib/prisma';
import { successResponse, apiErrors } from '@/lib/api-response';
import logger from '@/lib/logger';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return apiErrors.unauthorized();

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return successResponse({ data: notifications });
  } catch (error) {
    logger.error('GET /api/v1/notifications failed', error);
    return apiErrors.internal();
  }
}

export async function PATCH() {
  try {
    const user = await getCurrentUser();
    if (!user) return apiErrors.unauthorized();

    await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });

    return successResponse({ message: 'All notifications marked as read' });
  } catch (error) {
    logger.error('PATCH /api/v1/notifications failed', error);
    return apiErrors.internal();
  }
}
