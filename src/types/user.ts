export type UserRecord = {
  id: string;
  publicUid: string | null;
  nickname: string | null;
  email: string;
  role: string;
  emailVerifiedAt: string | null;
  loginCodeHash: string | null;
  loginCodeExpiresAt: string | null;
  sessionTokenHash: string | null;
  sessionExpiresAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicUser = {
  id: string;
  publicUid: string | null;
  nickname: string | null;
  email: string;
  role: string;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LoginRequest = {
  email: string;
  code?: string;
};
