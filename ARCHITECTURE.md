 # System Architecture - AI Spend Audit

 ## 1. High-Level System Diagram
 ```mermaid
 graph TD
     User((User)) -->|Inputs Tool Spend| ReactApp[React SPA - Vite]
     ReactApp -->|Persistence| LocalStorage[(Local Storage)]
     ReactApp -->|Compute| AuditEngine[Audit Logic Engine]
     AuditEngine -->|Generated Audit| ReactApp
     ReactApp -->|Lead Data + Audit| Supabase[(Supabase Backend - Postgres + Edge Functions)]
     ReactApp -->|Request AI Summary| EdgeFn[Supabase Edge Function: generate-summary]
     EdgeFn -->|Calls (server)| Anthropic[Anthropic API (Claude / Sonnet)]
     Supabase -->|Transactional Email| Resend[Resend API]
 ```

 ## 2. Component Responsibilities
 - **React SPA (Vite):** Collects user inputs, renders the audit, manages local state and share flow.
 - **Audit Engine:** Deterministic TypeScript module that applies defensible pricing rules and recommends actions.
 - **LocalStorage:** Persists `entries` and `showResults` to survive reloads.
 - **Supabase (Postgres + Edge Functions):** Stores `audits` (with `tool_stack` as `jsonb`), runs the `generate-summary` Edge Function, and sends transactional emails.
 - **Edge Function `generate-summary`:** Receives audit payload, checks cache (saved `executive_summary`), calls Anthropic securely if needed, stores the summary, and returns it to the client.

 ## 3. Security Disclosure
 - **API Key Protection:** The Anthropic API key is stored in the environment of the Supabase Edge Function and is never exposed to the browser. The client calls the Edge Function (`/functions/v1/generate-summary`) which proxies the request server-side.
 - **Caching & Cost Control:** The Edge Function checks the `executive_summary` column in Postgres and returns it if already present to avoid repeated API calls and unnecessary costs.
 - **Honeypot Anti-Spam:** The Lead Capture form includes a hidden `website` field (honeypot). Submissions where the honeypot is populated are treated as bots and ignored.
 - **Least Privilege:** Client-side operations use the Supabase anon key for reads/inserts; server-side updates (executive summary writes) are performed in the Edge Function using a service role key.
