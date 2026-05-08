// src/features/audit/auditEngine.ts

import type { ToolUsage, AuditRecommendation } from '../../types/index';
import { TOOL_PRICING } from '../../data/pricing';

export const analyzeToolSpend = (usage: ToolUsage): AuditRecommendation => {
  const { toolName, plan, monthlySpend, seats, useCase, teamSize } = usage;
  
  // Standardize the tool name for object lookup
  const toolKey = toolName.toUpperCase().replace(/ /g, '_') as keyof typeof TOOL_PRICING;
  const planKey = plan.toLowerCase();

  // Baseline: Assume the current setup is fine until proven otherwise
  const recommendation: AuditRecommendation = {
    toolName,
    currentSpend: monthlySpend,
    suggestedSpend: monthlySpend,
    potentialSavings: 0,
    action: "Maintain current plan",
    reasoning: "Your current subscription aligns well with your team size and stated use case."
  };

  // --- RULE 1: The "Seat Bloat" (Team vs Individual) ---
  // Financial Logic: Team plans carry a premium for admin controls. 
  // If team size is < 3, the admin overhead isn't worth the premium.
  if ((planKey === 'team' || planKey === 'business') && seats <= 2) {
    let proCost = 20; // Industry standard baseline for Pro
    
    // Attempt to pull exact pro cost if available
    if (TOOL_PRICING[toolKey] && 'pro' in TOOL_PRICING[toolKey]) {
        proCost = (TOOL_PRICING[toolKey] as any).pro;
    } else if (toolKey === 'GITHUB_COPILOT') {
        proCost = TOOL_PRICING.GITHUB_COPILOT.individual;
    }

    const optimalSpend = proCost * seats;
    
    if (optimalSpend < monthlySpend) {
      return {
        toolName,
        currentSpend: monthlySpend,
        suggestedSpend: optimalSpend,
        potentialSavings: monthlySpend - optimalSpend,
        action: `Downgrade to Individual/Pro Plans`,
        reasoning: `Admin features on ${plan} tiers are rarely ROI-positive for teams under 3 people. Transitioning to individual licenses saves cash without feature loss.`
      };
    }
  }

  // --- RULE 2: Use-Case Optimization (Coding) ---
  // Financial Logic: Paying $20 for a general chat UI (ChatGPT/Claude) just for coding is sub-optimal.
  // Dedicated tools (Copilot/Windsurf) are cheaper or provide deeper integration.
  if (useCase === 'coding' && (toolKey === 'CHATGPT' || toolKey === 'CLAUDE') && monthlySpend >= 20) {
    return {
      toolName,
      currentSpend: monthlySpend,
      suggestedSpend: TOOL_PRICING.WINDSURF.pro * seats, // $15
      potentialSavings: monthlySpend - (TOOL_PRICING.WINDSURF.pro * seats),
      action: `Switch to dedicated coding agent (e.g., Windsurf/Copilot)`,
      reasoning: `Using general-purpose LLM UIs for coding is inefficient. Switching to an integrated IDE agent like Windsurf ($15/mo) or Copilot ($10/mo) reduces spend and improves workflow.`
    };
  }

  // --- RULE 3: API Arbitrage (Light Usage) ---
  // Financial Logic: Fixed $20/mo subscriptions are a waste for infrequent usage (Research/Writing).
  // API direct usage for these tasks rarely exceeds $5/mo.
  if ((useCase === 'research' || useCase === 'writing') && monthlySpend >= 20 && planKey !== 'api_direct') {
    return {
      toolName,
      currentSpend: monthlySpend,
      suggestedSpend: 5 * seats, // Estimated API spend
      potentialSavings: monthlySpend - (5 * seats),
      action: `Migrate to API Direct`,
      reasoning: `For text-heavy, intermittent tasks like ${useCase}, usage-based API billing is highly economical. You are likely overpaying for a fixed $20/mo UI subscription.`
    };
  }

  // --- RULE 4: Tool Specific - Cursor Overspend ---
  if (toolKey === 'CURSOR' && planKey === 'business' && seats === 1) {
    return {
      toolName,
      currentSpend: monthlySpend,
      suggestedSpend: TOOL_PRICING.CURSOR.pro,
      potentialSavings: monthlySpend - TOOL_PRICING.CURSOR.pro,
      action: `Downgrade to Cursor Pro`,
      reasoning: `Cursor Business ($40/mo) includes centralized billing and privacy toggles meant for large orgs. A solo developer achieves the same code output on the $20 Pro tier.`
    };
  }

  return recommendation;
};