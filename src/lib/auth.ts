import { createHash, randomBytes, randomInt, randomUUID } from 'crypto';
import { cookies } from 'next/headers';
import type { PublicUser, UserRecord } from '@/types/user';
import {
  createUser,
  findUserByEmail,
  findUserBySessionTokenHash,
  updateUserLoginCode,
  updateUserSession,
} from '@/lib/repositories/users';

const SESSION_COOKIE_NAME = 'futurelens_session';
const LOGIN_CODE_TTL_MINUTES = 5;
const SESSION_TTL_DAYS = 30;
const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

function toMysqlUtcDate(timestampMs: number): string {
  return new Date(timestampMs)
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ');
}

function toTimestamp(value: string): number {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    email: user.email,
    emailVerifiedAt: user.emailVerifiedAt,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function issueLoginCode(emailInput: string) {
  const email = normalizeEmail(emailInput);
  if (!isValidEmail(email)) {
    throw new Error('Invalid email');
  }

  let user = await findUserByEmail(email);
  if (!user) {
    user = await createUser({
      id: randomUUID(),
      email,
    });
  }

  const code = `${randomInt(100000, 1000000)}`;
  const expiresAtMs = Date.now() + LOGIN_CODE_TTL_MINUTES * MINUTE_MS;

  await updateUserLoginCode(user.id, {
    loginCodeHash: sha256(code),
    loginCodeExpiresAt: toMysqlUtcDate(expiresAtMs),
  });

  return {
    email,
    expiresAt: new Date(expiresAtMs).toISOString(),
    devCode: code,
  };
}

export async function verifyLoginCode(emailInput: string, code: string) {
  const email = normalizeEmail(emailInput);
  const user = await findUserByEmail(email);
  if (!user || !user.loginCodeHash || !user.loginCodeExpiresAt) {
    throw new Error('Login code not found');
  }

  const expiresAtMs = toTimestamp(user.loginCodeExpiresAt);
  if (expiresAtMs <= Date.now()) {
    throw new Error('Login code expired');
  }

  if (user.loginCodeHash !== sha256(code.trim())) {
    throw new Error('Login code invalid');
  }

  const sessionToken = randomBytes(32).toString('hex');
  const nowMs = Date.now();
  const sessionExpiresAtMs = nowMs + SESSION_TTL_DAYS * DAY_MS;

  const updatedUser = await updateUserSession(user.id, {
    sessionTokenHash: sha256(sessionToken),
    sessionExpiresAt: toMysqlUtcDate(sessionExpiresAtMs),
    emailVerifiedAt: user.emailVerifiedAt
      ? toMysqlUtcDate(toTimestamp(user.emailVerifiedAt))
      : toMysqlUtcDate(nowMs),
    lastLoginAt: toMysqlUtcDate(nowMs),
    clearLoginCode: true,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(sessionExpiresAtMs),
    path: '/',
  });

  return toPublicUser(updatedUser);
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionToken) {
    return null;
  }

  const user = await findUserBySessionTokenHash(sha256(sessionToken));
  if (!user || !user.sessionExpiresAt) {
    return null;
  }

  const sessionExpiresAtMs = toTimestamp(user.sessionExpiresAt);
  if (sessionExpiresAtMs <= Date.now()) {
    return null;
  }

  return toPublicUser(user);
}
