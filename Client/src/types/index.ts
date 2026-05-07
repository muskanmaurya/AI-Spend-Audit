export type AIPlan = 'Free' | 'Pro' | 'Team' | 'Enterprise' | 'Usage-Based';

export interface ToolUsage {
  id: string;
  toolName: string;
  plan: string; 
  monthlySpend: number;
  seats: number;
  teamSize: number; // Added this
  useCase: 'coding' | 'writing' | 'data' | 'research' | 'mixed'; // Be specific here
}

export interface AuditRecommendation {
  toolName: string;
  currentSpend: number;
  suggestedSpend: number;
  potentialSavings: number;
  action: string; // e.g., "Switch to Claude Pro"
  reasoning: string;
}