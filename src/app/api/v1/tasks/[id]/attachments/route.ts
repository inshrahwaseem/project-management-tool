/**
 * POST /api/v1/tasks/:id/attachments — Add attachment metadata
 * DELETE /api/v1/tasks/:id/attachments — Remove attachment
 */

import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { successResponse, apiErrors } from '@/lib/api-response';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiErrors.unauthorized();

    const { id: taskId } = await params;
    const body = await request.json();
    const { fileUrl, fileName, fileSize, fileType } = body;

    if (!fileUrl || !fileName) {
      return apiErrors.validationError({ file: ['Missing file metadata'] });
    }

    const attachment = await prisma.attachment.create({
      data: {
        taskId,
        fileUrl,
        fileName,
        fileSize,
        fileType,
        uploadedBy: user.id,
      },
      include: {
        uploader: { select: { id: true, name: true } },
      },
    });

    // Log action
    await prisma.activityLog.create({
      data: {
        action: 'attachment.added',
        entityType: 'task',
        entityId: taskId,
        userId: user.id,
        metadata: { fileName },
      },
    });

    return successResponse({ data: attachment, message: 'Attachment added' });
  } catch (error) {
    logger.error('POST /api/v1/tasks/:id/attachments failed', error);
    return apiErrors.internal();
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiErrors.unauthorized();

    const { searchParams } = new URL(request.url);
    const attachmentId = searchParams.get('id');

    if (!attachmentId) return apiErrors.validationError({ id: ['Missing attachment ID'] });

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) return apiErrors.notFound('Attachment');

    // Soft delete or hard delete? Let's do hard delete for attachments to save space
    await prisma.attachment.delete({
      where: { id: attachmentId },
    });

    return successResponse({ message: 'Attachment removed' });
  } catch (error) {
    logger.error('DELETE attachment failed', error);
    return apiErrors.internal();
  }
}
