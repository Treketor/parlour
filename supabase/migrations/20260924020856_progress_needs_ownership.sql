-- Progress is what you have done with a copy you own (DECISIONS.md 038):
-- a game you only want, or passed on, stays at "want to play".
-- NOT VALID: rows written before this rule are left as they are, and the
-- app offers the fix (mark it owned) the next time the entry is opened.
alter table public.library_entries
  add constraint library_entries_progress_needs_ownership
  check (ownership = 'owned' or progress = 'want_to_play') not valid;
