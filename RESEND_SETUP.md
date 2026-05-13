# Resend Setup

The confirmation email flow is implemented in the Supabase Edge Function `generate-summary`, but it will only send mail after Resend is configured manually.

## What must be set
- `RESEND_API_KEY` in the Supabase Edge Function environment
- `RESEND_FROM_EMAIL` in the Supabase Edge Function environment
- A verified sender/domain in Resend
- `muskanmaurya2712@gmail.com` is the main mailing mailbox used as `reply_to` and `cc` for the transactional email flow.

## Required Supabase environment
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

## How it works
- The app saves an audit to Supabase.
- The Edge Function generates or loads the cached executive summary.
- If the audit has an email address and mail has not already been sent, the function calls Resend.
- The function records `email_sent_at` after a successful send.

## Test checklist
1. Deploy the database migration that adds `email_sent_at`, `company_name`, `role`, and `lead_team_size`.
2. Deploy the `generate-summary` Edge Function.
3. Set the environment variables above in Supabase.
4. Submit a real audit with a real email address.
5. Confirm the audit row gets `email_sent_at` populated and the inbox receives the message.

## Important behavior
- If Resend is not configured, the audit summary still works.
- Without the Resend variables, confirmation email delivery is skipped intentionally.
