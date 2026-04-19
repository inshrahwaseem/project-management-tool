/**
 * GET /api/v1/tasks/:id/comments — List comments
 * POST /api/v1/tasks/:id/comments — Create comment
 */

import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { CommentService } from '@/lib/services/comment.service';
import { createCommentSchema } from '@/lib/validators/task.schema';
import { successResponse, apiErrors } from '@/lib/api-response';
import logger from '@/lib/logger';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiErrors.unauthorized();

    const { id: taskId } = await params;
    const comments = await CommentService.getComments(taskId);

    return successResponse({ data: comments });
  } catch (error) {
    logger.error('GET /api/v1/tasks/:id/comments failed', error);
    return apiErrors.internal();
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiErrors.unauthorized();

    const { id: taskId } = await params;
    const body = await request.json();
    const parsed = createCommentSchema.safeParse(body);

    if (!parsed.success) {
      return apiErrors.validationError({ content: ['Comment content is required'] });
    }

    const comment = await CommentService.createComment(taskId, parsed.data, user.id);

    return successResponse({
      data: comment,
      message: 'Comment added',
      status: 201,
    });
  } catch (error) {
    logger.error('POST /api/v1/tasks/:id/comments failed', error);
    return apiErrors.internal();
  }
}
