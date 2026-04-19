/**
 * Comment Service — Business logic for comment operations.
 */

import prisma from '@/lib/prisma';
import logger from '@/lib/logger';
import type { CreateCommentInput } from '@/lib/validators/task.schema';

export class CommentService {
  static async getComments(taskId: string) {
    return prisma.comment.findMany({
      where: { taskId, deletedAt: null },
      include: {
        author: {
          select: { id: true, name: true, image: true, email: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  static async createComment(taskId: string, data: CreateCommentInput, userId: string) {
    const comment = await prisma.$transaction(async (tx) => {
      const created = await tx.comment.create({
        data: {
          content: data.content,
          taskId,
          authorId: userId,
        },
        include: {
          author: {
            select: { id: true, name: true, image: true, email: true },
          },
        },
      });

      // Get the task to find reporter/assignee for notification
      const task = await tx.task.findUnique({
        where: { id: taskId },
        select: { title: true, reporterId: true, assigneeId: true, projectId: true },
      });

      if (task) {
        // Notify task reporter and assignee
        const notifyUserIds = new Set<string>();
        if (task.reporterId !== userId) notifyUserIds.add(task.reporterId);
        if (task.assigneeId && task.assigneeId !== userId) notifyUserIds.add(task.assigneeId);

        for (const uid of notifyUserIds) {
          await tx.notification.create({
            data: {
              type: 'COMMENT_ADDED',
              message: `New comment on "${task.title}"`,
              userId: uid,
              link: `/projects/${task.projectId}/board`,
            },
          });
        }

        await tx.activityLog.create({
          data: {
            action: 'comment.created',
            entityType: 'comment',
            entityId: created.id,
            userId,
            metadata: { taskId, taskTitle: task.title },
          },
        });
      }

      return created;
    });

    logger.info('Comment created', { userId, commentId: comment.id, taskId });
    return comment;
  }

  static async updateComment(id: string, content: string, userId: string) {
    return prisma.comment.update({
      where: { id, authorId: userId },
      data: { content },
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
    });
  }

  static async deleteComment(id: string, userId: string) {
    return prisma.comment.update({
      where: { id, authorId: userId },
      data: { deletedAt: new Date() },
    });
  }
}
