/**
 * GET /api/v1/projects — Paginated project list with filters
 * POST /api/v1/projects — Create a new project
 */

import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { ProjectService } from '@/lib/services/project.service';
import { projectFilterSchema, createProjectSchema } from '@/lib/validators/project.schema';
import { successResponse, apiErrors } from '@/lib/api-response';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiErrors.unauthorized();
    if (!user.orgId) return apiErrors.forbidden();

    const { searchParams } = request.nextUrl;
    const filters = projectFilterSchema.parse({
      status: searchParams.get('status') || undefined,
      priority: searchParams.get('priority') || undefined,
      search: searchParams.get('search') || undefined,
      cursor: searchParams.get('cursor') || undefined,
      limit: searchParams.get('limit') || 20,
    });

    const result = await ProjectService.getProjects(user.orgId, filters);

    return successResponse({
      data: result.projects,
      pagination: result.pagination,
    });
  } catch (error) {
    logger.error('GET /api/v1/projects failed', error);
    return apiErrors.internal();
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiErrors.unauthorized();
    if (!user.orgId) return apiErrors.forbidden();

    const body = await request.json();
    const parsed = createProjectSchema.safeParse(body);

    if (!parsed.success) {
      const errors: Record<string, string[]> = {};
      parsed.error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        if (!errors[path]) errors[path] = [];
        errors[path].push(issue.message);
      });
      return apiErrors.validationError(errors);
    }

    const project = await ProjectService.createProject(parsed.data, user.id, user.orgId);

    return successResponse({
      data: project,
      message: 'Project created successfully',
      status: 201,
    });
  } catch (error) {
    logger.error('POST /api/v1/projects failed', error);
    return apiErrors.internal();
  }
}
