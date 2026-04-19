/**
 * NextAuth API Route Handler
 * @description Handles all authentication requests via NextAuth.js
 */

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

const handler = NextAuth(authOptions);

const limiter = rateLimit({
  interval: 60 * 1000, 
  uniqueTokenPerInterval: 500,
});

async function POST(req: NextRequest, ctx: any) {
  const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1';
  try {
    await limiter.check(10, ip);
  } catch {
    return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return handler(req as any, ctx);
}

export { handler as GET, POST };
