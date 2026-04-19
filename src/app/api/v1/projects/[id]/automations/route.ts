/**
 * GET/POST /api/v1/projects/[id]/automations
 * (Recompilation trigger)
 */

import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { successResponse, apiErrors, errorResponse } from '@/lib/api-response';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';

// Get automation rules
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiErrors.unauthorized();

    const { id: projectId } = await params;

    const rules = await prisma.automationRule.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' }
    });

    return successResponse({ data: rules });
  } catch (error) {
    logger.error('Failed to get automations', error);
    return apiErrors.internal();
  }
}

// Create new automation rule
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiErrors.unauthorized();

    const { id: projectId } = await params;
    const body = await req.json();

    if (!body.name || !body.trigger || !body.action) {
      return errorResponse({ message: 'Name, trigger, and action are required', status: 400 });
    }

    const rule = await prisma.automationRule.create({
      data: {
        projectId,
        name: body.name,
        trigger: body.trigger,
        condition: body.condition || {},
        action: body.action,
        actionData: body.actionData || {},
        isActive: true
      }
    });

    return successResponse({ data: rule, message: 'Automation rule created', status: 201 });
  } catch (error) {
    logger.error('Failed to create automation rule', error);
    return apiErrors.internal();
  }
}
