/**
 * GET /api/v1/projects/:id/stats — Project statistics and task distribution
 */

import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { ProjectService } from '@/lib/services/project.service';
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
    const stats = await ProjectService.getProjectStats(id);

    return successResponse({ data: stats });
  } catch (error) {
    logger.error('GET /api/v1/projects/:id/stats failed', error);
    return apiErrors.internal();
  }
}
