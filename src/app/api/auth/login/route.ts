import { NextRequest, NextResponse } from 'next/server';
import { issueLoginCode, verifyLoginCode } from '@/lib/auth';

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
      return NextResponse.json({
        success: true,
        phase: 'code_sent',
        email: result.email,
        expiresAt: result.expiresAt,
        devCode: result.devCode,
      });
    }

    const user = await verifyLoginCode(email, code);
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
