import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const { email } = result.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (user) {
      // Usually, you would generate a reset token and send an email here.
      // Since email sending is mocked or not fully requested to be implemented with SendGrid here,
      // we just log it and simulate success.
      logger.info(`Password reset requested for user: ${email}`);
      
      // Example of generating a reset token:
      // const token = crypto.randomBytes(32).toString('hex');
      // await prisma.verificationToken.create({ ... })
      // await sendEmail(...)
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({ success: true, message: 'If an account exists, an email was sent.' });
  } catch (error) {
    logger.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
