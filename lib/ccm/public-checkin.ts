export const PUBLIC_CHECKIN_TOKEN_TTL_DAYS = 14;

export const ACTIVE_PUBLIC_CHECKIN_STATUSES = [
  "sent",
  "follow_up_needed",
] as const;

export function publicCheckinTokenExpiresAt(now = new Date()): string {
  const expiresAt = new Date(now);
  expiresAt.setUTCDate(
    expiresAt.getUTCDate() + PUBLIC_CHECKIN_TOKEN_TTL_DAYS,
  );
  return expiresAt.toISOString();
}
