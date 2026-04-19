/**
 * GET /api/v1/dashboard/charts
 * Returns time-series data for tasks created vs completed in the last 14 days.
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

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    const orgFilter = user.orgId ? { orgId: user.orgId, deletedAt: null } : { ownerId: user.id, deletedAt: null };

    // Fetch created tasks per day
    const createdTasks = await prisma.task.groupBy({
      by: ['createdAt'],
      where: {
        project: orgFilter,
        createdAt: { gte: fourteenDaysAgo },
      },
      _count: true,
    });

    // Fetch completed tasks per day (based on updatedAt when status is DONE)
    const completedTasks = await prisma.task.groupBy({
      by: ['updatedAt'],
      where: {
        project: orgFilter,
        status: 'DONE',
        updatedAt: { gte: fourteenDaysAgo },
      },
      _count: true,
    });

    // Process data into a daily map for the chart
    const dataMap: Record<string, { date: string; created: number; completed: number }> = {};
    
    // Fill with empty days first
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dataMap[dateStr] = { date: dateStr, created: 0, completed: 0 };
    }

    createdTasks.forEach((group) => {
      const dateStr = group.createdAt.toISOString().split('T')[0];
      if (dataMap[dateStr]) {
        dataMap[dateStr].created += group._count;
      }
    });

    completedTasks.forEach((group) => {
      const dateStr = group.updatedAt.toISOString().split('T')[0];
      if (dataMap[dateStr]) {
        dataMap[dateStr].completed += group._count;
      }
    });

    const chartData = Object.values(dataMap).sort((a, b) => a.date.localeCompare(b.date));

    return successResponse({ data: chartData });
  } catch (error) {
    logger.error('GET /api/v1/dashboard/charts failed', error);
    return apiErrors.internal();
  }
}
