-- Blueprint Studio — owner's name, collected at sign-up/onboarding and used
-- for the dashboard's "Welcome back, <first name>" greeting instead of the
-- business name (a client request - it read as impersonal addressing the
-- owner by their own company's name).

alter table businesses add column owner_name text not null default '';
