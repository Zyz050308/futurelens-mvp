import type { FutureProfile } from '@/types/radar';

export type ProfileRecord = {
  id: string;
  userId: string;
  profile: FutureProfile;
  createdAt: string;
  updatedAt: string;
};
