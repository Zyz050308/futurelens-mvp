export type DiscoveryCategory = 'customer' | 'job' | 'study' | 'direction' | 'general';

export type DiscoveryRecord = {
  id: string;
  userId: string;
  radarCreatedAt: string | null;
  sourceJudgment: string;
  verificationGoal: string;
  actionTitle: string;
  category: DiscoveryCategory;
  outcomeCode: string;
  outcomeLabel: string;
  userResult: string;
  userDiscovery: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateDiscoveryInput = {
  radarCreatedAt?: string | null;
  sourceJudgment: string;
  verificationGoal: string;
  actionTitle: string;
  category: DiscoveryCategory;
  outcomeCode: string;
  outcomeLabel: string;
  userResult: string;
  userDiscovery: string;
};
