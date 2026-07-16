import {
  authErrorResponse,
  PRACTICE_ADMIN_ROLES,
  requirePracticeMembership,
} from "../../../lib/auth";
import {
  badRequest,
  optionalString,
  optionalEnum,
  readJsonObject,
  requiredString,
  requiredStringUpdate,
  stringUpdate,
} from "../../../lib/api/json";
import { recordAuditEvent } from "../../../lib/ccm/audit";
import { validateNpi } from "../../../lib/ccm/validation";
import type { Database } from "../../../lib/supabase/database.types";
import {
  BILLING_PRACTITIONER_TYPES,
  PROVIDER_MANUAL_REVIEW_STATUSES,
  isSupportedBillingPractitionerType,
  type BillingPractitionerType,
  type ProviderManualReviewStatus,
} from "../../../lib/ccm/types";

function booleanUpdate(body: Record<string, unknown>, key: string): boolean | undefined {
  if (!(key in body)) {
    return undefined;
  }

  const value = body[key];

  if (typeof value !== "boolean") {
    throw new Error(`${key} must be true or false`);
  }

  return value;
}

function defaultManualReviewStatus(
  type: BillingPractitionerType,
): ProviderManualReviewStatus {
  return isSupportedBillingPractitionerType(type) ? "not_required" : "needs_review";
}

function defaultManualReviewReason(type: BillingPractitionerType): string | null {
  if (isSupportedBillingPractitionerType(type)) {
    return null;
  }

  return "Billing practitioner type requires manual review before CCM billing readiness.";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const practiceId = url.searchParams.get("practiceId");
  const includeInactive = url.searchParams.get("includeInactive") === "true";

  if (!practiceId) {
    return badRequest(new Error("practiceId is required"));
  }

  try {
    const { supabase } = await requirePracticeMembership(request, practiceId);
    let query = supabase
      .from("providers")
      .select("*")
      .eq("practice_id", practiceId)
      .order("created_at", { ascending: true });

    if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ providers: data ?? [] });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  let body;

  try {
    body = await readJsonObject(request);
  } catch (error) {
    return badRequest(error);
  }

  let practiceId: string;
  let fullName: string;
  let billingPractitionerType: BillingPractitionerType;

  try {
    practiceId = requiredString(body, "practiceId");
    fullName = requiredString(body, "fullName");
    billingPractitionerType =
      optionalEnum(body, "billingPractitionerType", BILLING_PRACTITIONER_TYPES) ?? "physician";
  } catch (error) {
    return badRequest(error);
  }

  try {
    const { supabase, user } = await requirePracticeMembership(
      request,
      practiceId,
      PRACTICE_ADMIN_ROLES,
    );
    const npi = optionalString(body, "npi");
    try {
      validateNpi(npi);
    } catch (error) {
      return badRequest(error);
    }

    const { data, error } = await supabase
      .from("providers")
      .insert({
        created_by: user.id,
        credentials: optionalString(body, "credentials"),
        email: optionalString(body, "email"),
        full_name: fullName,
        billing_practitioner_type: billingPractitionerType,
        is_active: true,
        is_billing_provider: true,
        manual_review_reason: defaultManualReviewReason(billingPractitionerType),
        manual_review_status: defaultManualReviewStatus(billingPractitionerType),
        npi,
        phone: optionalString(body, "phone"),
        practice_id: practiceId,
        updated_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    await recordAuditEvent(supabase, {
      action: "provider.created",
      actorUserId: user.id,
      afterData: data,
      entityId: data.id,
      entityType: "provider",
      practiceId,
    });

    return Response.json({ provider: data }, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  let body;

  try {
    body = await readJsonObject(request);
  } catch (error) {
    return badRequest(error);
  }

  let practiceId: string;
  let providerId: string;
  let fullName: string | undefined;
  let billingPractitionerType: BillingPractitionerType | undefined;
  let credentials: string | null | undefined;
  let npi: string | null | undefined;
  let email: string | null | undefined;
  let phone: string | null | undefined;
  let isActive: boolean | undefined;
  let manualReviewReason: string | null | undefined;
  let manualReviewStatus: ProviderManualReviewStatus | undefined;

  try {
    practiceId = requiredString(body, "practiceId");
    providerId = requiredString(body, "providerId");
    fullName = requiredStringUpdate(body, "fullName");
    billingPractitionerType = optionalEnum(
      body,
      "billingPractitionerType",
      BILLING_PRACTITIONER_TYPES,
    ) ?? undefined;
    credentials = stringUpdate(body, "credentials");
    npi = stringUpdate(body, "npi");
    email = stringUpdate(body, "email");
    phone = stringUpdate(body, "phone");
    isActive = booleanUpdate(body, "isActive");
    manualReviewReason = stringUpdate(body, "manualReviewReason");
    manualReviewStatus = optionalEnum(
      body,
      "manualReviewStatus",
      PROVIDER_MANUAL_REVIEW_STATUSES,
    ) ?? undefined;
    validateNpi(npi);
  } catch (error) {
    return badRequest(error);
  }

  try {
    const { supabase, user } = await requirePracticeMembership(
      request,
      practiceId,
      PRACTICE_ADMIN_ROLES,
    );

    const { data: beforeData, error: beforeError } = await supabase
      .from("providers")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("id", providerId)
      .single();

    if (beforeError || !beforeData) {
      return Response.json({ error: beforeError?.message ?? "Provider not found" }, { status: 404 });
    }

    const update: Database["public"]["Tables"]["providers"]["Update"] = {
      updated_by: user.id,
    };

    if (fullName !== undefined) update.full_name = fullName;
    if (billingPractitionerType !== undefined) {
      update.billing_practitioner_type = billingPractitionerType;
      if (manualReviewStatus === undefined) {
        update.manual_review_status = defaultManualReviewStatus(billingPractitionerType);
      }
      if (manualReviewReason === undefined) {
        update.manual_review_reason = defaultManualReviewReason(billingPractitionerType);
      }
    }
    if (credentials !== undefined) update.credentials = credentials;
    if (npi !== undefined) update.npi = npi;
    if (email !== undefined) update.email = email;
    if (phone !== undefined) update.phone = phone;
    if (isActive !== undefined) update.is_active = isActive;
    if (manualReviewStatus !== undefined) update.manual_review_status = manualReviewStatus;
    if (manualReviewReason !== undefined) update.manual_review_reason = manualReviewReason;

    const { data, error } = await supabase
      .from("providers")
      .update(update)
      .eq("practice_id", practiceId)
      .eq("id", providerId)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    await recordAuditEvent(supabase, {
      action: "provider.updated",
      actorUserId: user.id,
      afterData: data,
      beforeData,
      entityId: providerId,
      entityType: "provider",
      practiceId,
    });

    return Response.json({ provider: data });
  } catch (error) {
    return authErrorResponse(error);
  }
}
