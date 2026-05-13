import { supabase } from './supabaseClient';
import type { AuditRecommendation, ToolUsage } from '../types/index';
import { analyzeToolSpend } from '../features/audit/auditEngine';

export interface LeadDetails {
  company_name?: string | null;
  role?: string | null;
  lead_team_size?: number | null;
}

interface AuditRecordBase extends LeadDetails {
  id: string;
  public_id?: string;
  created_at: string;
  total_monthly_savings: number;
  total_annual_savings: number;
  tool_stack: ToolUsage[];
  executive_summary: string | null;
}

export interface AuditRecord extends AuditRecordBase {
  email: string | null;
  public_id: string;
}

export interface PublicAuditRecord extends AuditRecordBase {}

export interface SavedAuditResult {
  audit: AuditRecord;
  shareUrl: string;
}

export interface SummaryRequest {
  auditId: string;
  toolStack: ToolUsage[];
  totalMonthlySavings: number;
  totalAnnualSavings: number;
}

export interface SavingsData {
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  optimizationScore: number;
  toolCount: number;
  topTool: string;
}

export interface SharedAuditView {
  publicId: string;
  auditId: string;
  createdAt: string;
  toolStack: ToolUsage[];
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  executiveSummary: string | null;
  results: AuditRecommendation[];
  highComplexity: boolean;
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isToolUsage = (value: unknown): value is ToolUsage => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.toolName === 'string' &&
    typeof value.plan === 'string' &&
    typeof value.monthlySpend === 'number' &&
    typeof value.seats === 'number' &&
    typeof value.teamSize === 'number' &&
    typeof value.useCase === 'string'
  );
};

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

export const parseToolStack = (value: unknown): ToolUsage[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isToolUsage);
};

export const normalizeAuditRecord = (record: AuditRecordBase): SharedAuditView => {
  const toolStack = parseToolStack(record.tool_stack);
  const results: AuditRecommendation[] = toolStack.map((tool) => analyzeToolSpend(tool));

  const totalMonthlySavings = toNumber(record.total_monthly_savings);
  const totalAnnualSavings = toNumber(record.total_annual_savings);

  return {
    publicId: typeof record.public_id === 'string' ? record.public_id : record.id,
    auditId: record.id,
    createdAt: record.created_at,
    toolStack,
    totalMonthlySavings,
    totalAnnualSavings,
    executiveSummary: record.executive_summary,
    results,
    highComplexity: toolStack.length > 5,
  };
};

export const buildFallbackSummary = (toolStack: ToolUsage[], totalMonthlySavings: number, totalAnnualSavings: number): string => {
  const primaryTool = toolStack[0]?.toolName ?? 'your stack';
  const toolCount = toolStack.length;
  return `This audit reviewed ${toolCount} tool${toolCount === 1 ? '' : 's'} and identified ${totalMonthlySavings.toLocaleString('en-US')} in monthly savings, or ${totalAnnualSavings.toLocaleString('en-US')} annually. The biggest opportunity is usually concentrated in ${primaryTool}, where plan mix and seat count should be aligned to actual usage. The recommended next step is to right-size the stack, capture the savings, and monitor for future vendor changes.`;
};

export const saveAudit = async (payload: {
  email: string | null;
  company_name: string | null;
  role: string | null;
  lead_team_size: number | null;
  tool_stack: ToolUsage[];
  savingsData: SavingsData;
}): Promise<AuditRecord> => {
  const { data, error } = await supabase.functions.invoke('process-audit', {
    body: {
      email: payload.email,
      companyName: payload.company_name,
      role: payload.role,
      leadTeamSize: payload.lead_team_size,
      toolStack: payload.tool_stack,
      savingsData: payload.savingsData,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data || typeof data !== 'object') {
    throw new Error('No audit returned by the processing service.');
  }

  const audit = (data as { audit?: Record<string, unknown> }).audit;

  if (!audit || typeof audit.id !== 'string') {
    throw new Error('No audit returned by the processing service.');
  }

  return {
    id: audit.id,
    created_at: typeof audit.created_at === 'string' ? audit.created_at : new Date().toISOString(),
    email: typeof audit.email === 'string' ? audit.email : null,
    public_id: typeof audit.public_id === 'string' ? audit.public_id : audit.id,
    company_name: typeof audit.company_name === 'string' ? audit.company_name : null,
    role: typeof audit.role === 'string' ? audit.role : null,
    lead_team_size: typeof audit.lead_team_size === 'number' ? audit.lead_team_size : null,
    total_monthly_savings: toNumber(audit.total_monthly_savings),
    total_annual_savings: toNumber(audit.total_annual_savings),
    tool_stack: parseToolStack(audit.tool_stack),
    executive_summary: typeof audit.executive_summary === 'string' ? audit.executive_summary : null,
  };
};

export const fetchPublicAuditById = async (publicId: string): Promise<PublicAuditRecord | null> => {
  const { data, error } = await supabase
    .from('audits')
    .select('id, public_id, created_at, total_monthly_savings, total_annual_savings, tool_stack, executive_summary')
    .eq('public_id', publicId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    public_id: typeof data.public_id === 'string' ? data.public_id : data.id,
    created_at: data.created_at,
    total_monthly_savings: toNumber(data.total_monthly_savings),
    total_annual_savings: toNumber(data.total_annual_savings),
    tool_stack: parseToolStack(data.tool_stack),
    executive_summary: typeof data.executive_summary === 'string' ? data.executive_summary : null,
  };
};

export const generateSummary = async (request: SummaryRequest): Promise<string> => {
  const { data, error } = await supabase.functions.invoke('generate-summary', {
    body: {
      audit_id: request.auditId,
      tool_stack: request.toolStack,
      total_savings: {
        monthly: request.totalMonthlySavings,
        annual: request.totalAnnualSavings,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data || typeof data.summary !== 'string') {
    throw new Error('No summary returned by the AI service.');
  }

  return data.summary;
};

export const buildShareUrl = (publicId: string): string => {
  return `${window.location.origin}/share/${publicId}`;
};
