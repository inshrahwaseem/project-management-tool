/**
 * GET /api/v1/tasks/:id — Single task detail
 * PUT /api/v1/tasks/:id — Update task (partial)
 * DELETE /api/v1/tasks/:id — Soft delete task
 */

import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { TaskService } from '@/lib/services/task.service';
import { updateTaskSchema } from '@/lib/validators/task.schema';
import { successResponse, apiErrors } from '@/lib/api-response';
import logger from '@/lib/logger';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiErrors.unauthorized();

    const { id } = await params;
    const task = await TaskService.getTaskById(id);
    if (!task) return apiErrors.notFound('Task');

    return successResponse({ data: task });
  } catch (error) {
    logger.error('GET /api/v1/tasks/:id failed', error);
    return apiErrors.internal();
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiErrors.unauthorized();

    const { id } = await params;
    const body = await request.json();
    const parsed = updateTaskSchema.safeParse(body);

    if (!parsed.success) {
      const errors: Record<string, string[]> = {};
      parsed.error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        if (!errors[path]) errors[path] = [];
        errors[path].push(issue.message);
      });
      return apiErrors.validationError(errors);
    }

    const task = await TaskService.updateTask(id, parsed.data, user.id);
    if (!task) return apiErrors.notFound('Task');

    return successResponse({
      data: task,
      message: 'Task updated successfully',
    });
  } catch (error) {
    logger.error('PUT /api/v1/tasks/:id failed', error);
    return apiErrors.internal();
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiErrors.unauthorized();

    const { id } = await params;
    await TaskService.deleteTask(id, user.id);

    return successResponse({ message: 'Task deleted successfully' });
  } catch (error) {
    logger.error('DELETE /api/v1/tasks/:id failed', error);
    return apiErrors.internal();
  }
}
