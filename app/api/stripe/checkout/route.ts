import { authErrorResponse, createServiceRoleSupabaseClient } from "../../../../lib/auth";
import { badRequest, readJsonObject, requiredString } from "../../../../lib/api/json";
import { requirePracticeBillingAdmin } from "../../../../lib/stripe/authorization";
import {
  createSupabaseStripeBillingStore,
  getOrCreateStripeCustomer,
} from "../../../../lib/stripe/billing";
import { buildPracticeCheckoutSession } from "../../../../lib/stripe/checkout";
import { getStripeClient } from "../../../../lib/stripe/client";
import {
  loadStripeServerConfig,
  StripeConfigurationError,
} from "../../../../lib/stripe/config";

const INACTIVE_SUBSCRIPTION_STATUSES = new Set(["canceled", "incomplete_expired"]);

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
    const { supabase } = await requirePracticeBillingAdmin(request, practiceId);
    const { count: patientCount, error: patientCountError } = await supabase
      .from("patients")
      .select("id", { count: "exact", head: true })
      .eq("practice_id", practiceId)
      .eq("status", "active");
    if (patientCountError) throw new Error(patientCountError.message);

    const config = loadStripeServerConfig(process.env, { appUrl: true, prices: true });
    const stripe = getStripeClient();
    const store = createSupabaseStripeBillingStore(createServiceRoleSupabaseClient());
    const customerId = await getOrCreateStripeCustomer(stripe, store, practiceId);

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 10,
      status: "all",
    });
    if (subscriptions.data.some((item) => !INACTIVE_SUBSCRIPTION_STATUSES.has(item.status))) {
      return Response.json(
        { error: "This practice already has a Stripe subscription" },
        { status: 409 },
      );
    }

    const session = await stripe.checkout.sessions.create(
      buildPracticeCheckoutSession({
        config,
        customerId,
        patientCount: patientCount ?? 0,
        practiceId,
      }),
    );

    if (!session.url) throw new Error("Stripe Checkout did not return a URL");
    return Response.json({ checkoutUrl: session.url, mode: session.mode, sessionId: session.id });
  } catch (error) {
    return stripeRouteError(error);
  }
}
