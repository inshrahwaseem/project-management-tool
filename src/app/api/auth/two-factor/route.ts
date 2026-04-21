'use server';

/**
 * 2FA Setup API — Enable/verify TOTP-based two-factor authentication.
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateSecret, generateURI, verifySync, TOTP } from 'otplib';
import QRCode from 'qrcode';

/**
 * GET — Generate a new TOTP secret and QR code for setup.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const email = session.user.email || 'user';

  // Check if already set up
  const existing = await prisma.twoFactorSecret.findUnique({ where: { userId } });
  if (existing?.verified) {
    return NextResponse.json({ success: true, data: { enabled: true } });
  }

  // Generate secret
  const secret = generateSecret();
  const otpauthUrl = generateURI({ issuer: 'ProFlow', label: email, secret });

  // Generate QR code as data URL
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

  // Save (or update) secret
  await prisma.twoFactorSecret.upsert({
    where: { userId },
    update: { secret, verified: false },
    create: { userId, secret, verified: false },
  });

  return NextResponse.json({
    success: true,
    data: { enabled: false, qrCode: qrCodeDataUrl, secret },
  });
}

/**
 * POST — Verify TOTP code and enable 2FA.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const body = await req.json();
  const { code } = body;

  if (!code) return NextResponse.json({ success: false, message: 'Code required' }, { status: 400 });

  const record = await prisma.twoFactorSecret.findUnique({ where: { userId } });
  if (!record) return NextResponse.json({ success: false, message: '2FA not initialized' }, { status: 400 });

  const isValid = verifySync({ token: code, secret: record.secret });
  if (!isValid) return NextResponse.json({ success: false, message: 'Invalid code. Try again.' }, { status: 400 });

  await prisma.twoFactorSecret.update({
    where: { userId },
    data: { verified: true },
  });

  return NextResponse.json({ success: true, message: '2FA enabled successfully!' });
}

/**
 * DELETE — Disable 2FA.
 */
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  await prisma.twoFactorSecret.deleteMany({ where: { userId } });

  return NextResponse.json({ success: true, message: '2FA disabled.' });
}
