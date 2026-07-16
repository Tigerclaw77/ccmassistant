import { authErrorResponse, PRACTICE_ADMIN_ROLES, requirePracticeMembership } from "../../../lib/auth";
import { badRequest, readJsonObject, requiredString } from "../../../lib/api/json";
import { recordAuditEvent } from "../../../lib/ccm/audit";
import { containsPotentialPhi } from "../../../lib/ccm/question-banks/customization-contributions";
import { CANONICAL_SUGGESTED_QUESTION_BANKS } from "../../../lib/ccm/question-banks/mappings";
import type { QuestionBankCustomizationScope } from "../../../lib/ccm/types";

const CONTEXTS = new Set(["intake", "monthly_checkin", "annual_review", "care_plan_review"]);
const ANSWER_TYPES = new Set(["yes_no", "number", "text", "date", "single_select", "multi_select"]);

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function canonicalBank(conditionId: string) {
  return CANONICAL_SUGGESTED_QUESTION_BANKS.find((bank) => bank.canonicalConditionId === conditionId) ?? null;
}

async function authorizeScope(
  context: Awaited<ReturnType<typeof requirePracticeMembership>>,
  scope: QuestionBankCustomizationScope,
  providerId: string | null,
  coordinatorId: string | null,
) {
  if (PRACTICE_ADMIN_ROLES.includes(context.membership.role as "owner" | "admin")) return;
  if (scope === "provider" && context.membership.role === "provider" && providerId) {
    const { data } = await context.supabase.from("providers").select("id").eq("id", providerId).eq("member_id", context.membership.id).maybeSingle();
    if (data) return;
  }
  if (scope === "coordinator" && context.membership.role === "coordinator" && coordinatorId === context.membership.id) return;
  throw new Error("You cannot manage this question-library scope.");
}

