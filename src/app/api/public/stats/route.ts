import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [organizations, users, tasks] = await Promise.all([
      prisma.organization.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.task.count({ where: { deletedAt: null } })
    ]);

    return successResponse({
      data: {
        organizations,
        users,
        tasks
      }
    });
  } catch (error) {
    return errorResponse({ message: 'Failed to fetch stats', status: 500 });
  }
}
