export function isLegacyFeatureAllowed(
  nodeEnv = process.env.NODE_ENV,
  enableLegacyAdmin = process.env.ENABLE_LEGACY_ADMIN
): boolean {
  if (nodeEnv !== 'production') return true;
  return enableLegacyAdmin === 'true';
}

export const LEGACY_DISABLED_ERROR = 'Legacy pipeline is disabled in production.';
