/**
 * GET /api/v1/projects/:id — Single project with details
 * PUT /api/v1/projects/:id — Update project
 * DELETE /api/v1/projects/:id — Soft delete project
 */

import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { ProjectService } from '@/lib/services/project.service';
import { updateProjectSchema } from '@/lib/validators/project.schema';
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
    const project = await ProjectService.getProjectById(id);

    if (!project) return apiErrors.notFound('Project');

    return successResponse({ data: project });
  } catch (error) {
    logger.error('GET /api/v1/projects/:id failed', error);
    return apiErrors.internal();
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiErrors.unauthorized();

    const { id } = await params;
    const body = await request.json();
    const parsed = updateProjectSchema.safeParse(body);

    if (!parsed.success) {
      const errors: Record<string, string[]> = {};
      parsed.error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        if (!errors[path]) errors[path] = [];
        errors[path].push(issue.message);
      });
      return apiErrors.validationError(errors);
    }

    const project = await ProjectService.updateProject(id, parsed.data, user.id);
    if (!project) return apiErrors.notFound('Project');

    return successResponse({
      data: project,
      message: 'Project updated successfully',
    });
  } catch (error) {
    logger.error('PUT /api/v1/projects/:id failed', error);
    return apiErrors.internal();
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiErrors.unauthorized();

    const { id } = await params;
    await ProjectService.deleteProject(id, user.id);

    return successResponse({ message: 'Project deleted successfully' });
  } catch (error) {
    logger.error('DELETE /api/v1/projects/:id failed', error);
    return apiErrors.internal();
  }
}
