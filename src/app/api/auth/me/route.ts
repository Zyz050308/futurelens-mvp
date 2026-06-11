import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json(
      {
        success: true,
        user,
      },
      {
        headers: {
          'Cache-Control': 'private, no-store, max-age=0',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch current user',
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'private, no-store, max-age=0',
        },
      }
    );
  }
}
