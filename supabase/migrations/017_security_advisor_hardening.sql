-- Keep trigger helpers off the exposed RPC surface and pin mutable paths.

alter function public.set_updated_at() set search_path = public;
alter function public.prevent_immutable_record_change() set search_path = public;

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.prevent_immutable_record_change() from public, anon, authenticated;
revoke all on function public.enforce_patient_practice_match() from public, anon, authenticated;
revoke all on function public.enforce_question_bank_scope_owner() from public, anon, authenticated;
