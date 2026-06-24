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
import { ACTIVE_PRACTICE_HEADER, resolveActivePractice } from "../../../../lib/practice-context";
import type { JsonValue } from "../../../../lib/ccm/types";

function jsonObject(value: JsonValue | null | undefined): Record<string, JsonValue> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return { ...value };
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

    return Response.json({
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

  try {
    practiceId = requiredString(body, "practiceId");
    name = requiredStringUpdate(body, "name");
    defaultTimezone = requiredStringUpdate(body, "defaultTimezone");
    address = stringUpdate(body, "address");
    phone = stringUpdate(body, "phone");

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

    const update: Record<string, unknown> = {
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
