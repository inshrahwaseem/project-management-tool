/**
 * GET /api/v1/tasks/mine
 * Returns all tasks assigned to the current user across all projects.
 * Supports filtering by status, priority, and search.
 */

import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { successResponse, apiErrors } from '@/lib/api-response';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiErrors.unauthorized();

    const { searchParams } = request.nextUrl;
    const status = searchParams.get('status') || undefined;
    const priority = searchParams.get('priority') || undefined;
    const search = searchParams.get('search') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const where: any = {
      assigneeId: user.id,
      deletedAt: null,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const tasks = await prisma.task.findMany({
      where,
      take: limit,
      orderBy: [
        { dueDate: 'asc' },
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        project: {
          select: { id: true, title: true },
        },
        assignee: {
          select: { id: true, name: true, image: true, email: true },
        },
        reporter: {
          select: { id: true, name: true, image: true },
        },
        tags: {
          include: { tag: true },
        },
        _count: {
          select: { comments: true, attachments: true },
        },
      },
    });

    const total = await prisma.task.count({ where });

    return successResponse({
      data: tasks,
      pagination: {
        total,
        cursor: null,
        hasMore: tasks.length >= limit,
        pageSize: limit,
      },
    });
  } catch (error) {
    logger.error('GET /api/v1/tasks/mine failed', error);
    return apiErrors.internal();
  }
}
