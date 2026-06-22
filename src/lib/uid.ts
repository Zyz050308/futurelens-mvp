import { randomInt } from 'crypto';

export const RESERVED_PUBLIC_UIDS = new Set([
  '666',
  '888',
  '999',
  '6666',
  '8888',
  '9999',
  '66666',
  '88888',
  '99999',
  '666666',
  '777777',
  '888888',
  '999999',
  '123456',
  '520520',
]);

export function isReservedPublicUid(uid: string): boolean {
  const normalized = uid.trim();
  if (!/^\d{3,6}$/.test(normalized)) {
    return false;
  }

  if (RESERVED_PUBLIC_UIDS.has(normalized)) {
    return true;
  }

  return /^(\d)\1{2,5}$/.test(normalized);
}

export async function generatePublicUid(
  exists: (uid: string) => Promise<boolean>,
  maxAttempts = 30
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const uid = String(randomInt(100000, 1000000));
    if (isReservedPublicUid(uid)) {
      continue;
    }

    if (!(await exists(uid))) {
      return uid;
    }
  }

  throw new Error('Failed to generate unique public UID');
}
