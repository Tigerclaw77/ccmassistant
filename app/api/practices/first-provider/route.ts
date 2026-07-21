import {
  authErrorResponse,
  PRACTICE_ADMIN_ROLES,
  requirePracticeMembership,
} from "../../../../lib/auth";
import {
  badRequest,
  optionalString,
  readJsonObject,
  requiredString,
} from "../../../../lib/api/json";
import { recordAuditEvent } from "../../../../lib/ccm/audit";
import {
  ensureFirstProvider,
  type FirstProviderMode,
} from "../../../../lib/ccm/first-provider-bootstrap";
import {
  SUPPORTED_BILLING_PRACTITIONER_TYPES,
  type BillingPractitionerType,
} from "../../../../lib/ccm/types";

export async function POST(request: Request) {
  let body;
  try {
    body = await readJsonObject(request);
  } catch (error) {
    return badRequest(error);
  }

  let practiceId: string;
  let providerMode: FirstProviderMode;
  let providerFullName: string;
  let providerCredentials: string | null;
  let providerType: BillingPractitionerType;
  try {
    practiceId = requiredString(body, "practiceId");
    providerMode = requiredString(body, "providerMode") as FirstProviderMode;
    providerFullName = requiredString(body, "providerFullName");
    providerCredentials = optionalString(body, "providerCredentials");
    providerType = requiredString(body, "providerType") as BillingPractitionerType;
    if (!["treating_provider", "administrator_only"].includes(providerMode)) {
      throw new Error("providerMode is invalid");
    }
    if (!SUPPORTED_BILLING_PRACTITIONER_TYPES.includes(
      providerType as (typeof SUPPORTED_BILLING_PRACTITIONER_TYPES)[number],
    )) {
      throw new Error("providerType is invalid");
    }
    if (providerFullName.length > 200) throw new Error("providerFullName must be 200 characters or fewer");
    if (providerCredentials && providerCredentials.length > 80) throw new Error("providerCredentials must be 80 characters or fewer");
  } catch (error) {
    return badRequest(error);
  }

  try {
    const { membership, supabase, user } = await requirePracticeMembership(
      request,
      practiceId,
      PRACTICE_ADMIN_ROLES,
    );
    const providerResult = await ensureFirstProvider(supabase, {
      actorUserId: user.id,
      billingPractitionerType: providerType,
      credentials: providerCredentials,
      email: providerMode === "treating_provider" ? user.email : null,
      fullName: providerFullName,
      membership,
      mode: providerMode,
      practiceId,
    });

    if (providerResult.created) {
      await recordAuditEvent(supabase, {
        action: "provider.onboarding_recovered",
        actorUserId: user.id,
        afterData: {
          linked_to_owner: providerMode === "treating_provider",
          provider_id: providerResult.provider.id,
          provider_role_assigned: providerResult.providerRoleAssigned,
        },
        entityId: providerResult.provider.id,
        entityType: "provider",
        practiceId,
      });
    }

    return Response.json({ provider: providerResult.provider }, { status: providerResult.created ? 201 : 200 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
