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

export function authCallbackError(location: Pick<Location, "hash" | "search">): string | null {
  const query = new URLSearchParams(location.search);
  const fragment = new URLSearchParams(location.hash.replace(/^#/, ""));
  const code = fragment.get("error_code") ?? query.get("error_code");
  const description = fragment.get("error_description") ?? query.get("error_description");
  if (code === "otp_expired") return "This secure link has expired or was already used. Request a new email and use only the newest link.";
  if (description) return description.replaceAll("+", " ");
  return null;
}
