# System Architecture - AI Spend Audit

## 1. High-Level System Diagram
```mermaid
graph TD
    User((User)) -->|Inputs Tool Spend| ReactApp[React SPA - Vite]
    ReactApp -->|Persistence| LocalStorage[(Local Storage)]
    ReactApp -->|Compute| AuditEngine[Audit Logic Engine]
    AuditEngine -->|Generated Audit| ReactApp
    ReactApp -->|Lead Data + Audit| Supabase[(Supabase Backend)]
    Supabase -->|Transactional Email| Resend[Resend API]

    ## 5. Audit Engine Design: Deterministic Math vs. AI
The core audit math is strictly deterministic (hardcoded TypeScript rules) rather than AI-driven. 
* **Defensibility:** Financial audits require 100% predictability and auditability. If a user is told to downgrade a plan to save $240/year, the engine must perfectly trace that calculation back to public pricing data. AI hallucination in financial calculations breaks user trust.
* **AI Delegation:** LLMs are reserved exclusively for the qualitative "Executive Summary" generation (Feature 4), utilizing Supabase Edge Functions to securely interface with the Anthropic API.

## 6. State Management Strategy
I opted for a custom hook (`useAuditManager`) paired with `localStorage` rather than immediate database writes. 
* **Frictionless UX:** Users can build their stack instantly without latency.
* **Cost Efficiency:** It prevents database bloat by only writing to Supabase (the `audits` table) *after* the user sees value and opts into the lead capture form.