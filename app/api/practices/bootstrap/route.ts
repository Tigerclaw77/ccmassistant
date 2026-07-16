import {
  authErrorResponse,
  requireAuthenticatedUser,
} from "../../../../lib/auth";
import { badRequest, readJsonObject, requiredString } from "../../../../lib/api/json";
import { hasInitialOwnerClaim } from "../../../../lib/practice-bootstrap";
import type { Practice, PracticeMember } from "../../../../lib/ccm/types";

type BootstrapResult = {
  membership: PracticeMember;
  practice: Practice;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function optionalBoolean(body: Record<string, unknown>, key: string): boolean {
  const value = body[key];

  if (value === undefined || value === null) {
    return false;
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
  let cmsEligibilityAttested = false;
  let medicareEnrollmentAttested = false;

  try {
    name = requiredString(body, "name");
    cmsEligibilityAttested = optionalBoolean(body, "cmsEligibilityAttested");
    medicareEnrollmentAttested = optionalBoolean(body, "medicareEnrollmentAttested");
  } catch (error) {
    return badRequest(error);
  }

  try {
    const { supabase, user } = await requireAuthenticatedUser(request);

    if (!hasInitialOwnerClaim(user)) {
      return Response.json({ error: "Initial owner authorization required" }, { status: 403 });
    }

    const { data, error } = await supabase.rpc("bootstrap_first_practice", {
      cms_eligibility_attested: cmsEligibilityAttested,
      medicare_enrollment_attested: medicareEnrollmentAttested,
      practice_name: name,
      practice_slug: `${slugify(name)}-${user.id.slice(0, 8)}`,
    });

    if (error) {
      const status = error.code === "42501" ? 403 : error.code === "22023" ? 400 : 500;
      return Response.json({ error: error.message }, { status });
    }

    return Response.json(data as BootstrapResult, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
