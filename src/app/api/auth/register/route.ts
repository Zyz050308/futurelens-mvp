import { NextRequest, NextResponse } from 'next/server';
import {
  getUserForValidLoginCode,
  isValidEmail,
  issueLoginCode,
  issueSessionForUser,
  normalizeEmail,
} from '@/lib/auth';
import {
  findUserByEmail,
  publicUidExists,
  updateUserAccountIdentity,
} from '@/lib/repositories/users';
import { getProfileByUserId, upsertProfile } from '@/lib/repositories/profiles';
import { generatePublicUid } from '@/lib/uid';
import type { FutureProfile } from '@/types/radar';

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
  const proto = request.headers.get('x-forwarded-proto');
  return proto === 'https' || request.nextUrl.protocol === 'https:';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const nickname = String(body.nickname || '').trim();
    const email = normalizeEmail(String(body.email || ''));
    const verificationCode = String(body.verificationCode || '').trim();
    const ageStage = String(body.ageStage || '').trim();
    const profession = String(body.profession || '').trim();
    const currentDirection = String(body.currentDirection || '').trim();

    if (!nickname || nickname.length > 32) {
      return NextResponse.json(
        { success: false, error: 'Nickname is required' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email' },
        { status: 400 }
      );
    }

    if (!verificationCode) {
      const existingUser = await findUserByEmail(email);
      if (existingUser?.nickname && existingUser.publicUid) {
        return NextResponse.json(
          {
            success: false,
            code: 'USER_ALREADY_REGISTERED',
            error: '该邮箱已创建 FutureLens 身份，请直接登录。',
          },
          { status: 409 }
        );
      }

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

    if (!/^\d{6}$/.test(verificationCode)) {
      return NextResponse.json(
        { success: false, error: 'Verification code is required' },
        { status: 400 }
      );
    }

    const verifiedUser = await getUserForValidLoginCode(email, verificationCode);
    if (verifiedUser.nickname && verifiedUser.publicUid) {
      return NextResponse.json(
        {
          success: false,
          code: 'USER_ALREADY_REGISTERED',
          error: '该邮箱已创建 FutureLens 身份，请直接登录。',
        },
        { status: 409 }
      );
    }

    const identityPatch: {
      publicUid?: string;
      nickname?: string;
    } = {};

    if (!verifiedUser.publicUid) {
      identityPatch.publicUid = await generatePublicUid(publicUidExists);
    }

    if (!verifiedUser.nickname) {
      identityPatch.nickname = nickname;
    }

    const userWithIdentity = identityPatch.publicUid || identityPatch.nickname
      ? await updateUserAccountIdentity(verifiedUser.id, identityPatch)
      : verifiedUser;

    if (ageStage || profession || currentDirection) {
      const existingProfile = await getProfileByUserId(userWithIdentity.id);
      const profilePatch: FutureProfile = {
        age: ageStage || existingProfile?.profile.age || '',
        education: existingProfile?.profile.education || '',
        majorOrCareer: profession || existingProfile?.profile.majorOrCareer || '',
        currentSkills: existingProfile?.profile.currentSkills || '',
        currentSituation: existingProfile?.profile.currentSituation || '',
        currentGoal: currentDirection || existingProfile?.profile.currentGoal || '',
        currentAnxiety: existingProfile?.profile.currentAnxiety || '',
        desiredOutcome: existingProfile?.profile.desiredOutcome || '',
        weeklyTime: existingProfile?.profile.weeklyTime || '',
        riskPreference: existingProfile?.profile.riskPreference || '',
      };

      await upsertProfile(userWithIdentity.id, profilePatch);
    }

    const publicUser = await issueSessionForUser(userWithIdentity, {
      secureCookie: isSecureRequest(request),
    });

    return NextResponse.json({
      success: true,
      phase: 'registered',
      user: publicUser,
    });
  } catch (error) {
    console.error('[Auth Register] Failed to register user:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      },
      { status: 500 }
    );
  }
}
