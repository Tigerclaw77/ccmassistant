import { createClient } from "@supabase/supabase-js";
import {
  DEVELOPMENT_PERSONA_HEADER,
  DEVELOPMENT_PERSONA_SESSION_KEY,
  isDevelopmentPersonaEnabled,
  sanitizeDevelopmentPersonaContext,
  serializeDevelopmentPersonaContext,
} from "./development-persona";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function getSupabaseAuthHeaders(options: { includeDevelopmentPersona?: boolean } = {}): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  if (
    options.includeDevelopmentPersona !== false &&
    typeof window !== "undefined" &&
    isDevelopmentPersonaEnabled()
  ) {
    try {
      const stored = sessionStorage.getItem(DEVELOPMENT_PERSONA_SESSION_KEY);
      const context = stored ? sanitizeDevelopmentPersonaContext(JSON.parse(stored)) : null;
      if (context) headers[DEVELOPMENT_PERSONA_HEADER] = serializeDevelopmentPersonaContext(context);
    } catch {
      sessionStorage.removeItem(DEVELOPMENT_PERSONA_SESSION_KEY);
    }
  }

  return headers;
}
