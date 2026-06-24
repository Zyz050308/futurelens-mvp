import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getProfileByUserId } from '@/lib/repositories/profiles';
import {
  assignPublicUidToUser,
  publicUidExists,
} from '@/lib/repositories/users';
import {
  createUserProblem,
  getLatestUserProblem,
  listRecentUserProblems,
} from '@/lib/repositories/userProblems';
import { generatePublicUid } from '@/lib/uid';

export async function GET() {
  try {
    let user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!user.publicUid) {
      const publicUid = await generatePublicUid(publicUidExists);
      await assignPublicUidToUser(user.id, publicUid);
      user = {
        ...user,
        publicUid,
      };
    }

    const [profile, latestProblem, problems] = await Promise.all([
      getProfileByUserId(user.id),
      getLatestUserProblem(user.id),
      listRecentUserProblems(user.id, 10),
    ]);

    return NextResponse.json({
      success: true,
      user,
      profile: profile?.profile || null,
      latestProblem,
      problems,
    });
  } catch (error) {
    console.error('[Account] Failed to load account:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load account',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const problem = String(body.problem || '').trim();

    if (!problem) {
      return NextResponse.json(
        { success: false, error: 'Problem is required' },
        { status: 400 }
      );
    }

    const existingLatestProblem = await getLatestUserProblem(user.id);
    if (existingLatestProblem?.originalInput.trim() === problem) {
      return NextResponse.json({
        success: true,
        latestProblem: existingLatestProblem,
        deduplicated: true,
      });
    }

    const latestProblem = await createUserProblem({
      userId: user.id,
      originalInput: problem,
      status: 'draft',
    });

    return NextResponse.json({
      success: true,
      latestProblem,
    });
  } catch (error) {
    console.error('[Account] Failed to save problem:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save problem',
      },
      { status: 500 }
    );
  }
}
