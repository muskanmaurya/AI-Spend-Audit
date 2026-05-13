# User Interview Notes

## Interview 1 — The Developer
- Role: Developer (individual contributor)
- Focus: Tool stack and daily workflows
- Feedback: "I use 4 tools; the dashboard helped me realize I didn't need Claude Pro AND ChatGPT Plus."

## Interview 2 — Finance / Ops
- Role: Finance / Operations
- Focus: Audit Engine defensibility
- Feedback: "I like that the math is based on real pricing pages, not just AI guesses."

## Interview 3 — Solo Founder
- Role: Solo Founder / Early-stage founder
- Focus: Lead Capture UX
- Feedback: "The UI feels premium enough that I’d actually give my email for a full report."

### Action Items (implemented)
1. Added a `Clear Stack` button with a confirmation prompt to reduce clutter and give users explicit control over resetting their inputs (Responding to Interview 3 feedback on perceived clutter).
2. Hardened the `Audit Engine` to use published pricing sources and deterministic rules; updated `PRICING_DATA.md` with direct pricing links to ensure accuracy and defensibility (Responding to Interview 2).
3. Upgraded the Lead Capture UI to a premium-looking, accessible form with a honeypot field and loading state, and persisted audits to Supabase (Responding to Interview 3 confidence request).