export async function GET(request: Request) {
  const practiceId = new URL(request.url).searchParams.get("practiceId");
  if (!practiceId) return badRequest(new Error("practiceId is required"));

  try {
    const context = await requirePracticeMembership(request, practiceId);
    const [favorites, customQuestions, overrides, contributions, providers, coordinators] = await Promise.all([
      context.supabase.from("question_bank_favorite_versions").select("*").eq("practice_id", practiceId).order("created_at", { ascending: false }),
      context.supabase.from("question_bank_custom_question_versions").select("*").eq("practice_id", practiceId).order("created_at", { ascending: false }),
      context.supabase.from("question_bank_override_versions").select("*").eq("practice_id", practiceId).order("created_at", { ascending: false }),
      context.supabase.from("question_contribution_candidates").select("*").eq("practice_id", practiceId).order("updated_at", { ascending: false }),
      context.supabase.from("providers").select("id, full_name, member_id").eq("practice_id", practiceId).eq("is_active", true).order("full_name"),
      context.supabase.from("practice_members").select("id, invited_email, role").eq("practice_id", practiceId).in("role", ["owner", "admin", "coordinator"]).eq("status", "active"),
    ]);
    for (const result of [favorites, customQuestions, overrides, contributions, providers, coordinators]) {
      if (result.error) throw new Error(result.error.message);
    }

    return Response.json({
      banks: CANONICAL_SUGGESTED_QUESTION_BANKS.map((bank) => ({
        applicableContexts: bank.applicableContexts,
        canonicalConditionId: bank.canonicalConditionId,
        displayName: bank.displayName,
        id: bank.id,
        questionCount: bank.questionReferences.length,
        reviewStatus: bank.reviewStatus,
        status: bank.status,
        version: bank.contentVersion,
      })),
      contributions: contributions.data ?? [],
      coordinators: coordinators.data ?? [],
      customQuestions: customQuestions.data ?? [],
      favorites: favorites.data ?? [],
      membership: context.membership,
      overrides: overrides.data ?? [],
      providers: providers.data ?? [],
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await readJsonObject(request);
  } catch (error) {
    return badRequest(error);
  }

  let practiceId: string;
  let operation: string;
  try {
    practiceId = requiredString(body, "practiceId");
    operation = requiredString(body, "operation");
  } catch (error) {
    return badRequest(error);
  }

  try {
    const context = await requirePracticeMembership(request, practiceId);

    if (operation === "favorite") {
      const canonicalConditionId = requiredString(body, "canonicalConditionId");
      const bank = canonicalBank(canonicalConditionId);
      if (!bank) return badRequest(new Error("Unknown canonical condition"));
      const scope = requiredString(body, "scope") as QuestionBankCustomizationScope;
      if (!(["clinic", "provider", "coordinator"] as string[]).includes(scope)) return badRequest(new Error("Invalid favorite scope"));
      const providerId = optionalString(body.providerId);
      const coordinatorId = optionalString(body.coordinatorId);
      if ((scope === "clinic" && (providerId || coordinatorId)) || (scope === "provider" && (!providerId || coordinatorId)) || (scope === "coordinator" && (!providerId || !coordinatorId))) {
        return badRequest(new Error("Favorite owner does not match its scope"));
      }
      await authorizeScope(context, scope, providerId, coordinatorId);
      let query = context.supabase.from("question_bank_favorite_versions").select("version").eq("practice_id", practiceId).eq("scope", scope).eq("canonical_condition_id", canonicalConditionId);
      query = providerId ? query.eq("provider_id", providerId) : query.is("provider_id", null);
      query = coordinatorId ? query.eq("coordinator_member_id", coordinatorId) : query.is("coordinator_member_id", null);
      const { data: latest, error: latestError } = await query.order("version", { ascending: false }).limit(1).maybeSingle();
      if (latestError) throw new Error(latestError.message);
      const { data, error } = await context.supabase.from("question_bank_favorite_versions").insert({
        canonical_condition_id: canonicalConditionId,
        coordinator_member_id: coordinatorId,
        created_by: context.user.id,
        display_order: typeof body.displayOrder === "number" && Number.isInteger(body.displayOrder) && body.displayOrder >= 0 ? body.displayOrder : 0,
        favorite: body.favorite !== false,
        practice_id: practiceId,
        provider_id: providerId,
        scope,
        state: "active",
        version: (latest?.version ?? 0) + 1,
      }).select().single();
      if (error) throw new Error(error.message);
      await recordAuditEvent(context.supabase, { action: "question_bank.favorite_version_created", actorUserId: context.user.id, afterData: data, entityId: data.id, entityType: "question_bank_favorite", practiceId });
      return Response.json({ favorite: data });
    }

    if (operation === "custom_question") {
      if (!PRACTICE_ADMIN_ROLES.includes(context.membership.role as "owner" | "admin")) return Response.json({ error: "Practice administration role required" }, { status: 403 });
      const canonicalConditionId = requiredString(body, "canonicalConditionId");
      if (!canonicalBank(canonicalConditionId)) return badRequest(new Error("Unknown canonical condition"));
      const questionText = requiredString(body, "questionText");
      const answerType = requiredString(body, "answerType");
      const contexts = Array.isArray(body.contexts) ? body.contexts.filter((value): value is string => typeof value === "string") : [];
      if (!ANSWER_TYPES.has(answerType) || !contexts.length || contexts.some((value) => !CONTEXTS.has(value))) return badRequest(new Error("Custom question answer type or context is invalid"));
      if (containsPotentialPhi(questionText)) return badRequest(new Error("Custom questions cannot contain patient identifiers or contact information"));
      const questionKey = `custom.${canonicalConditionId.replace(/[^a-z0-9]+/gi, "_").toLowerCase()}.${crypto.randomUUID().slice(0, 8)}`;
      const { data, error } = await context.supabase.from("question_bank_custom_question_versions").insert({
        answer_type: answerType,
        canonical_condition_id: canonicalConditionId,
        contexts,
        created_by: context.user.id,
        helper_text: optionalString(body.helperText) ?? "",
        owner_id: practiceId,
        practice_id: practiceId,
        question_key: questionKey,
        question_text: questionText,
        scope: "clinic",
        state: "active",
        version: 1,
      }).select().single();
      if (error) throw new Error(error.message);
      await recordAuditEvent(context.supabase, { action: "question_bank.custom_question_created", actorUserId: context.user.id, afterData: { canonical_condition_id: canonicalConditionId, question_key: questionKey, version: 1 }, entityId: data.id, entityType: "question_bank_custom_question", practiceId });
      return Response.json({ customQuestion: data });
    }

    if (operation === "retire_custom_question") {
      if (!PRACTICE_ADMIN_ROLES.includes(context.membership.role as "owner" | "admin")) return Response.json({ error: "Practice administration role required" }, { status: 403 });
      const questionKey = requiredString(body, "questionKey");
      const { data: latest, error: latestError } = await context.supabase.from("question_bank_custom_question_versions").select("*").eq("practice_id", practiceId).eq("question_key", questionKey).order("version", { ascending: false }).limit(1).maybeSingle();
      if (latestError) throw new Error(latestError.message);
      if (!latest) return Response.json({ error: "Custom question not found" }, { status: 404 });
      const { data, error } = await context.supabase.from("question_bank_custom_question_versions").insert({
        answer_type: latest.answer_type,
        canonical_condition_id: latest.canonical_condition_id,
        contexts: latest.contexts,
        created_by: context.user.id,
        helper_text: latest.helper_text,
        owner_id: latest.owner_id,
        practice_id: latest.practice_id,
        question_key: latest.question_key,
        question_text: latest.question_text,
        scope: latest.scope,
        state: "retired",
        version: latest.version + 1,
      }).select().single();
      if (error) throw new Error(error.message);
      await recordAuditEvent(context.supabase, { action: "question_bank.custom_question_retired", actorUserId: context.user.id, afterData: { question_key: questionKey, version: data.version }, entityId: data.id, entityType: "question_bank_custom_question", practiceId });
      return Response.json({ customQuestion: data });
    }

    if (operation === "contribution") {
      const canonicalConditionId = requiredString(body, "canonicalConditionId");
      if (!canonicalBank(canonicalConditionId)) return badRequest(new Error("Unknown canonical condition"));
      const questionText = requiredString(body, "questionText");
      const contributionContext = requiredString(body, "context");
      if (!CONTEXTS.has(contributionContext)) return badRequest(new Error("Contribution context is invalid"));
      if (body.noPhiAttested !== true || containsPotentialPhi(questionText)) return badRequest(new Error("Remove possible patient information and attest that the candidate contains no PHI"));
      const anonymous = body.anonymous !== false;
      const { data, error } = await context.supabase.from("question_contribution_candidates").insert({
        anonymous,
        canonical_condition_id: canonicalConditionId,
        created_by: anonymous ? null : context.user.id,
        no_phi_attested: true,
        opt_in_status: body.optIn === true ? "opted_in" : "not_opted_in",
        practice_id: practiceId,
        question_text: questionText,
        usage_count: 0,
        context: contributionContext,
      }).select().single();
      if (error) throw new Error(error.message);
      await recordAuditEvent(context.supabase, { action: "question_bank.contribution_candidate_created", actorUserId: context.user.id, afterData: { anonymous, canonical_condition_id: canonicalConditionId, opt_in_status: data.opt_in_status }, entityId: data.id, entityType: "question_contribution_candidate", practiceId });
      return Response.json({ contribution: data });
    }

    return badRequest(new Error("Unsupported question-library operation"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("cannot manage")) return Response.json({ error: error.message }, { status: 403 });
    return authErrorResponse(error);
  }
}
