/**
 * GET /api/v1/search — Global search across projects, tasks, and comments
 */

import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import prisma from '@/lib/prisma';
import { successResponse, apiErrors } from '@/lib/api-response';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiErrors.unauthorized();

    const { searchParams } = request.nextUrl;
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'all';
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    if (!query || query.length < 1) {
      return apiErrors.validationError({ q: ['Search query is required'] });
    }

    // Format query for Postgres Full Text Search (split by spaces and join with & for strict match, or | for any match)
    // Here we use | so if user types "login button" it finds items with "login" or "button".
    const searchQuery = query.trim().split(/\s+/).join(' | ');

    const results: Array<{
      type: string;
      id: string;
      title: string;
      subtitle?: string;
      link: string;
    }> = [];

    // Search projects
    if (type === 'all' || type === 'project') {
      const projects = await prisma.project.findMany({
        where: {
          orgId: user.orgId || '',
          deletedAt: null,
          title: { search: searchQuery },
        },
        select: { id: true, title: true, status: true },
        take: limit,
      });

      projects.forEach((p) => {
        results.push({
          type: 'project',
          id: p.id,
          title: p.title,
          subtitle: p.status,
          link: `/projects/${p.id}/board`,
        });
      });
    }

    // Search tasks
    if (type === 'all' || type === 'task') {
      const tasks = await prisma.task.findMany({
        where: {
          deletedAt: null,
          project: { orgId: user.orgId || '', deletedAt: null },
          title: { search: searchQuery },
        },
        select: {
          id: true,
          title: true,
          status: true,
          project: { select: { id: true, title: true } },
        },
        take: limit,
      });

      tasks.forEach((t) => {
        results.push({
          type: 'task',
          id: t.id,
          title: t.title,
          subtitle: `${t.project.title} · ${t.status}`,
          link: `/projects/${t.project.id}/board`,
        });
      });
    }

    // Search comments
    if (type === 'all' || type === 'comment') {
      const comments = await prisma.comment.findMany({
        where: {
          deletedAt: null,
          content: { search: searchQuery },
          task: {
            deletedAt: null,
            project: { orgId: user.orgId || '', deletedAt: null },
          },
        },
        select: {
          id: true,
          content: true,
          task: {
            select: {
              id: true,
              title: true,
              project: { select: { id: true } },
            },
          },
        },
        take: limit,
      });

      comments.forEach((c) => {
        results.push({
          type: 'comment',
          id: c.id,
          title: c.content.substring(0, 100),
          subtitle: `Comment on "${c.task.title}"`,
          link: `/projects/${c.task.project.id}/board`,
        });
      });
    }

    return successResponse({ data: results });
  } catch (error) {
    logger.error('GET /api/v1/search failed', error);
    return apiErrors.internal();
  }
}
