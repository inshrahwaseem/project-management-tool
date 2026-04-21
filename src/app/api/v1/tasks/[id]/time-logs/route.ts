'use server';

/**
 * Time Logs API — Log and retrieve time entries for a task.
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const { id: taskId } = await params;

  const logs = await prisma.timeEntry.findMany({
    where: { taskId },
    include: { user: { select: { id: true, name: true, image: true } } },
    orderBy: { loggedAt: 'desc' },
  });

  const totalHours = logs.reduce((sum, l) => sum + l.hours, 0);

  return NextResponse.json({ success: true, data: { logs, totalHours } });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const { id: taskId } = await params;
  const body = await req.json();
  const userId = (session.user as any).id;

  const entry = await prisma.timeEntry.create({
    data: {
      taskId,
      userId,
      hours: parseFloat(body.hours),
      description: body.description || null,
    },
  });

  // Update task actual hours
  const totalHours = await prisma.timeEntry.aggregate({
    where: { taskId },
    _sum: { hours: true },
  });

  await prisma.task.update({
    where: { id: taskId },
    data: { actualHours: totalHours._sum.hours || 0 },
  });

  return NextResponse.json({ success: true, data: entry }, { status: 201 });
}
