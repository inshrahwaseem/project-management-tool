/**
 * Project Service — Business logic layer for project operations.
 * All database queries go through here. Never call Prisma directly from routes.
 */

import prisma from '@/lib/prisma';
import logger from '@/lib/logger';
import type { ProjectFilterInput, CreateProjectInput, UpdateProjectInput } from '@/lib/validators/project.schema';

export class ProjectService {
  /**
   * Get paginated projects for an organization.
   */
  static async getProjects(orgId: string, filters: ProjectFilterInput) {
    const { status, priority, search, cursor, limit } = filters;

    const where = {
      orgId,
      deletedAt: null,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const projects = await prisma.project.findMany({
      where,
      take: limit + 1, // Fetch one extra to check if there are more
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        orgId: true,
        ownerId: true,
        startDate: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,
        owner: {
          select: { id: true, name: true, image: true, email: true },
        },
        members: {
          select: {
            id: true,
            role: true,
            user: {
              select: { id: true, name: true, image: true },
            },
          },
          take: 5,
        },
        _count: {
          select: { tasks: true, members: true },
        },
        tasks: {
          where: { status: 'DONE', deletedAt: null },
          select: { id: true },
        },
      },
    });

    const hasMore = projects.length > limit;
    const data = hasMore ? projects.slice(0, -1) : projects;
    const nextCursor = hasMore ? data[data.length - 1]?.id : null;

    return {
      projects: data,
      pagination: {
        total: await prisma.project.count({ where }),
        cursor: nextCursor,
        hasMore,
        pageSize: limit,
      },
    };
  }

  /**
   * Get a single project with full details.
   */
  static async getProjectById(id: string) {
    return prisma.project.findFirst({
      where: { id, deletedAt: null },
      include: {
        owner: {
          select: { id: true, name: true, email: true, image: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
        tags: true,
        _count: {
          select: { tasks: true, members: true },
        },
      },
    });
  }

  static async createProject(data: CreateProjectInput, userId: string, orgId: string) {
    const { template, startDate, dueDate, ...projectData } = data;
    
    const project = await prisma.$transaction(async (tx) => {
      const created = await tx.project.create({
        data: {
          ...projectData,
          orgId,
          ownerId: userId,
          startDate: startDate ? new Date(startDate) : null,
          dueDate: dueDate ? new Date(dueDate) : null,
        },
        include: {
          owner: { select: { id: true, name: true, email: true, image: true } },
          _count: { select: { tasks: true, members: true } },
        },
      });

      // Add creator as project owner
      await tx.projectMember.create({
        data: { projectId: created.id, userId, role: 'OWNER' },
      });

      // Pre-populate tasks based on template
      if (template) {
        let defaultTasks: { title: string; status: any }[] = [];
        
        switch (template) {
          case 'AGILE':
            defaultTasks = [
              { title: 'Backlog grooming', status: 'TODO' },
              { title: 'Sprint planning', status: 'TODO' },
              { title: 'Daily standup', status: 'IN_PROGRESS' },
              { title: 'Retrospective', status: 'DONE' },
            ];
            break;
          case 'MARKETING':
            defaultTasks = [
              { title: 'Define Content Strategy', status: 'TODO' },
              { title: 'Draft Blog Post', status: 'IN_PROGRESS' },
              { title: 'Review Social Media Ads', status: 'IN_REVIEW' },
              { title: 'Send Newsletter', status: 'DONE' },
            ];
            break;
          case 'BUG_TRACKING':
            defaultTasks = [
              { title: 'Triage incoming issue', status: 'TODO' },
              { title: 'Reproduce bug locally', status: 'IN_PROGRESS' },
              { title: 'Write fix and test', status: 'IN_REVIEW' },
              { title: 'Deploy hotfix', status: 'DONE' },
            ];
            break;
        }

        if (defaultTasks.length > 0) {
          await tx.task.createMany({
            data: defaultTasks.map((t, index) => ({
              title: t.title,
              status: t.status,
              projectId: created.id,
              reporterId: userId,
              position: index * 1000,
            })),
          });
        }
      }

      // Log activity
      await tx.activityLog.create({
        data: {
          action: 'project.created',
          entityType: 'project',
          entityId: created.id,
          userId,
          newValue: { title: created.title, status: created.status },
        },
      });

      return created;
    });

    logger.info('Project created', { userId, projectId: project.id });
    return project;
  }

  /**
   * Update a project.
   */
  static async updateProject(id: string, data: UpdateProjectInput, userId: string) {
    const existing = await prisma.project.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) return null;

    // RBAC: Only OWNER or ADMIN can update project settings
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: id, userId } },
    });

    if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
      throw new Error('FORBIDDEN: Insufficient permissions to update this project.');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.project.update({
        where: { id },
        data: {
          ...data,
          ...(data.startDate !== undefined && {
            startDate: data.startDate ? new Date(data.startDate) : null,
          }),
          ...(data.dueDate !== undefined && {
            dueDate: data.dueDate ? new Date(data.dueDate) : null,
          }),
        },
        include: {
          owner: {
            select: { id: true, name: true, email: true, image: true },
          },
          _count: { select: { tasks: true, members: true } },
        },
      });

      await tx.activityLog.create({
        data: {
          action: 'project.updated',
          entityType: 'project',
          entityId: id,
          userId,
          oldValue: { title: existing.title, status: existing.status },
          newValue: { title: result.title, status: result.status },
        },
      });

      return result;
    });

    return updated;
  }

  /**
   * Soft delete a project.
   */
  static async deleteProject(id: string, userId: string) {
    // RBAC: Only OWNER or ADMIN can delete project
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: id, userId } },
    });

    if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
      throw new Error('FORBIDDEN: Insufficient permissions to delete this project.');
    }

    const deleted = await prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await prisma.activityLog.create({
      data: {
        action: 'project.deleted',
        entityType: 'project',
        entityId: id,
        userId,
        oldValue: { title: deleted.title },
      },
    });

    logger.info('Project soft-deleted', { userId, projectId: id });
    return deleted;
  }

  /**
   * Get project stats.
   */
  static async getProjectStats(projectId: string) {
    const [taskCounts, totalHours] = await Promise.all([
      prisma.task.groupBy({
        by: ['status'],
        where: { projectId, deletedAt: null },
        _count: true,
      }),
      prisma.task.aggregate({
        where: { projectId, deletedAt: null },
        _sum: { estimatedHours: true, actualHours: true },
      }),
    ]);

    const counts: Record<string, number> = {};
    let total = 0;
    taskCounts.forEach((tc) => {
      counts[tc.status] = tc._count;
      total += tc._count;
    });

    const overdueCount = await prisma.task.count({
      where: {
        projectId,
        deletedAt: null,
        dueDate: { lt: new Date() },
        status: { notIn: ['DONE'] },
      },
    });

    return {
      totalTasks: total,
      todoCount: counts['TODO'] || 0,
      inProgressCount: counts['IN_PROGRESS'] || 0,
      inReviewCount: counts['IN_REVIEW'] || 0,
      doneCount: counts['DONE'] || 0,
      completionPercentage: total > 0 ? Math.round(((counts['DONE'] || 0) / total) * 100) : 0,
      overdueCount,
      totalHoursEstimated: totalHours._sum.estimatedHours || 0,
      totalHoursActual: totalHours._sum.actualHours || 0,
    };
  }
}
