/**
 * PATCH /api/v1/tasks/reorder — Update task positions for drag-drop
 */

import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { TaskService } from '@/lib/services/task.service';
import { reorderTasksSchema } from '@/lib/validators/task.schema';
import { successResponse, apiErrors } from '@/lib/api-response';
import logger from '@/lib/logger';

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiErrors.unauthorized();

    const body = await request.json();
    const parsed = reorderTasksSchema.safeParse(body);

    if (!parsed.success) {
      return apiErrors.validationError({ tasks: ['Invalid reorder data'] });
    }

    await TaskService.reorderTasks(parsed.data, user.id);

    return successResponse({ message: 'Tasks reordered successfully' });
  } catch (error) {
    logger.error('PATCH /api/v1/tasks/reorder failed', error);
    return apiErrors.internal();
  }
}
