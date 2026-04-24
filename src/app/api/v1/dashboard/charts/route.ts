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

    // Fetch tasks created in the last 14 days
    const createdTasks = await prisma.task.findMany({
      where: {
        project: orgFilter,
        createdAt: { gte: fourteenDaysAgo },
      },
      select: { createdAt: true },
    });

    // Fetch tasks completed in the last 14 days
    const completedTasks = await prisma.task.findMany({
      where: {
        project: orgFilter,
        status: 'DONE',
        updatedAt: { gte: fourteenDaysAgo },
      },
      select: { updatedAt: true },
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

    createdTasks.forEach((task) => {
      const dateStr = task.createdAt.toISOString().split('T')[0];
      if (dataMap[dateStr]) {
        dataMap[dateStr].created += 1;
      }
    });

    completedTasks.forEach((task) => {
      const dateStr = task.updatedAt.toISOString().split('T')[0];
      if (dataMap[dateStr]) {
        dataMap[dateStr].completed += 1;
      }
    });

    const chartData = Object.values(dataMap).sort((a, b) => a.date.localeCompare(b.date));

    return successResponse({ data: chartData });
  } catch (error) {
    logger.error('GET /api/v1/dashboard/charts failed', error);
    return apiErrors.internal();
  }
}
