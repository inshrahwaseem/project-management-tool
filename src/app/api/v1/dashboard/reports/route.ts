/**
 * GET /api/v1/dashboard/reports
 * Returns data for charts on the reports page.
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

    const orgFilter = user.orgId ? { project: { orgId: user.orgId }, deletedAt: null } : { project: { ownerId: user.id }, deletedAt: null };

    // 1. Task Status Distribution
    const statusGroups = await prisma.task.groupBy({
      by: ['status'],
      where: orgFilter,
      _count: { id: true },
    });

    const statusData = statusGroups.map((g) => ({
      name: g.status,
      value: g._count.id,
    }));

    // 2. Task Priority Distribution
    const priorityGroups = await prisma.task.groupBy({
      by: ['priority'],
      where: orgFilter,
      _count: { id: true },
    });

    const priorityData = priorityGroups.map((g) => ({
      name: g.priority,
      value: g._count.id,
    }));

    // 3. User Workload (Tasks per assignee)
    const workloadGroups = await prisma.task.groupBy({
      by: ['assigneeId'],
      where: { ...orgFilter, status: { not: 'DONE' } },
      _count: { id: true },
    });

    // Resolve user names
    const assigneeIds = workloadGroups.map((g) => g.assigneeId).filter(Boolean) as string[];
    const assignees = await prisma.user.findMany({
      where: { id: { in: assigneeIds } },
      select: { id: true, name: true },
    });
    
    const assigneeMap = Object.fromEntries(assignees.map(u => [u.id, u.name]));

    const workloadData = workloadGroups.map((g) => ({
      name: g.assigneeId ? (assigneeMap[g.assigneeId] || 'Unknown User') : 'Unassigned',
      tasks: g._count.id,
    }));

    // 4. Burn-down approximation: tasks completed over last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentlyCompleted = await prisma.task.findMany({
      where: {
        ...orgFilter,
        status: 'DONE',
        updatedAt: { gte: sevenDaysAgo },
      },
      select: { updatedAt: true },
    });

    // Group by day string
    const completionByDay = recentlyCompleted.reduce((acc, task) => {
      const day = task.updatedAt.toISOString().split('T')[0];
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Generate last 7 days array
    const burndownData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split('T')[0];
      burndownData.push({
        date: d.toLocaleDateString('en-US', { weekday: 'short' }),
        completed: completionByDay[dayStr] || 0,
      });
    }

    return successResponse({
      data: {
        statusData,
        priorityData,
        workloadData,
        burndownData,
      },
    });
  } catch (error) {
    logger.error('GET /api/v1/dashboard/reports failed', error);
    return apiErrors.internal();
  }
}
