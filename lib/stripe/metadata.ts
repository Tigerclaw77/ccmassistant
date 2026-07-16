const SAFE_METADATA_KEYS = new Set([
  "catalog_key",
  "catalog_version",
  "component",
  "patient_price_id",
  "platform_price_id",
  "practice_id",
]);

const EMAIL_PATTERN = /\b[^\s@]+@[^\s@]+\.[^\s@]+\b/;
const PHONE_PATTERN = /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
const DATE_PATTERN = /\b\d{4}-\d{2}-\d{2}\b/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function assertSafeStripeMetadata(
  metadata: Record<string, string>,
): Record<string, string> {
  for (const [key, value] of Object.entries(metadata)) {
    if (!SAFE_METADATA_KEYS.has(key)) {
      throw new Error(`Stripe metadata key is not permitted: ${key}`);
    }
    if (!value || value.length > 200) {
      throw new Error(`Stripe metadata value is invalid for: ${key}`);
    }
    if (
      key !== "practice_id" &&
      (EMAIL_PATTERN.test(value) || PHONE_PATTERN.test(value) || DATE_PATTERN.test(value))
    ) {
      throw new Error(`Stripe metadata may contain PHI-like data: ${key}`);
    }
  }
  return metadata;
}

export function practiceStripeMetadata(practiceId: string): Record<string, string> {
  if (!UUID_PATTERN.test(practiceId)) {
    throw new Error("practiceId must be a UUID");
  }
  return assertSafeStripeMetadata({ practice_id: practiceId });
}
