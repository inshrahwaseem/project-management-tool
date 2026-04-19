/**
 * GET/POST /api/v1/projects/[id]/messages
 * API for fetching and sending project chat messages.
 * (Recompilation trigger)
 */

import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { successResponse, apiErrors, errorResponse } from '@/lib/api-response';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';
import { z } from 'zod';

// Fetching messages for a project
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiErrors.unauthorized();

    const { id: projectId } = await params;
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const cursor = searchParams.get('cursor');

    // Verify user has access to the project
    const hasAccess = await prisma.project.findFirst({
      where: {
        id: projectId,
        deletedAt: null,
        OR: [
          { ownerId: user.id },
          { orgId: user.orgId },
          { members: { some: { userId: user.id } } }
        ]
      }
    });

    if (!hasAccess) return apiErrors.forbidden();

    const messages = await prisma.message.findMany({
      where: { projectId },
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: 'desc' }, // Latest first, we'll reverse in UI
      include: {
        sender: {
          select: { id: true, name: true, image: true }
        }
      }
    });

    return successResponse({ data: messages.reverse() });
  } catch (error) {
    logger.error('Failed to fetch messages', error);
    return apiErrors.internal();
  }
}

// Post a new message
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiErrors.unauthorized();

    const { id: projectId } = await params;
    const body = await req.json();

    if (!body.content || typeof body.content !== 'string' || !body.content.trim()) {
      return errorResponse({ message: 'Message content is required', status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        content: body.content.trim(),
        projectId,
        senderId: user.id
      },
      include: {
        sender: {
          select: { id: true, name: true, image: true }
        }
      }
    });

    return successResponse({ data: message, message: 'Message sent', status: 201 });
  } catch (error) {
    logger.error('Failed to post message', error);
    return apiErrors.internal();
  }
}
