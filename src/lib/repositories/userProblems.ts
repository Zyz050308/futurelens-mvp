import { randomUUID } from 'crypto';
import { execute, queryRows } from '@/lib/db';

export type UserProblemStatus = 'draft' | 'generated' | 'waiting_feedback' | 'completed';

export type UserProblemRecord = {
  id: string;
  userId: string;
  originalInput: string;
  problemShape: string | null;
  status: UserProblemStatus;
  createdAt: string;
  updatedAt: string;
};

type UserProblemRow = {
  id: string;
  user_id: string;
  original_input: string;
  problem_shape: string | null;
  status: UserProblemStatus;
  created_at: Date | string;
  updated_at: Date | string;
};

function toIsoString(value: Date | string): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  const normalized = value.includes('T')
    ? value
    : `${value.replace(' ', 'T')}Z`;
  return new Date(normalized).toISOString();
}

function mapUserProblem(row: UserProblemRow): UserProblemRecord {
  return {
    id: row.id,
    userId: row.user_id,
    originalInput: row.original_input,
    problemShape: row.problem_shape,
    status: row.status,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  };
}

export async function createUserProblem(input: {
  userId: string;
  originalInput: string;
  problemShape?: string | null;
  status?: UserProblemStatus;
}): Promise<UserProblemRecord> {
  const id = randomUUID();

  await execute(
    `INSERT INTO user_problems (
      id, user_id, original_input, problem_shape, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      id,
      input.userId,
      input.originalInput,
      input.problemShape || null,
      input.status || 'draft',
    ]
  );

  const rows = await queryRows<UserProblemRow>(
    'SELECT * FROM user_problems WHERE id = ? LIMIT 1',
    [id]
  );
  if (!rows[0]) {
    throw new Error('Failed to create user problem');
  }
  return mapUserProblem(rows[0]);
}

export async function getLatestUserProblem(userId: string): Promise<UserProblemRecord | null> {
  const rows = await queryRows<UserProblemRow>(
    'SELECT * FROM user_problems WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
    [userId]
  );
  return rows[0] ? mapUserProblem(rows[0]) : null;
}

export async function listRecentUserProblems(
  userId: string,
  limit = 10
): Promise<UserProblemRecord[]> {
  const rows = await queryRows<UserProblemRow>(
    'SELECT * FROM user_problems WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
    [userId, limit]
  );
  return rows.map(mapUserProblem);
}
