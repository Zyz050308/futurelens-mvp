import { randomUUID } from 'crypto';
import { execute, queryRows } from '@/lib/db';
import type { FutureProfile } from '@/types/radar';
import type { ProfileRecord } from '@/types/profile';

type ProfileRow = {
  id: string;
  user_id: string;
  profile_json: string | FutureProfile;
  created_at: Date | string;
  updated_at: Date | string;
};

function parseProfile(profileJson: string | FutureProfile): FutureProfile {
  return typeof profileJson === 'string'
    ? (JSON.parse(profileJson) as FutureProfile)
    : profileJson;
}

function toIsoString(value: Date | string): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  const normalized = value.includes('T')
    ? value
    : `${value.replace(' ', 'T')}Z`;
  return new Date(normalized).toISOString();
}

function mapProfile(row: ProfileRow): ProfileRecord {
  return {
    id: row.id,
    userId: row.user_id,
    profile: parseProfile(row.profile_json),
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  };
}

export async function getProfileByUserId(userId: string): Promise<ProfileRecord | null> {
  const rows = await queryRows<ProfileRow>(
    'SELECT * FROM profiles WHERE user_id = ? LIMIT 1',
    [userId]
  );
  return rows[0] ? mapProfile(rows[0]) : null;
}

export async function upsertProfile(userId: string, profile: FutureProfile): Promise<ProfileRecord> {
  const id = randomUUID();
  const payload = JSON.stringify(profile);
  const savedAt = new Date().toISOString();

  if (payload === undefined) {
    throw new Error('Profile cannot be serialized');
  }

  await execute(
    `INSERT INTO profiles (
      id, user_id, profile_json, created_at, updated_at
    ) VALUES (?, ?, ?, NOW(), NOW())
    ON DUPLICATE KEY UPDATE
      profile_json = VALUES(profile_json),
      updated_at = NOW()`,
    [id, userId, payload]
  );

  return {
    id,
    userId,
    profile,
    createdAt: savedAt,
    updatedAt: savedAt,
  };
}
