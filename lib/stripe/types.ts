import type { ISODateTimeString, UUID } from "../ccm/types";

export type PracticeBillingAccount = {
  practice_id: UUID;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  active_price_ids: string[];
  current_patient_quantity: number;
  current_period_end: ISODateTimeString | null;
  cancel_at_period_end: boolean;
  created_at: ISODateTimeString;
  updated_at: ISODateTimeString;
};
export type StripeWebhookEventRecord = {
  stripe_event_id: string;
  event_type: string;
  livemode: boolean;
  processing_status: "processing" | "completed" | "failed";
  attempt_count: number;
  last_error_code: string | null;
  received_at: ISODateTimeString;
  processed_at: ISODateTimeString | null;
  updated_at: ISODateTimeString;
};
