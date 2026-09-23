-- Trigger functions in the public schema are also exposed as API endpoints.
-- The two security definer ones bypass row-level security, so nobody may call
-- them directly; the triggers still fire, as trigger execution does not check
-- the caller's EXECUTE privilege.
revoke execute on function public.create_profile_for_new_user() from public, anon, authenticated;
revoke execute on function public.record_entry_events() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
