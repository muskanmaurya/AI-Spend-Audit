alter table if exists public.audits
add column if not exists executive_summary text;

alter table if exists public.audits
add column if not exists company_name text;

alter table if exists public.audits
add column if not exists role text;

alter table if exists public.audits
add column if not exists lead_team_size integer;

alter table if exists public.audits
add column if not exists email_sent_at timestamptz;
