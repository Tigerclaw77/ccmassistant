import type { ServerSupabaseClient } from "../auth";

type EnsureProviderProfileInput = {
  actorUserId: string;
  displayName?: string | null;
  email: string;
  memberId: string;
  practiceId: string;
};

export async function ensureProviderProfileForMember(
  service: ServerSupabaseClient,
  input: EnsureProviderProfileInput,
): Promise<void> {
  const { data: linked } = await service.from("providers").select("id").eq("practice_id", input.practiceId).eq("member_id", input.memberId).limit(1).maybeSingle();
  if (linked) return;
  const { data: matching } = await service.from("providers").select("id, member_id").eq("practice_id", input.practiceId).ilike("email", input.email).limit(1).maybeSingle();
  if (matching?.member_id && matching.member_id !== input.memberId) {
    throw new Error("A different staff account is already linked to this provider profile");
  }
  if (matching) {
    const { error } = await service.from("providers").update({ member_id: input.memberId, updated_by: input.actorUserId }).eq("id", matching.id).eq("practice_id", input.practiceId).is("member_id", null);
    if (error) throw new Error("Unable to link the provider profile");
    return;
  }
  const fallbackName = input.email.split("@")[0].replace(/[._-]+/g, " ");
  const { error } = await service.from("providers").insert({
    billing_practitioner_type: "other",
    created_by: input.actorUserId,
    email: input.email,
    full_name: input.displayName?.trim() || fallbackName || "Invited provider",
    is_active: true,
    is_billing_provider: false,
    manual_review_reason: "Provider profile requires administrator completion before billing use.",
    manual_review_status: "needs_review",
    member_id: input.memberId,
    practice_id: input.practiceId,
    updated_by: input.actorUserId,
  });
  if (error) throw new Error("Unable to create the provider profile");
}
