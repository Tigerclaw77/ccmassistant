import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { Database } from "./supabase/database.types";
import type { PracticeRole, UUID } from "./ccm/types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export type ServerSupabaseClient = SupabaseClient<Database>;

export type AuthContext = {
  accessToken: string;
  supabase: ServerSupabaseClient;
  user: User;
};

export type PracticeMembership = {
  id: UUID;
  practice_id: UUID;
  role: PracticeRole;
  status: "active";
  user_id: UUID;
};

export type PracticeAuthContext = AuthContext & {
  membership: PracticeMembership;
  practiceId: UUID;
};

export const PRACTICE_ADMIN_ROLES = ["owner", "admin"] as const satisfies readonly PracticeRole[];
export const PATIENT_WRITE_ROLES = [
  "owner",
  "admin",
  "provider",
  "coordinator",
] as const satisfies readonly PracticeRole[];
export const BILLING_WRITE_ROLES = [
  "owner",
  "admin",
  "billing_staff",
] as const satisfies readonly PracticeRole[];

export class AuthError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

function requireSupabaseConfig() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new AuthError(500, "Supabase URL and anon key are not configured");
  }

  return {
    anonKey: SUPABASE_ANON_KEY,
    url: SUPABASE_URL,
  };
}

export function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;

  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;

  return token;
}

export function createServerSupabaseClient(accessToken?: string): ServerSupabaseClient {
  const config = requireSupabaseConfig();

  return createClient<Database>(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  });
}

export function createServiceRoleSupabaseClient(): ServerSupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new AuthError(500, "Supabase service role key is not configured");
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function getCurrentUser(request: Request): Promise<AuthContext | null> {
  const accessToken = getBearerToken(request);
  if (!accessToken) return null;

  const supabase = createServerSupabaseClient(accessToken);
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) return null;

  return {
    accessToken,
    supabase,
    user: data.user,
  };
}

export async function requireAuthenticatedUser(request: Request): Promise<AuthContext> {
  const context = await getCurrentUser(request);

  if (!context) {
    throw new AuthError(401, "Authentication required");
  }

  return context;
}

export function hasPracticeRole(
  membership: PracticeMembership,
  allowedRoles: readonly PracticeRole[],
): boolean {
  return allowedRoles.includes(membership.role);
}

export async function requirePracticeMembership(
  request: Request,
  practiceId: UUID,
  allowedRoles?: readonly PracticeRole[],
): Promise<PracticeAuthContext> {
  const context = await requireAuthenticatedUser(request);

  const { data, error } = await context.supabase
    .from("practice_members")
    .select("id, practice_id, role, status, user_id")
    .eq("practice_id", practiceId)
    .eq("user_id", context.user.id)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw new AuthError(403, "Unable to verify practice membership");
  }

  if (!data || !data.user_id) {
    throw new AuthError(403, "Active practice membership required");
  }

  const membership: PracticeMembership = {
    id: data.id,
    practice_id: data.practice_id,
    role: data.role,
    status: "active",
    user_id: data.user_id,
  };

  if (allowedRoles && !hasPracticeRole(membership, allowedRoles)) {
    throw new AuthError(403, "Practice role is not permitted for this action");
  }

  return {
    ...context,
    membership,
    practiceId,
  };
}

export function authErrorResponse(error: unknown): Response {
  if (error instanceof AuthError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  return Response.json({ error: "Unexpected server error" }, { status: 500 });
}
