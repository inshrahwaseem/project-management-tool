/**
 * POST /api/v1/ai/suggest-subtasks
 * Generates actionable sub-tasks from a task title and description using Gemini AI.
 */

import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { AIService } from '@/lib/services/ai.service';
import { successResponse, apiErrors } from '@/lib/api-response';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiErrors.unauthorized();

    const { title, description } = await request.json();

    if (!title) {
      return apiErrors.validationError({ title: ['Title is required for AI breakdown'] });
    }

    const subTasks = await AIService.suggestSubTasks(title, description);

    return successResponse({ 
      data: subTasks, 
      message: 'AI Suggestions generated' 
    });
  } catch (error: any) {
    logger.error('POST /api/v1/ai/suggest-subtasks failed', error);
    return apiErrors.internal(error.message || 'AI service unavailable');
  }
}
