import { createHash } from "node:crypto";
import type { ServerSupabaseClient } from "../auth";
import type { BillingPractitionerType, Provider } from "./types";

export type FirstProviderMode = "administrator_only" | "treating_provider";

type EnsureFirstProviderInput = {
  actorUserId: string;
  billingPractitionerType: BillingPractitionerType;
  credentials?: string | null;
  email?: string | null;
  fullName: string;
  membership: { id: string; user_id: string | null };
  mode: FirstProviderMode;
  practiceId: string;
};

export type FirstProviderBootstrapResult = {
  created: boolean;
  provider: Provider;
  providerRoleAssigned: boolean;
};

export function deterministicBootstrapUuid(seed: string): string {
  const bytes = createHash("sha256").update(seed).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function ensureProviderRole(
  supabase: ServerSupabaseClient,
  input: EnsureFirstProviderInput,
): Promise<boolean> {
  if (input.mode !== "treating_provider") return false;

  const { data: existing, error: lookupError } = await supabase
    .from("practice_member_role_assignments")
    .select("id")
    .eq("practice_id", input.practiceId)
    .eq("member_id", input.membership.id)
    .eq("role", "provider")
    .eq("status", "active")
    .is("valid_until", null)
    .limit(1)
    .maybeSingle();

  if (lookupError) throw new Error(`Unable to verify provider membership: ${lookupError.message}`);
  if (existing) return false;

  const { error } = await supabase.from("practice_member_role_assignments").insert({
    assigned_by: input.actorUserId,
    member_id: input.membership.id,
    practice_id: input.practiceId,
    role: "provider",
    status: "active",
    user_id: input.actorUserId,
  });

  if (error && error.code !== "23505") {
    throw new Error(`Unable to assign provider membership: ${error.message}`);
  }
  return !error;
}

export async function ensureFirstProvider(
  supabase: ServerSupabaseClient,
  input: EnsureFirstProviderInput,
): Promise<FirstProviderBootstrapResult> {
  const normalizedEmail = input.email?.trim().toLowerCase() || null;
  let existingProvider: Provider | null = null;

  if (input.mode === "treating_provider") {
    const { data, error } = await supabase
      .from("providers")
      .select("*")
      .eq("practice_id", input.practiceId)
      .eq("member_id", input.membership.id)
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(`Unable to verify the linked provider: ${error.message}`);
    existingProvider = data;

    if (!existingProvider && normalizedEmail) {
      const { data: matching, error: matchingError } = await supabase
        .from("providers")
        .select("*")
        .eq("practice_id", input.practiceId)
        .ilike("email", normalizedEmail)
        .limit(1)
        .maybeSingle();
      if (matchingError) throw new Error(`Unable to verify the provider email: ${matchingError.message}`);
      if (matching?.member_id && matching.member_id !== input.membership.id) {
        throw new Error("A different staff account is already linked to this provider profile");
      }
      existingProvider = matching;
    }
  } else {
    const { data, error } = await supabase
      .from("providers")
      .select("*")
      .eq("practice_id", input.practiceId)
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(`Unable to verify the first provider: ${error.message}`);
    if (data) {
      return { created: false, provider: data, providerRoleAssigned: false };
    }
  }

  const profile = {
    billing_practitioner_type: input.billingPractitionerType,
    credentials: input.credentials?.trim() || null,
    email: normalizedEmail,
    full_name: input.fullName.trim(),
    is_active: true,
    is_billing_provider: true,
    manual_review_reason: null,
    manual_review_status: "not_required" as const,
    member_id: input.mode === "treating_provider" ? input.membership.id : null,
    practice_id: input.practiceId,
    updated_by: input.actorUserId,
  };

  let provider: Provider;
  let created = false;
  if (existingProvider) {
    const { data, error } = await supabase
      .from("providers")
      .update(profile)
      .eq("id", existingProvider.id)
      .eq("practice_id", input.practiceId)
      .select()
      .single();
    if (error || !data) throw new Error(`Unable to update the first provider: ${error?.message ?? "No provider returned"}`);
    provider = data;
  } else {
    const providerId = deterministicBootstrapUuid(
      `${input.practiceId}:${input.mode === "treating_provider" ? input.actorUserId : "first-provider"}`,
    );
    const { data, error } = await supabase
      .from("providers")
      .upsert({ ...profile, created_by: input.actorUserId, id: providerId }, { onConflict: "id" })
      .select()
      .single();
    if (error || !data) throw new Error(`Unable to create the first provider: ${error?.message ?? "No provider returned"}`);
    provider = data;
    created = true;
  }

  const providerRoleAssigned = await ensureProviderRole(supabase, input);
  return { created, provider, providerRoleAssigned };
}
