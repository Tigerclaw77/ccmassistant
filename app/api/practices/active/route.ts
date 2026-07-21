import {
  authErrorResponse,
  getCurrentUser,
  PRACTICE_ADMIN_ROLES,
  requirePracticeMembership,
} from "../../../../lib/auth";
import {
  badRequest,
  optionalNumber,
  readJsonObject,
  requiredString,
  requiredStringUpdate,
  stringUpdate,
} from "../../../../lib/api/json";
import { recordAuditEvent } from "../../../../lib/ccm/audit";
import { validateTimeZone } from "../../../../lib/ccm/validation";
import { validateExpirationOverrides } from "../../../../lib/ccm/workflow-settings";
import { ACTIVE_PRACTICE_HEADER, resolveActivePractice } from "../../../../lib/practice-context";
import type { JsonValue } from "../../../../lib/ccm/types";
import type { Database } from "../../../../lib/supabase/database.types";

function jsonObject(value: JsonValue | null | undefined): Record<string, JsonValue> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return { ...value };
}

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

export async function GET(request: Request) {
  try {
    const context = await getCurrentUser(request);

    if (!context) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    const requestedPracticeId =
      request.headers.get(ACTIVE_PRACTICE_HEADER) ??
      new URL(request.url).searchParams.get("practiceId");
    const active = await resolveActivePractice(context, requestedPracticeId);

    if (!active.practice || !active.membership) {
      return Response.json({ error: "No active practice found" }, { status: 404 });
    }

    const { count: activeProviderCount, error: providerError } = await context.supabase
      .from("providers")
      .select("id", { count: "exact", head: true })
      .eq("practice_id", active.practice.id)
      .eq("is_active", true);
    if (providerError) {
      return Response.json({ error: providerError.message }, { status: 500 });
    }

    return Response.json({
      hasActiveProvider: (activeProviderCount ?? 0) > 0,
      membership: active.membership,
      practice: active.practice,
    });
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
  let name: string | undefined;
  let defaultTimezone: string | undefined;
  let ccmMonthlyMinMinutes: number | undefined;
  let address: string | null | undefined;
  let phone: string | null | undefined;
  let cmsEligibilityAttested: boolean | undefined;
  let medicareEnrollmentAttested: boolean | undefined;
  let allowCoordinatorClaiming: boolean | undefined;
  let ccmMonthEndAwarenessDay: number | undefined;
  let opportunityExpirationOverrides: ReturnType<typeof validateExpirationOverrides> | undefined;

  try {
    practiceId = requiredString(body, "practiceId");
    name = requiredStringUpdate(body, "name");
    defaultTimezone = requiredStringUpdate(body, "defaultTimezone");
    if (defaultTimezone !== undefined) {
      validateTimeZone(defaultTimezone);
    }
    address = stringUpdate(body, "address");
    phone = stringUpdate(body, "phone");
    cmsEligibilityAttested = booleanUpdate(body, "cmsEligibilityAttested");
    medicareEnrollmentAttested = booleanUpdate(body, "medicareEnrollmentAttested");
    allowCoordinatorClaiming = booleanUpdate(body, "allowCoordinatorClaiming");

    if ("ccmMonthEndAwarenessDay" in body) {
      const day = optionalNumber(body, "ccmMonthEndAwarenessDay");
      if (day === null || !Number.isInteger(day) || day < 1 || day > 28) throw new Error("ccmMonthEndAwarenessDay must be a whole number from 1 to 28");
      ccmMonthEndAwarenessDay = day;
    }
    if ("opportunityExpirationOverrides" in body) {
      opportunityExpirationOverrides = validateExpirationOverrides(body.opportunityExpirationOverrides);
    }

    if ("ccmMonthlyMinMinutes" in body) {
      const minutes = optionalNumber(body, "ccmMonthlyMinMinutes");

      if (minutes === null || minutes < 1) {
        throw new Error("ccmMonthlyMinMinutes must be at least 1");
      }

      ccmMonthlyMinMinutes = minutes;
    }
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
      .from("practices")
      .select("*")
      .eq("id", practiceId)
      .single();

    if (beforeError || !beforeData) {
      return Response.json({ error: beforeError?.message ?? "Practice not found" }, { status: 404 });
    }

    const billingSettings = jsonObject(beforeData.billing_settings);

    if (address !== undefined) {
      billingSettings.address = address;
    }

    if (phone !== undefined) {
      billingSettings.phone = phone;
    }

    if (cmsEligibilityAttested !== undefined) {
      billingSettings.cms_eligibility_attested = cmsEligibilityAttested;
      billingSettings.cms_eligibility_attested_at = cmsEligibilityAttested
        ? new Date().toISOString()
        : null;
      billingSettings.cms_eligibility_attested_by = cmsEligibilityAttested ? user.id : null;
    }

    if (medicareEnrollmentAttested !== undefined) {
      billingSettings.medicare_enrollment_attested = medicareEnrollmentAttested;
      billingSettings.medicare_enrollment_attested_at = medicareEnrollmentAttested
        ? new Date().toISOString()
        : null;
      billingSettings.medicare_enrollment_attested_by = medicareEnrollmentAttested
        ? user.id
        : null;
    }

    const update: Database["public"]["Tables"]["practices"]["Update"] = {
      billing_settings: billingSettings,
      updated_by: user.id,
    };

    if (name !== undefined) {
      update.name = name;
    }

    if (defaultTimezone !== undefined) {
      update.default_timezone = defaultTimezone;
    }

    if (ccmMonthlyMinMinutes !== undefined) {
      update.ccm_monthly_min_minutes = ccmMonthlyMinMinutes;
    }
    if (allowCoordinatorClaiming !== undefined) update.allow_coordinator_claiming = allowCoordinatorClaiming;
    if (ccmMonthEndAwarenessDay !== undefined) update.ccm_month_end_awareness_day = ccmMonthEndAwarenessDay;
    if (opportunityExpirationOverrides !== undefined) update.opportunity_expiration_overrides = opportunityExpirationOverrides;

    const { data, error } = await supabase
      .from("practices")
      .update(update)
      .eq("id", practiceId)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    await recordAuditEvent(supabase, {
      action: "practice.updated",
      actorUserId: user.id,
      afterData: data,
      beforeData,
      entityId: practiceId,
      entityType: "practice",
      practiceId,
    });

    return Response.json({ practice: data });
  } catch (error) {
    return authErrorResponse(error);
  }
}
