alter table if exists public.audits
add column if not exists public_id uuid default gen_random_uuid() unique;

alter table if exists public.audits
add column if not exists email_sent_at timestamptz;

alter table if exists public.audits
add column if not exists company_name text;

alter table if exists public.audits
add column if not exists role text;

alter table if exists public.audits
add column if not exists lead_team_size integer;

create table if not exists public.audit_submission_rate_limits (
  id uuid primary key default gen_random_uuid(),
  ip_address text not null,
  created_at timestamptz not null default now()
);

create index if not exists audit_submission_rate_limits_ip_created_at_idx
  on public.audit_submission_rate_limits (ip_address, created_at desc);
