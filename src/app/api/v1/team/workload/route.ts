'use server';

/**
 * Team Workload API — Returns task distribution per team member.
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;

  // Get all projects user is a member of
  const memberships = await prisma.projectMember.findMany({
    where: { userId },
    select: { projectId: true },
  });
  const projectIds = memberships.map((m) => m.projectId);

  // Get all members across these projects
  const allMembers = await prisma.projectMember.findMany({
    where: { projectId: { in: projectIds } },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  // Deduplicate members
  const uniqueMembers = new Map<string, typeof allMembers[0]['user']>();
  allMembers.forEach((m) => uniqueMembers.set(m.userId, m.user));

  // For each member, count tasks by status
  const workloadData = await Promise.all(
    Array.from(uniqueMembers.entries()).map(async ([memberId, user]) => {
      const taskCounts = await prisma.task.groupBy({
        by: ['status'],
        where: { assigneeId: memberId, deletedAt: null, projectId: { in: projectIds } },
        _count: { id: true },
      });

      const overdue = await prisma.task.count({
        where: {
          assigneeId: memberId,
          deletedAt: null,
          status: { not: 'DONE' },
          dueDate: { lt: new Date() },
          projectId: { in: projectIds },
        },
      });

      const statusMap: Record<string, number> = {};
      taskCounts.forEach((tc) => { statusMap[tc.status] = tc._count.id; });
      const total = Object.values(statusMap).reduce((a, b) => a + b, 0);

      return {
        user,
        todo: statusMap['TODO'] || 0,
        inProgress: statusMap['IN_PROGRESS'] || 0,
        inReview: statusMap['IN_REVIEW'] || 0,
        done: statusMap['DONE'] || 0,
        total,
        overdue,
      };
    })
  );

  // Sort by total tasks descending
  workloadData.sort((a, b) => b.total - a.total);

  return NextResponse.json({ success: true, data: workloadData });
}
