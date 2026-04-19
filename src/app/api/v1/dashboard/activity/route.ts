/**
 * GET /api/v1/dashboard/activity
 * Returns real recent activity from the activity_logs table.
 */

import { getCurrentUser } from '@/lib/auth-utils';
import { successResponse, apiErrors } from '@/lib/api-response';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

// Map raw action strings to human-readable verbs
function formatAction(action: string): { verb: string; icon: string } {
  const map: Record<string, { verb: string; icon: string }> = {
    'user.registered': { verb: 'joined the platform', icon: '👋' },
    'user.login': { verb: 'signed in', icon: '🔑' },
    'project.created': { verb: 'created project', icon: '📁' },
    'project.updated': { verb: 'updated project', icon: '✏️' },
    'task.created': { verb: 'created task', icon: '✅' },
    'task.updated': { verb: 'updated task', icon: '🔄' },
    'task.deleted': { verb: 'deleted task', icon: '🗑️' },
    'comment.created': { verb: 'commented on', icon: '💬' },
  };
  return map[action] || { verb: action, icon: '📌' };
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return apiErrors.unauthorized();

    // Get the last 15 activity logs for this user's organization
    const logs = await prisma.activityLog.findMany({
      take: 15,
      orderBy: { createdAt: 'desc' },
      where: user.orgId
        ? {
            // Show activities from users in the same org
            user: {
              ownedOrganizations: {
                some: { id: user.orgId },
              },
            },
          }
        : { userId: user.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Format the activity entries
    const activities = logs.map((log) => {
      const { verb, icon } = formatAction(log.action);
      const newValue = log.newValue as Record<string, any> | null;
      const oldValue = log.oldValue as Record<string, any> | null;
      const target = newValue?.title || oldValue?.title || '';

      // Generate detail string
      let detail = '';
      if (log.action === 'task.updated' && newValue?.status && oldValue?.status) {
        detail = `from ${oldValue.status} to ${newValue.status}`;
      }

      // Time ago calculation
      const seconds = Math.floor((Date.now() - new Date(log.createdAt).getTime()) / 1000);
      let timeAgo: string;
      if (seconds < 60) timeAgo = 'just now';
      else if (seconds < 3600) timeAgo = `${Math.floor(seconds / 60)}m ago`;
      else if (seconds < 86400) timeAgo = `${Math.floor(seconds / 3600)}h ago`;
      else timeAgo = `${Math.floor(seconds / 86400)}d ago`;

      return {
        id: log.id,
        user: log.user.name,
        userImage: log.user.image,
        userId: log.user.id,
        action: verb,
        target,
        detail,
        icon,
        time: timeAgo,
        createdAt: log.createdAt,
      };
    });

    return successResponse({ data: activities });
  } catch (error) {
    logger.error('GET /api/v1/dashboard/activity failed', error);
    return apiErrors.internal();
  }
}
