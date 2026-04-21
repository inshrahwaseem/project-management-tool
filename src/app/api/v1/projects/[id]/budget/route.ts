'use server';

/**
 * Budget & Expenses API — Track project spending.
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

  const expenses = await prisma.expense.findMany({
    where: { projectId },
    orderBy: { date: 'desc' },
  });

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const byCategory = expenses.reduce((acc: Record<string, number>, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  return NextResponse.json({
    success: true,
    data: { expenses, totalSpent, byCategory },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const { id: projectId } = await params;
  const body = await req.json();

  const expense = await prisma.expense.create({
    data: {
      title: body.title,
      amount: parseFloat(body.amount),
      currency: body.currency || 'USD',
      category: body.category || 'Other',
      date: body.date ? new Date(body.date) : new Date(),
      receiptUrl: body.receiptUrl,
      projectId,
      createdBy: (session.user as any).id,
    },
  });

  return NextResponse.json({ success: true, data: expense }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const expenseId = searchParams.get('expenseId');
  if (!expenseId) return NextResponse.json({ success: false, message: 'expenseId required' }, { status: 400 });

  await prisma.expense.delete({ where: { id: expenseId } });

  return NextResponse.json({ success: true, message: 'Expense deleted' });
}
