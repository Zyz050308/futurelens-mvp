import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getProfileByUserId, upsertProfile } from '@/lib/repositories/profiles';
import type { FutureProfile } from '@/types/radar';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await getProfileByUserId(user.id);
    return NextResponse.json({
      success: true,
      profile: profile?.profile || null,
      record: profile || null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load profile',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await request.json() as FutureProfile;
    const saved = await upsertProfile(user.id, profile);

    return NextResponse.json({
      success: true,
      profile: saved.profile,
      record: saved,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save profile',
      },
      { status: 500 }
    );
  }
}
