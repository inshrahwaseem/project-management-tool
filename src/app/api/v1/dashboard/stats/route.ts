/**
 * GET /api/v1/dashboard/stats
 * Returns real-time dashboard statistics for the current user.
 */

import { getCurrentUser } from '@/lib/auth-utils';
import { successResponse, apiErrors } from '@/lib/api-response';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return apiErrors.unauthorized();

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // Start of this week (Monday)
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday);

    // Base filter: user's org, not deleted
    const orgFilter = user.orgId ? { orgId: user.orgId, deletedAt: null } : { ownerId: user.id, deletedAt: null };

    const [
      totalProjects,
      tasksDueToday,
      completedThisWeek,
      overdueTasks,
      totalTasksThisWeek,
      totalTasksCreatedThisWeek,
      activeProjects,
    ] = await Promise.all([
      // Total projects in user's org
      prisma.project.count({
        where: orgFilter,
      }),

      // Tasks due today assigned to current user
      prisma.task.count({
        where: {
          assigneeId: user.id,
          deletedAt: null,
          status: { not: 'DONE' },
          dueDate: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
      }),

      // Tasks completed this week by current user
      prisma.task.count({
        where: {
          assigneeId: user.id,
          deletedAt: null,
          status: 'DONE',
          updatedAt: { gte: startOfWeek },
        },
      }),

      // Overdue tasks assigned to current user
      prisma.task.count({
        where: {
          assigneeId: user.id,
          deletedAt: null,
          status: { not: 'DONE' },
          dueDate: { lt: startOfDay },
        },
      }),

      // Total tasks this week (for sprint progress)
      prisma.task.count({
        where: {
          project: orgFilter,
          deletedAt: null,
          createdAt: { gte: startOfWeek },
        },
      }),

      // All tasks created this week in org
      prisma.task.count({
        where: {
          project: orgFilter,
          deletedAt: null,
          createdAt: { gte: startOfWeek },
        },
      }),

      // Active projects count
      prisma.project.count({
        where: {
          ...orgFilter,
          status: 'ACTIVE',
        },
      }),
    ]);

    // Sprint progress: completed vs total tasks this week
    const sprintProgress = totalTasksThisWeek > 0
      ? Math.round((completedThisWeek / totalTasksThisWeek) * 100)
      : 0;

    // High priority tasks due today
    const highPriorityDueToday = await prisma.task.count({
      where: {
        assigneeId: user.id,
        deletedAt: null,
        status: { not: 'DONE' },
        priority: { in: ['HIGH', 'URGENT'] },
        dueDate: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });

    return successResponse({
      data: {
        totalProjects,
        activeProjects,
        tasksDueToday,
        highPriorityDueToday,
        completedThisWeek,
        overdueTasks,
        tasksCreatedThisWeek: totalTasksCreatedThisWeek,
        sprintProgress,
      },
    });
  } catch (error) {
    logger.error('GET /api/v1/dashboard/stats failed', error);
    return apiErrors.internal();
  }
}
