export function safeAppPath(value: string | null | undefined, fallback = "/patients"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }
  return value;
}
export function authRedirectUrl(path: string): string {
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const browserOrigin = typeof window === "undefined" ? "" : window.location.origin;
  return `${configuredOrigin || browserOrigin}${path}`;
}
