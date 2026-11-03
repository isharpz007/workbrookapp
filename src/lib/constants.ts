export const MIN_YEAR = 1950;
export const MAX_YEAR = new Date().getFullYear();

export const LIMITS = {
  firstName: 60,
  city: 80,
  region: 80,
  jobTitle: 80,
  reportDetails: 500,
} as const;

export const RATE_LIMITS = {
  addPerIpPerDay: 10,
  reportPerIpPerDay: 5,
  emailPerAddressPerDay: 3,
} as const;

export const TOKEN_TTL = {
  consentMs: 7 * 24 * 60 * 60 * 1000, // 7 days
  recoverMs: 60 * 60 * 1000, // 1 hour
  exportMs: 15 * 60 * 1000, // 15 minutes
} as const;
