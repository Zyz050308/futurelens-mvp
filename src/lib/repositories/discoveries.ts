import { randomUUID } from 'crypto';
import { execute, queryRows } from '@/lib/db';
import type { CreateDiscoveryInput, DiscoveryRecord } from '@/types/discovery';

type DiscoveryRow = {
  id: string;
  user_id: string;
  radar_created_at: Date | null;
  source_judgment: string;
  verification_goal: string;
  action_title: string;
  category: string;
  outcome_code: string;
  outcome_label: string;
  user_result: string;
  user_discovery: string;
  created_at: Date;
  updated_at: Date;
};

export function toMysqlDateTime(value: string | Date | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid radar created time');
  }

  return date.toISOString().slice(0, 19).replace('T', ' ');
}

function mapDiscovery(row: DiscoveryRow): DiscoveryRecord {
  return {
    id: row.id,
    userId: row.user_id,
    radarCreatedAt: row.radar_created_at ? row.radar_created_at.toISOString() : null,
    sourceJudgment: row.source_judgment,
    verificationGoal: row.verification_goal,
    actionTitle: row.action_title,
    category: row.category as DiscoveryRecord['category'],
    outcomeCode: row.outcome_code,
    outcomeLabel: row.outcome_label,
    userResult: row.user_result,
    userDiscovery: row.user_discovery,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function listDiscoveriesByUserId(userId: string): Promise<DiscoveryRecord[]> {
  const rows = await queryRows<DiscoveryRow>(
    'SELECT * FROM discoveries WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
  return rows.map(mapDiscovery);
}

export async function createDiscovery(
  userId: string,
  input: CreateDiscoveryInput
): Promise<DiscoveryRecord> {
  const id = randomUUID();
  await execute(
    `INSERT INTO discoveries (
      id, user_id, radar_created_at, source_judgment, verification_goal,
      action_title, category, outcome_code, outcome_label, user_result,
      user_discovery, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      id,
      userId,
      toMysqlDateTime(input.radarCreatedAt),
      input.sourceJudgment,
      input.verificationGoal,
      input.actionTitle,
      input.category,
      input.outcomeCode,
      input.outcomeLabel,
      input.userResult,
      input.userDiscovery,
    ]
  );

  const rows = await queryRows<DiscoveryRow>(
    'SELECT * FROM discoveries WHERE id = ? LIMIT 1',
    [id]
  );
  if (!rows[0]) {
    throw new Error('Failed to create discovery');
  }
  return mapDiscovery(rows[0]);
}
