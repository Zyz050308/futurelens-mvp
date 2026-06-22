import { execute, queryRows } from '@/lib/db';
import type { UserRecord } from '@/types/user';

type UserRow = {
  id: string;
  public_uid?: string | null;
  nickname?: string | null;
  email: string;
  role?: string | null;
  email_verified_at: Date | null;
  login_code_hash: string | null;
  login_code_expires_at: Date | null;
  session_token_hash: string | null;
  session_expires_at: Date | null;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

type CreateUserInput = {
  id: string;
  email: string;
};

type CreateRegisteredUserInput = {
  id: string;
  publicUid: string;
  nickname: string;
  email: string;
  role?: string;
};

type UpdateLoginCodeInput = {
  loginCodeHash: string;
  loginCodeExpiresAt: string;
};

type UpdateSessionInput = {
  sessionTokenHash: string;
  sessionExpiresAt: string;
  emailVerifiedAt: string;
  lastLoginAt: string;
  clearLoginCode?: boolean;
};

function mapUser(row: UserRow): UserRecord {
  return {
    id: row.id,
    publicUid: row.public_uid || null,
    nickname: row.nickname || null,
    email: row.email,
    role: row.role || 'user',
    emailVerifiedAt: row.email_verified_at ? row.email_verified_at.toISOString() : null,
    loginCodeHash: row.login_code_hash,
    loginCodeExpiresAt: row.login_code_expires_at ? row.login_code_expires_at.toISOString() : null,
    sessionTokenHash: row.session_token_hash,
    sessionExpiresAt: row.session_expires_at ? row.session_expires_at.toISOString() : null,
    lastLoginAt: row.last_login_at ? row.last_login_at.toISOString() : null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const rows = await queryRows<UserRow>(
    'SELECT * FROM users WHERE email = ? LIMIT 1',
    [email]
  );
  return rows[0] ? mapUser(rows[0]) : null;
}

export async function findUserById(userId: string): Promise<UserRecord | null> {
  const rows = await queryRows<UserRow>(
    'SELECT * FROM users WHERE id = ? LIMIT 1',
    [userId]
  );
  return rows[0] ? mapUser(rows[0]) : null;
}

export async function publicUidExists(publicUid: string): Promise<boolean> {
  const rows = await queryRows<{ id: string }>(
    'SELECT id FROM users WHERE public_uid = ? LIMIT 1',
    [publicUid]
  );
  if (rows.length > 0) {
    return true;
  }

  const reservedRows = await queryRows<{ uid: string }>(
    'SELECT uid FROM uid_reservations WHERE uid = ? LIMIT 1',
    [publicUid]
  );
  return reservedRows.length > 0;
}

export async function findUserBySessionTokenHash(sessionTokenHash: string): Promise<UserRecord | null> {
  const rows = await queryRows<UserRow>(
    'SELECT * FROM users WHERE session_token_hash = ? LIMIT 1',
    [sessionTokenHash]
  );
  return rows[0] ? mapUser(rows[0]) : null;
}

export async function createUser(input: CreateUserInput): Promise<UserRecord> {
  await execute(
    `INSERT INTO users (
      id, email, created_at, updated_at
    ) VALUES (?, ?, NOW(), NOW())`,
    [input.id, input.email]
  );

  const user = await findUserByEmail(input.email);
  if (!user) {
    throw new Error('Failed to create user');
  }
  return user;
}

export async function createRegisteredUser(input: CreateRegisteredUserInput): Promise<UserRecord> {
  await execute(
    `INSERT INTO users (
      id, public_uid, nickname, email, role, email_verified_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
    [
      input.id,
      input.publicUid,
      input.nickname,
      input.email,
      input.role || 'user',
    ]
  );

  const user = await findUserByEmail(input.email);
  if (!user) {
    throw new Error('Failed to create registered user');
  }
  return user;
}

export async function assignPublicUidToUser(
  userId: string,
  publicUid: string
): Promise<UserRecord> {
  await execute(
    `UPDATE users
     SET public_uid = ?, updated_at = NOW()
     WHERE id = ?`,
    [publicUid, userId]
  );

  const user = await findUserById(userId);
  if (!user) {
    throw new Error('Failed to assign public UID');
  }
  return user;
}

export async function updateUserAccountIdentity(
  userId: string,
  input: {
    publicUid?: string;
    nickname?: string;
  }
): Promise<UserRecord> {
  await execute(
    `UPDATE users
     SET public_uid = COALESCE(?, public_uid),
         nickname = COALESCE(?, nickname),
         updated_at = NOW()
     WHERE id = ?`,
    [
      input.publicUid || null,
      input.nickname || null,
      userId,
    ]
  );

  const user = await findUserById(userId);
  if (!user) {
    throw new Error('Failed to update user account identity');
  }
  return user;
}

export async function updateUserLoginCode(userId: string, input: UpdateLoginCodeInput): Promise<void> {
  await execute(
    `UPDATE users
     SET login_code_hash = ?, login_code_expires_at = ?, updated_at = NOW()
     WHERE id = ?`,
    [input.loginCodeHash, input.loginCodeExpiresAt, userId]
  );
}

export async function updateUserSession(userId: string, input: UpdateSessionInput): Promise<UserRecord> {
  await execute(
    `UPDATE users
     SET session_token_hash = ?,
         session_expires_at = ?,
         email_verified_at = ?,
         last_login_at = ?,
         login_code_hash = ?,
         login_code_expires_at = ?,
         updated_at = NOW()
     WHERE id = ?`,
    [
      input.sessionTokenHash,
      input.sessionExpiresAt,
      input.emailVerifiedAt,
      input.lastLoginAt,
      null,
      null,
      userId,
    ]
  );

  const rows = await queryRows<UserRow>(
    'SELECT * FROM users WHERE id = ? LIMIT 1',
    [userId]
  );
  if (!rows[0]) {
    throw new Error('Failed to update user session');
  }
  return mapUser(rows[0]);
}
