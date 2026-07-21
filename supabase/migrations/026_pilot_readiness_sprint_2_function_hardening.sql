-- Trigger functions are internal implementation details and must not be exposed as RPCs.

revoke all on function public.record_patient_primary_provider_history() from public, anon, authenticated;
revoke all on function public.enforce_provider_staff_practice_match() from public, anon, authenticated;
