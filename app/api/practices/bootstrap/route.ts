import {
  authErrorResponse,
  requireAuthenticatedUser,
} from "../../../../lib/auth";
import { badRequest, optionalString, readJsonObject, requiredString } from "../../../../lib/api/json";
import { validateTimeZone } from "../../../../lib/ccm/validation";
import {
  SUPPORTED_BILLING_PRACTITIONER_TYPES,
  type BillingPractitionerType,
  type Practice,
  type PracticeMember,
  type Provider,
} from "../../../../lib/ccm/types";
import {
  ensureFirstProvider,
  type FirstProviderMode,
} from "../../../../lib/ccm/first-provider-bootstrap";
import { recordAuditEvent } from "../../../../lib/ccm/audit";

type BootstrapResult = {
  membership: PracticeMember;
  practice: Practice;
  provider?: Provider;
};

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 51);

  return slug || "practice";
}

function optionalBoolean(body: Record<string, unknown>, key: string, fallback: boolean): boolean {
  const value = body[key];

  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value !== "boolean") {
    throw new Error(`${key} must be true or false`);
  }

  return value;
}

export async function POST(request: Request) {
  let body;

  try {
    body = await readJsonObject(request);
  } catch (error) {
    return badRequest(error);
  }

  let name: string;
  let organizationType: string;
  let defaultTimezone: string;
  let primaryAddress: string | null;
  let phone: string;
  let logoUrl: string | null;
  let coordinatorAssignmentMode: string;
  let staffEmailNotifications: boolean;
  let patientReminderNotifications: boolean;
  let providerMode: FirstProviderMode;
  let providerFullName: string;
  let providerCredentials: string | null;
  let providerType: BillingPractitionerType;

  try {
    name = requiredString(body, "name");
    organizationType = requiredString(body, "organizationType");
    defaultTimezone = requiredString(body, "defaultTimezone");
    primaryAddress = optionalString(body, "primaryAddress");
    phone = requiredString(body, "phone");
    logoUrl = optionalString(body, "logoUrl");
    coordinatorAssignmentMode = requiredString(body, "coordinatorAssignmentMode");
    staffEmailNotifications = optionalBoolean(body, "staffEmailNotifications", true);
    patientReminderNotifications = optionalBoolean(body, "patientReminderNotifications", false);
    providerMode = requiredString(body, "providerMode") as FirstProviderMode;
    providerFullName = requiredString(body, "providerFullName");
    providerCredentials = optionalString(body, "providerCredentials");
    providerType = requiredString(body, "providerType") as BillingPractitionerType;

    if (![
      "independent_practice",
      "group_practice",
      "health_system",
      "fqhc",
      "other",
    ].includes(organizationType)) {
      throw new Error("organizationType is invalid");
    }
    if (!["manual", "balanced"].includes(coordinatorAssignmentMode)) {
      throw new Error("coordinatorAssignmentMode is invalid");
    }
    if (!["treating_provider", "administrator_only"].includes(providerMode)) {
      throw new Error("providerMode is invalid");
    }
    if (!SUPPORTED_BILLING_PRACTITIONER_TYPES.includes(
      providerType as (typeof SUPPORTED_BILLING_PRACTITIONER_TYPES)[number],
    )) {
      throw new Error("providerType is invalid");
    }
    if (name.length > 200) throw new Error("name must be 200 characters or fewer");
    if (providerFullName.length > 200) throw new Error("providerFullName must be 200 characters or fewer");
    if (providerCredentials && providerCredentials.length > 80) throw new Error("providerCredentials must be 80 characters or fewer");
    if (phone.length > 40) throw new Error("phone must be 40 characters or fewer");
    if (primaryAddress && primaryAddress.length > 500) {
      throw new Error("primaryAddress must be 500 characters or fewer");
    }
    if (logoUrl) {
      const parsedLogoUrl = new URL(logoUrl);
      if (!["http:", "https:"].includes(parsedLogoUrl.protocol)) {
        throw new Error("logoUrl must use http or https");
      }
    }
    validateTimeZone(defaultTimezone);
  } catch (error) {
    return badRequest(error);
  }

  try {
    const { supabase, user } = await requireAuthenticatedUser(request);

    const { data, error } = await supabase.rpc("bootstrap_user_practice", {
      coordinator_settings: { assignment_mode: coordinatorAssignmentMode },
      default_timezone: defaultTimezone,
      logo_url: logoUrl,
      notification_defaults: {
        patient_reminders: patientReminderNotifications,
        staff_email: staffEmailNotifications,
      },
      organization_type: organizationType,
      phone,
      practice_name: name,
      practice_slug: `${slugify(name)}-${user.id.replaceAll("-", "").slice(0, 12)}`,
      primary_address: primaryAddress ? { formatted: primaryAddress } : null,
    });

    if (error) {
      const status = error.code === "42501" ? 403 : error.code === "22023" ? 400 : 500;
      return Response.json({ error: error.message }, { status });
    }

    const bootstrap = data as BootstrapResult;
    if (!bootstrap.practice?.id || !bootstrap.membership?.id) {
      return Response.json({ error: "Practice bootstrap did not return an active membership" }, { status: 500 });
    }

    const providerResult = await ensureFirstProvider(supabase, {
      actorUserId: user.id,
      billingPractitionerType: providerType,
      credentials: providerCredentials,
      email: providerMode === "treating_provider" ? user.email : null,
      fullName: providerFullName,
      membership: bootstrap.membership,
      mode: providerMode,
      practiceId: bootstrap.practice.id,
    });

    if (providerResult.created) {
      await recordAuditEvent(supabase, {
        action: "provider.onboarding_created",
        actorUserId: user.id,
        afterData: {
          linked_to_owner: providerMode === "treating_provider",
          provider_id: providerResult.provider.id,
          provider_role_assigned: providerResult.providerRoleAssigned,
        },
        entityId: providerResult.provider.id,
        entityType: "provider",
        practiceId: bootstrap.practice.id,
      });
    }

    return Response.json({ ...bootstrap, provider: providerResult.provider }, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
