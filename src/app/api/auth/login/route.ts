import { NextRequest, NextResponse } from 'next/server';
import { issueLoginCode, verifyLoginCode } from '@/lib/auth';

function isSmtpConfigured(): boolean {
  return [
    process.env.SMTP_HOST,
    process.env.SMTP_PORT,
    process.env.SMTP_USER,
    process.env.SMTP_PASSWORD,
    process.env.SMTP_FROM,
  ].every(Boolean);
}

function isSecureRequest(request: NextRequest): boolean {
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  return forwardedProto
    ? forwardedProto === 'https'
    : request.nextUrl.protocol === 'https:';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email : '';
    const code = typeof body?.code === 'string' ? body.code : '';

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!code) {
      const result = await issueLoginCode(email);
      const smtpConfigured = isSmtpConfigured();

      return NextResponse.json({
        success: true,
        phase: 'code_sent',
        email: result.email,
        expiresAt: result.expiresAt,
        delivery: smtpConfigured ? 'email' : 'development',
        devCode: smtpConfigured ? undefined : result.devCode,
      });
    }

    const user = await verifyLoginCode(email, code, {
      secureCookie: isSecureRequest(request),
    });
    return NextResponse.json({
      success: true,
      phase: 'verified',
      user,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      },
      { status: 400 }
    );
  }
}
