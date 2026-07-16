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
import { validateNotFutureDate } from "../../../lib/ccm/validation";
import { CONTACT_METHODS } from "../../../lib/ccm/types";
import type { Database } from "../../../lib/supabase/database.types";

type EnrollmentRow = Database["public"]["Tables"]["ccm_enrollments"]["Row"];

function choosePreferredEnrollment(
  current: EnrollmentRow | undefined,
  next: EnrollmentRow,
): EnrollmentRow {
  if (!current) return next;
  if (current.status !== "active" && next.status === "active") return next;
  return current;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const practiceId = searchParams.get("practiceId");
  const patientId = searchParams.get("patientId");

  if (!practiceId) {
    return Response.json({ error: "practiceId is required" }, { status: 400 });
  }

  try {
    const { supabase } = await requirePracticeMembership(request, practiceId);

    if (patientId) {
      const { data: patient, error: patientError } = await supabase
        .from("patients")
        .select("*")
        .eq("practice_id", practiceId)
        .eq("id", patientId)
        .maybeSingle();

      if (patientError) {
        return Response.json({ error: patientError.message }, { status: 500 });
      }

      if (!patient) {
        return Response.json({ error: "Patient not found" }, { status: 404 });
      }

      const { data: enrollments, error: enrollmentError } = await supabase
        .from("ccm_enrollments")
        .select("*")
        .eq("practice_id", practiceId)
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (enrollmentError) {
        return Response.json({ error: enrollmentError.message }, { status: 500 });
      }

      const enrollment = (enrollments ?? []).reduce<EnrollmentRow | undefined>(
        choosePreferredEnrollment,
        undefined,
      );

      const { data: consentAuditEvents, error: auditError } = enrollment
        ? await supabase
            .from("audit_events")
            .select("*")
            .eq("practice_id", practiceId)
            .eq("entity_id", enrollment.id)
            .eq("action", "ccm_enrollment.consent_updated")
            .order("created_at", { ascending: false })
            .limit(10)
        : { data: [], error: null };

      if (auditError) {
        return Response.json({ error: auditError.message }, { status: 500 });
      }

      return Response.json({
        consentAuditEvents: consentAuditEvents ?? [],
        enrollment: enrollment ?? null,
        patient,
      });
    }

    const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? "25") || 25));
    const search = searchParams.get("search")?.replace(/[%,()]/g, " ").trim().slice(0, 80) ?? "";
    const status = searchParams.get("status")?.trim() ?? "";
    const sort = ["display_name", "dob", "external_id", "status"].includes(searchParams.get("sort") ?? "")
      ? searchParams.get("sort")!
      : "display_name";
    const direction = searchParams.get("direction") === "desc" ? "desc" : "asc";
    let patientsQuery = supabase
      .from("patients")
      .select("*", { count: "exact" })
      .eq("practice_id", practiceId);
    if (status) patientsQuery = patientsQuery.eq("status", status);
    if (search) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(search)) patientsQuery = patientsQuery.eq("dob", search);
      else patientsQuery = patientsQuery.or(`display_name.ilike.%${search}%,external_id.ilike.%${search}%,phone.ilike.%${search}%`);
    }
    const start = (page - 1) * pageSize;
    const { data, count, error } = await patientsQuery
      .order(sort, { ascending: direction === "asc", nullsFirst: false })
      .order("id", { ascending: true })
      .range(start, start + pageSize - 1);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const patientIds = (data ?? []).map((patient) => patient.id);
    const enrollmentsByPatientId: Record<string, EnrollmentRow> = {};

    if (patientIds.length > 0) {
      const { data: enrollments, error: enrollmentError } = await supabase
        .from("ccm_enrollments")
        .select("*")
        .eq("practice_id", practiceId)
        .in("patient_id", patientIds)
        .order("created_at", { ascending: false });

      if (enrollmentError) {
        return Response.json({ error: enrollmentError.message }, { status: 500 });
      }

      for (const enrollment of enrollments ?? []) {
        enrollmentsByPatientId[enrollment.patient_id] = choosePreferredEnrollment(
          enrollmentsByPatientId[enrollment.patient_id],
          enrollment,
        );
      }
    }

    return Response.json({ enrollmentsByPatientId, page, pageSize, patients: data, total: count ?? 0 });
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

    const dob = optionalString(body, "dob");
    try {
      validateNotFutureDate(dob, "Date of birth");
    } catch (error) {
      return badRequest(error);
    }

    if (dob && body.allowPotentialDuplicate !== true) {
      const { data: potentialDuplicate, error: duplicateError } = await supabase
        .from("patients")
        .select("id, display_name, dob")
        .eq("practice_id", practiceId)
        .eq("dob", dob)
        .ilike("display_name", displayName)
        .limit(1)
        .maybeSingle();

      if (duplicateError) {
        return Response.json({ error: duplicateError.message }, { status: 500 });
      }

      if (potentialDuplicate) {
        return Response.json(
          {
            code: "potential_duplicate",
            duplicatePatient: potentialDuplicate,
            error: "A patient with the same name and date of birth already exists. Review the record, or submit again to create anyway.",
          },
          { status: 409 },
        );
      }
    }

    const { data, error } = await supabase
      .from("patients")
      .insert({
        care_coordinator_member_id: optionalString(body, "careCoordinatorMemberId"),
        created_by: user.id,
        display_name: displayName,
        dob,
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

    const dob = stringUpdate(body, "dob");
    try {
      validateNotFutureDate(dob, "Date of birth");
    } catch (error) {
      return badRequest(error);
    }

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
        dob,
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
