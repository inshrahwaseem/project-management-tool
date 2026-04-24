/**
 * GET /api/v1/projects/:id/tasks — Filtered task list
 * POST /api/v1/projects/:id/tasks — Create task in project
 */

import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { TaskService } from '@/lib/services/task.service';
import { taskFilterSchema, createTaskSchema } from '@/lib/validators/task.schema';
import { successResponse, apiErrors } from '@/lib/api-response';
import logger from '@/lib/logger';
import { pusherServer } from '@/lib/pusher-server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiErrors.unauthorized();

    const { id: projectId } = await params;
    const { searchParams } = request.nextUrl;

    const filters = taskFilterSchema.parse({
      status: searchParams.get('status') || undefined,
      priority: searchParams.get('priority') || undefined,
      assigneeId: searchParams.get('assigneeId') || undefined,
      search: searchParams.get('search') || undefined,
      dueDateFrom: searchParams.get('dueDateFrom') || undefined,
      dueDateTo: searchParams.get('dueDateTo') || undefined,
      cursor: searchParams.get('cursor') || undefined,
      limit: searchParams.get('limit') || 50,
    });

    const result = await TaskService.getTasks(projectId, filters);

    return successResponse({
      data: result.tasks,
      pagination: result.pagination,
    });
  } catch (error) {
    logger.error('GET /api/v1/projects/:id/tasks failed', error);
    return apiErrors.internal();
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiErrors.unauthorized();

    const { id: projectId } = await params;
    const body = await request.json();
    const parsed = createTaskSchema.safeParse(body);

    if (!parsed.success) {
      const errors: Record<string, string[]> = {};
      parsed.error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        if (!errors[path]) errors[path] = [];
        errors[path].push(issue.message);
      });
      return apiErrors.validationError(errors);
    }

    const task = await TaskService.createTask(projectId, parsed.data, user.id);

    // Trigger real-time notification if assigned to someone else
    if (parsed.data.assigneeId && parsed.data.assigneeId !== user.id) {
      try {
        await pusherServer.trigger(`user-${parsed.data.assigneeId}`, 'notification', {
          title: 'New Task Assigned',
          message: `${user.name || 'Someone'} assigned you to: ${task.title}`,
          type: 'SUCCESS'
        });
      } catch (err) {
        logger.error('Failed to trigger Pusher event', err);
      }
    }

    return successResponse({
      data: task,
      message: 'Task created successfully',
      status: 201,
    });
  } catch (error) {
    logger.error('POST /api/v1/projects/:id/tasks failed', error);
    return apiErrors.internal();
  }
}
