import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import prisma from '@/lib/prisma';
import { successResponse, apiErrors } from '@/lib/api-response';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key');

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiErrors.unauthorized();

    const body = await request.json();
    const { email } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'Valid email is required' }, { status: 400 });
    }

    // Check if the user exists
    const invitedUser = await prisma.user.findUnique({
      where: { email }
    });

    if (invitedUser) {
      if (invitedUser.id === user.id) {
         return NextResponse.json({ success: false, error: 'You cannot invite yourself' }, { status: 400 });
      }

      // Check if they are already in the team (shared a project)
      const sharedProjects = await prisma.projectMember.findFirst({
        where: {
          userId: invitedUser.id,
          project: {
            members: {
              some: { userId: user.id }
            }
          }
        }
      });

      if (sharedProjects) {
        return NextResponse.json({ success: false, error: 'User is already in your team workspace' }, { status: 400 });
      }

      // Add a notification
      await prisma.notification.create({
        data: {
          type: 'MEMBER_INVITED',
          message: `${user.name} invited you to join their team workspace!`,
          userId: invitedUser.id,
          link: `/dashboard`,
        }
      });
    }

    // Send actual email via Resend
    const token = crypto.randomUUID(); // In a real app, you would save this token to DB
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteLink = `${appUrl}/register?invite=${token}&email=${encodeURIComponent(email)}`;

    try {
      // Note: With a free Resend account, you can only send to your verified email address.
      // To send to any address, you need to add and verify your own domain in Resend.
      await resend.emails.send({
        from: 'ProFlow <onboarding@resend.dev>', // Use a verified domain in production
        to: email,
        subject: `You have been invited to join ${user.name}'s team on ProFlow`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Team Invitation</h2>
            <p>Hello,</p>
            <p><strong>${user.name}</strong> has invited you to collaborate on ProFlow, the ultimate project management tool.</p>
            <p>Click the button below to join their workspace and start collaborating:</p>
            <div style="margin: 30px 0;">
              <a href="${inviteLink}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Accept Invitation</a>
            </div>
            <p style="color: #555;">If the button doesn't work, copy and paste this link into your browser:</p>
            <p><a href="${inviteLink}" style="color: #6366f1;">${inviteLink}</a></p>
            <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
            <p style="color: #888; font-size: 12px;">This invitation was sent from ProFlow.</p>
          </div>
        `,
      });
      console.log(`[Email Sent] Invitation sent to ${email}`);
    } catch (emailError) {
      console.error('[Email Error] Failed to send email via Resend:', emailError);
      // Even if email fails (like missing API key), we don't block the request in dev
    }
    
    return successResponse({ 
      message: 'Invitation sent successfully',
      data: { isExistingUser: !!invitedUser }
    });
  } catch (error) {
    return apiErrors.internal();
  }
}
