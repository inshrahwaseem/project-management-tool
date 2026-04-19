/**
 * Task Service — Business logic for task operations.
 * Handles CRUD, reordering, and activity logging.
 */

import prisma from '@/lib/prisma';
import logger from '@/lib/logger';
import type { CreateTaskInput, UpdateTaskInput, TaskFilterInput, ReorderTasksInput } from '@/lib/validators/task.schema';

export class TaskService {
  /**
   * Get tasks for a project with filters and cursor pagination.
   */
  static async getTasks(projectId: string, filters: TaskFilterInput) {
    const { status, priority, assigneeId, search, dueDateFrom, dueDateTo, cursor, limit } = filters;

    const where = {
      projectId,
      deletedAt: null,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(assigneeId && { assigneeId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(dueDateFrom && { dueDate: { gte: new Date(dueDateFrom) } }),
      ...(dueDateTo && { dueDate: { lte: new Date(dueDateTo) } }),
    };

    const tasks = await prisma.task.findMany({
      where,
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: [{ status: 'asc' }, { position: 'asc' }, { createdAt: 'desc' }],
      include: {
        assignee: {
          select: { id: true, name: true, image: true, email: true },
        },
        reporter: {
          select: { id: true, name: true, image: true },
        },
        tags: {
          include: { tag: true },
        },
        _count: {
          select: { comments: true, attachments: true },
        },
      },
    });

    const hasMore = tasks.length > limit;
    const data = hasMore ? tasks.slice(0, -1) : tasks;
    const nextCursor = hasMore ? data[data.length - 1]?.id : null;

    return {
      tasks: data,
      pagination: {
        total: await prisma.task.count({ where }),
        cursor: nextCursor,
        hasMore,
        pageSize: limit,
      },
    };
  }

  /**
   * Get a single task with full details.
   */
  static async getTaskById(id: string) {
    const task = await prisma.task.findFirst({
      where: { id, deletedAt: null },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, image: true },
        },
        reporter: {
          select: { id: true, name: true, email: true, image: true },
        },
        comments: {
          where: { deletedAt: null },
          include: {
            author: {
              select: { id: true, name: true, image: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        attachments: {
          include: {
            uploader: {
              select: { id: true, name: true },
            },
          },
        },
        tags: {
          include: { tag: true },
        },
        timeEntries: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
          orderBy: { loggedAt: 'desc' },
        },
        project: {
          select: { id: true, title: true },
        },
        _count: {
          select: { comments: true, attachments: true },
        },
      },
    });

    if (!task) return null;

    // Fetch activity logs separately since they are polymorphic
    const activityLogs = await prisma.activityLog.findMany({
      where: { entityId: id, entityType: 'task' },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return { ...task, activityLogs };
  }

  /**
   * Create a new task.
   */
  static async createTask(
    projectId: string,
    data: CreateTaskInput,
    userId: string
  ) {
    // Get next position
    const maxPosition = await prisma.task.aggregate({
      where: { projectId, status: data.status, deletedAt: null },
      _max: { position: true },
    });

    const task = await prisma.$transaction(async (tx) => {
      const created = await tx.task.create({
        data: {
          title: data.title,
          description: data.description,
          status: data.status,
          priority: data.priority,
          projectId,
          assigneeId: data.assigneeId,
          reporterId: userId,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          estimatedHours: data.estimatedHours,
          position: (maxPosition._max.position || 0) + 1000,
        },
        include: {
          assignee: {
            select: { id: true, name: true, image: true, email: true },
          },
          reporter: {
            select: { id: true, name: true, image: true },
          },
          _count: {
            select: { comments: true, attachments: true },
          },
        },
      });

      // Handle tags
      if (data.tags && data.tags.length > 0) {
        await tx.taskTag.createMany({
          data: data.tags.map((tagId) => ({
            taskId: created.id,
            tagId,
          })),
        });
      }

      // Log activity
      await tx.activityLog.create({
        data: {
          action: 'task.created',
          entityType: 'task',
          entityId: created.id,
          userId,
          newValue: { title: created.title, status: created.status, priority: created.priority },
        },
      });

      // Create notification if assigned to someone else
      if (data.assigneeId && data.assigneeId !== userId) {
        await tx.notification.create({
          data: {
            type: 'TASK_ASSIGNED',
            message: `You were assigned to "${created.title}"`,
            userId: data.assigneeId,
            link: `/projects/${projectId}/board`,
          },
        });
      }

      return created;
    });

    logger.info('Task created', { userId, taskId: task.id, projectId });
    return task;
  }

  /**
   * Update a task.
   */
  static async updateTask(id: string, data: UpdateTaskInput, userId: string) {
    const existing = await prisma.task.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) return null;

    const updateData: Record<string, any> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId;
    if (data.estimatedHours !== undefined) updateData.estimatedHours = data.estimatedHours;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.task.update({
        where: { id },
        data: updateData,
        include: {
          assignee: {
            select: { id: true, name: true, image: true, email: true },
          },
          reporter: {
            select: { id: true, name: true, image: true },
          },
          _count: {
            select: { comments: true, attachments: true },
          },
        },
      });

      await tx.activityLog.create({
        data: {
          action: 'task.updated',
          entityType: 'task',
          entityId: id,
          userId,
          oldValue: { title: existing.title, status: existing.status, priority: existing.priority },
          newValue: { title: result.title, status: result.status, priority: result.priority },
        },
      });

      // Notify on assignment change
      if (data.assigneeId && data.assigneeId !== existing.assigneeId && data.assigneeId !== userId) {
        await tx.notification.create({
          data: {
            type: 'TASK_ASSIGNED',
            message: `You were assigned to "${result.title}"`,
            userId: data.assigneeId,
            link: `/projects/${result.projectId}/board`,
          },
        });
      }

      // Notify on status change & trigger Workflow Automation
      if (data.status && data.status !== existing.status) {
        await tx.notification.create({
          data: {
            type: 'STATUS_CHANGED',
            message: `"${result.title}" moved to ${data.status}`,
            userId: existing.reporterId,
            link: `/projects/${result.projectId}/board`,
          },
        });

        // ─── Workflow Automation Engine ───
        const rules = await tx.automationRule.findMany({
          where: { projectId: result.projectId, isActive: true, trigger: 'STATUS_CHANGED' }
        });

        for (const rule of rules) {
          const condition = rule.condition as any;
          if (condition && condition.targetStatus === data.status) {
            if (rule.action === 'AUTO_ASSIGN' && rule.actionData) {
              const actionData = rule.actionData as any;
              if (actionData.assigneeId) {
                // Apply update
                await tx.task.update({
                  where: { id: result.id },
                  data: { assigneeId: actionData.assigneeId }
                });
                result.assigneeId = actionData.assigneeId;
                
                // Alert the newly assigned user
                await tx.notification.create({
                  data: {
                    type: 'TASK_ASSIGNED',
                    message: `⚡ Workflow Automation assigned you to "${result.title}"`,
                    userId: actionData.assigneeId,
                    link: `/projects/${result.projectId}/board`,
                  }
                });
              }
            }
          }
        }
      }

      return result;
    });

    return updated;
  }

  /**
   * Quick status update.
   */
  static async updateTaskStatus(id: string, status: string, userId: string) {
    return this.updateTask(id, { status: status as CreateTaskInput['status'] }, userId);
  }

  /**
   * Reorder tasks (for drag-and-drop).
   */
  static async reorderTasks(data: ReorderTasksInput, userId: string) {
    // Determine which tasks changed status to fire workflow automations
    const existingTasks = await prisma.task.findMany({
      where: { id: { in: data.tasks.map(t => t.id) } },
      select: { id: true, status: true, projectId: true, title: true }
    });

    await prisma.$transaction(
      data.tasks.map((task) =>
        prisma.task.update({
          where: { id: task.id },
          data: {
            status: task.status,
            position: task.position,
          },
        })
      )
    );

    // ─── Post-Reorder Workflow Automation Engine ───
    for (const newTask of data.tasks) {
      const oldTask = existingTasks.find(t => t.id === newTask.id);
      if (oldTask && oldTask.status !== newTask.status) {
        // Status changed via drag & drop! Evaluate rules
        const rules = await prisma.automationRule.findMany({
          where: { projectId: oldTask.projectId, isActive: true, trigger: 'STATUS_CHANGED' }
        });

        for (const rule of rules) {
          const condition = rule.condition as any;
          if (condition && condition.targetStatus === newTask.status) {
            if (rule.action === 'AUTO_ASSIGN' && rule.actionData) {
              const actionData = rule.actionData as any;
              if (actionData.assigneeId) {
                await prisma.task.update({
                  where: { id: newTask.id },
                  data: { assigneeId: actionData.assigneeId }
                });
                
                await prisma.notification.create({
                  data: {
                    type: 'TASK_ASSIGNED',
                    message: `⚡ Workflow Auto-Assigned you to "${oldTask.title}"`,
                    userId: actionData.assigneeId,
                    link: `/projects/${oldTask.projectId}/board`,
                  }
                });
              }
            }
          }
        }
      }
    }

    logger.info('Tasks reordered', { userId, taskCount: data.tasks.length });
  }

  /**
   * Soft delete a task.
   */
  static async deleteTask(id: string, userId: string) {
    const deleted = await prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await prisma.activityLog.create({
      data: {
        action: 'task.deleted',
        entityType: 'task',
        entityId: id,
        userId,
        oldValue: { title: deleted.title },
      },
    });

    logger.info('Task soft-deleted', { userId, taskId: id });
    return deleted;
  }
}
