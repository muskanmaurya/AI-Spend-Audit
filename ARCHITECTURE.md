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