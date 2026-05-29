import {
  authErrorResponse,
  PATIENT_WRITE_ROLES,
  requirePracticeMembership,
} from "../../../lib/auth";
import {
  badRequest,
  enumUpdate,
  optionalEnum,
  optionalString,
  readJsonObject,
  requiredStringUpdate,
  stringUpdate,
} from "../../../lib/api/json";
import { recordAuditEvent } from "../../../lib/ccm/audit";
import { CONTACT_METHODS } from "../../../lib/ccm/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const practiceId = searchParams.get("practiceId");

  if (!practiceId) {
    return Response.json({ error: "practiceId is required" }, { status: 400 });
  }

  try {
    const { supabase } = await requirePracticeMembership(request, practiceId);
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .eq("practice_id", practiceId)
      .order("display_name", { ascending: true });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ patients: data });
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

  const practiceId = body.practiceId;

  if (typeof practiceId !== "string") {
    return badRequest(new Error("practiceId is required"));
  }

  try {
    const { supabase, user } = await requirePracticeMembership(
      request,
      practiceId,
      PATIENT_WRITE_ROLES,
    );
    const firstName = optionalString(body, "firstName");
    const lastName = optionalString(body, "lastName");
    const displayName =
      optionalString(body, "displayName") ?? [firstName, lastName].filter(Boolean).join(" ");

    if (!displayName) {
      return badRequest(new Error("displayName or firstName/lastName is required"));
    }

    const { data, error } = await supabase
      .from("patients")
      .insert({
        care_coordinator_member_id: optionalString(body, "careCoordinatorMemberId"),
        created_by: user.id,
        display_name: displayName,
        dob: optionalString(body, "dob"),
        email: optionalString(body, "email"),
        external_id: optionalString(body, "externalId"),
        first_name: firstName,
        last_name: lastName,
        phone: optionalString(body, "phone"),
        practice_id: practiceId,
        preferred_contact_method: optionalEnum(body, "preferredContactMethod", CONTACT_METHODS) ?? "phone",
        primary_provider_id: optionalString(body, "primaryProviderId"),
        status: optionalString(body, "status") ?? "active",
        updated_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    await recordAuditEvent(supabase, {
      action: "patient.created",
      actorUserId: user.id,
      afterData: data,
      entityId: data.id,
      entityType: "patient",
      practiceId,
    });

    return Response.json({ patient: data }, { status: 201 });
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

  const practiceId = body.practiceId;
  const patientId = body.patientId;

  if (typeof practiceId !== "string" || typeof patientId !== "string") {
    return badRequest(new Error("practiceId and patientId are required"));
  }

  try {
    const { supabase, user } = await requirePracticeMembership(
      request,
      practiceId,
      PATIENT_WRITE_ROLES,
    );

    const { data: beforeData } = await supabase
      .from("patients")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("id", patientId)
      .maybeSingle();

    const { data, error } = await supabase
      .from("patients")
      .update({
        care_coordinator_member_id: stringUpdate(body, "careCoordinatorMemberId"),
        display_name: requiredStringUpdate(body, "displayName"),
        dob: stringUpdate(body, "dob"),
        email: stringUpdate(body, "email"),
        external_id: stringUpdate(body, "externalId"),
        first_name: stringUpdate(body, "firstName"),
        last_name: stringUpdate(body, "lastName"),
        phone: stringUpdate(body, "phone"),
        preferred_contact_method: enumUpdate(body, "preferredContactMethod", CONTACT_METHODS),
        primary_provider_id: stringUpdate(body, "primaryProviderId"),
        status: requiredStringUpdate(body, "status"),
        updated_by: user.id,
      })
      .eq("practice_id", practiceId)
      .eq("id", patientId)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    await recordAuditEvent(supabase, {
      action: "patient.updated",
      actorUserId: user.id,
      afterData: data,
      beforeData,
      entityId: data.id,
      entityType: "patient",
      practiceId,
    });

    return Response.json({ patient: data });
  } catch (error) {
    return authErrorResponse(error);
  }
}
