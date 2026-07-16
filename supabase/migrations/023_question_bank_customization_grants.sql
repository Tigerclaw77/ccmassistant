-- Allow authenticated customization routes to reach their existing RLS policies.

revoke all on table public.question_bank_override_versions from anon, authenticated;
revoke all on table public.question_bank_custom_question_versions from anon, authenticated;
revoke all on table public.question_bank_favorite_versions from anon, authenticated;
revoke all on table public.question_contribution_candidates from anon, authenticated;

grant select, insert on table public.question_bank_override_versions to authenticated;
grant select, insert on table public.question_bank_custom_question_versions to authenticated;
grant select, insert on table public.question_bank_favorite_versions to authenticated;
grant select, insert, update on table public.question_contribution_candidates to authenticated;

