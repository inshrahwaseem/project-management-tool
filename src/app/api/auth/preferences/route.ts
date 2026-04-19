/**
 * PATCH /api/auth/preferences — Update user preferences (theme, font, sidebar, name)
 */

import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { updateProfileSchema } from '@/lib/validators/auth.schema';
import prisma from '@/lib/prisma';
import { successResponse, apiErrors } from '@/lib/api-response';
import logger from '@/lib/logger';

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiErrors.unauthorized();

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return apiErrors.validationError({ profile: ['Invalid data'] });
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.name) updateData.name = parsed.data.name;
    if (parsed.data.themePreference) updateData.themePreference = parsed.data.themePreference;
    if (parsed.data.fontSizePref) updateData.fontSizePref = parsed.data.fontSizePref;
    if (parsed.data.sidebarPref) updateData.sidebarPref = parsed.data.sidebarPref;
    if (parsed.data.image !== undefined) updateData.image = parsed.data.image;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        themePreference: true,
        fontSizePref: true,
        sidebarPref: true,
      },
    });

    return successResponse({ data: updated, message: 'Preferences updated' });
  } catch (error) {
    logger.error('PATCH /api/auth/preferences failed', error);
    return apiErrors.internal();
  }
}
