import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import prisma from '@/lib/prisma';
import { successResponse, apiErrors } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiErrors.unauthorized();

    // Find all projects the current user is part of
    const userProjects = await prisma.projectMember.findMany({
      where: { userId: user.id },
      select: { projectId: true }
    });

    const projectIds = userProjects.map(p => p.projectId);

    // Get all unique members of those projects
    const teamMembers = await prisma.projectMember.findMany({
      where: { projectId: { in: projectIds } },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true, role: true }
        }
      }
    });

    // Aggregate by user
    const memberMap = new Map();
    for (const member of teamMembers) {
      if (!memberMap.has(member.user.id)) {
        memberMap.set(member.user.id, {
          id: member.user.id,
          name: member.user.name,
          email: member.user.email,
          image: member.user.image,
          role: member.user.role,
          projects: 1
        });
      } else {
        memberMap.get(member.user.id).projects += 1;
      }
    }

    const data = Array.from(memberMap.values());
    
    // Sort so the current user is first, then alphabetical
    data.sort((a, b) => {
      if (a.id === user.id) return -1;
      if (b.id === user.id) return 1;
      return a.name.localeCompare(b.name);
    });

    return successResponse({ data });
  } catch (error) {
    return apiErrors.internal();
  }
}
