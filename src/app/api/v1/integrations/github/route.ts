/**
 * POST /api/v1/integrations/github
 * Webhook receiver for GitHub push events. 
 * Looks for 'closes #ID' in commits to move tasks to DONE.
 */

import { NextRequest } from 'next/server';
import { IntegrationService } from '@/lib/services/integration.service';
import { TaskService } from '@/lib/services/task.service';
import { successResponse, apiErrors } from '@/lib/api-response';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    
    // Only handle push events
    if (!payload.commits || !Array.isArray(payload.commits)) {
      return successResponse({ message: 'Event ignored' });
    }

    for (const commit of payload.commits) {
      const taskId = IntegrationService.extractTaskId(commit.message);
      
      if (taskId) {
        logger.info(`GitHub Webhook: Attempting to close task ${taskId}`);
        
        // Find task by ID or slug (searching both for enterprise flexibility)
        const task = await prisma.task.findFirst({
          where: { 
            OR: [{ id: taskId }, { title: { contains: taskId } }],
            deletedAt: null 
          }
        });

        if (task && task.status !== 'DONE') {
          // Update task to DONE
          await TaskService.updateTask(task.id, { status: 'DONE' }, 'github-system');
          logger.info(`GitHub Webhook: Task ${task.id} closed successfully`);
        }
      }
    }

    return successResponse({ message: 'Processed webhook' });
  } catch (error) {
    logger.error('GitHub Webhook failed', error);
    return apiErrors.internal();
  }
}
