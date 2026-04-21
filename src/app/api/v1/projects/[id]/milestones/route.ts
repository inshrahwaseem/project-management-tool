'use server';

/**
 * Milestones API — CRUD for project milestones.
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

  const { id: projectId } = await params;

  const milestones = await prisma.milestone.findMany({
    where: { projectId },
    orderBy: { dueDate: 'asc' },
  });

  return NextResponse.json({ success: true, data: milestones });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const { id: projectId } = await params;
  const body = await req.json();

  const milestone = await prisma.milestone.create({
    data: {
      title: body.title,
      description: body.description,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      projectId,
    },
  });

  return NextResponse.json({ success: true, data: milestone }, { status: 201 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { milestoneId, ...updateData } = body;

  if (!milestoneId) return NextResponse.json({ success: false, message: 'milestoneId required' }, { status: 400 });

  if (updateData.dueDate) updateData.dueDate = new Date(updateData.dueDate);

  const milestone = await prisma.milestone.update({
    where: { id: milestoneId },
    data: updateData,
  });

  return NextResponse.json({ success: true, data: milestone });
}
