import { randomUUID } from 'crypto';
import { execute, queryRows } from '@/lib/db';
import type { FutureProfile } from '@/types/radar';
import type { ProfileRecord } from '@/types/profile';

type ProfileRow = {
  id: string;
  user_id: string;
  profile_json: string | FutureProfile;
  created_at: Date;
  updated_at: Date;
};

function parseProfile(profileJson: string | FutureProfile): FutureProfile {
  return typeof profileJson === 'string'
    ? (JSON.parse(profileJson) as FutureProfile)
    : profileJson;
}

function mapProfile(row: ProfileRow): ProfileRecord {
  return {
    id: row.id,
    userId: row.user_id,
    profile: parseProfile(row.profile_json),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
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
  const existing = await getProfileByUserId(userId);
  const payload = JSON.stringify(profile);

  if (existing) {
    await execute(
      `UPDATE profiles
       SET profile_json = ?, updated_at = NOW()
       WHERE user_id = ?`,
      [payload, userId]
    );
  } else {
    await execute(
      `INSERT INTO profiles (
        id, user_id, profile_json, created_at, updated_at
      ) VALUES (?, ?, ?, NOW(), NOW())`,
      [randomUUID(), userId, payload]
    );
  }

  const saved = await getProfileByUserId(userId);
  if (!saved) {
    throw new Error('Failed to save profile');
  }
  return saved;
}
