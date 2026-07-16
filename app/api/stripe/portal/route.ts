import { authErrorResponse, createServiceRoleSupabaseClient } from "../../../../lib/auth";
import { badRequest, readJsonObject, requiredString } from "../../../../lib/api/json";
import { requirePracticeBillingAdmin } from "../../../../lib/stripe/authorization";
import { createSupabaseStripeBillingStore } from "../../../../lib/stripe/billing";
import { getStripeClient } from "../../../../lib/stripe/client";
import {
  loadStripeServerConfig,
  StripeConfigurationError,
} from "../../../../lib/stripe/config";

function stripeRouteError(error: unknown): Response {
  if (error instanceof StripeConfigurationError) {
    return Response.json({ error: error.message }, { status: 503 });
  }
  return authErrorResponse(error);
}

export async function POST(request: Request) {
  let body;
  try {
    body = await readJsonObject(request);
  } catch (error) {
    return badRequest(error);
  }

  let practiceId: string;
  try {
    practiceId = requiredString(body, "practiceId");
  } catch (error) {
    return badRequest(error);
  }

  try {
    await requirePracticeBillingAdmin(request, practiceId);
    const config = loadStripeServerConfig(process.env, { appUrl: true });
    const stripe = getStripeClient();
    const store = createSupabaseStripeBillingStore(createServiceRoleSupabaseClient());
    const account = await store.getAccount(practiceId);
    if (!account?.stripe_customer_id) {
      return Response.json({ error: "Stripe customer is not configured" }, { status: 404 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: account.stripe_customer_id,
      return_url: `${config.appUrl}/settings`,
    });
    return Response.json({ portalUrl: session.url });
  } catch (error) {
    return stripeRouteError(error);
  }
}
