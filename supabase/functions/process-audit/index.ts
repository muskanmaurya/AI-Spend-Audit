const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-1.5-flash';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') ?? 'AI Spend Audit <onboarding@resend.dev>';
const MAIN_MAILING_EMAIL = 'muskanmaurya2712@gmail.com';

type ToolUsage = {
  id: string;
  toolName: string;
  plan: string;
  monthlySpend: number;
  seats: number;
  teamSize: number;
  useCase: string;
};

type SavingsData = {
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  optimizationScore: number;
  toolCount: number;
  topTool: string;
};

type ProcessAuditRequest = {
  email: string | null;
  companyName: string | null;
  role: string | null;
  leadTeamSize: number | null;
  toolStack: ToolUsage[];
  savingsData: SavingsData;
};

type AuditRow = {
  id: string;
  public_id: string;
  created_at: string;
  email: string | null;
  company_name: string | null;
  role: string | null;
  lead_team_size: number | null;
  tool_stack: ToolUsage[];
  total_monthly_savings: number;
  total_annual_savings: number;
  executive_summary: string | null;
  email_sent_at: string | null;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const normalizeSummary = (summary: string): string => {
  const words = summary.trim().split(/\s+/);
  return words.length <= 100 ? summary.trim() : words.slice(0, 100).join(' ');
};

const buildGeminiPrompt = (toolStack: ToolUsage[], savingsData: SavingsData) => {
  return [
    'You are a professional CFO. Review this tool list: {{toolStack}}. The user is saving ${{totalAnnualSavings}} annually. Write a strictly <100-word executive summary. Highlight the single biggest efficiency leak and one strategic consolidation move. Tone: Data-driven and concise.',
    `Tool list JSON: ${JSON.stringify(toolStack)}`,
    `Savings JSON: ${JSON.stringify(savingsData)}`,
  ].join(' ');
};

const buildFallbackSummary = (savingsData: SavingsData): string => {
  return `Your audit of ${savingsData.toolCount} tools identified $${savingsData.totalAnnualSavings.toLocaleString('en-US')} in potential annual savings. Primarily driven by plan optimization for ${savingsData.topTool}, your stack is currently ${savingsData.optimizationScore}% efficient.`;
};

const buildEmailBody = (audit: AuditRow, publicUrl: string) => {
  const credexFooter = audit.total_monthly_savings > 500
    ? '\nOur partners at Credex have been notified of your high savings potential and will reach out to help you automate these migrations.'
    : '';

  return [
    'Your AI Audit Results',
    '',
    `Hero monthly savings: $${audit.total_monthly_savings.toLocaleString('en-US')}`,
    `Hero annual savings: $${audit.total_annual_savings.toLocaleString('en-US')}`,
    '',
    'AI Summary:',
    audit.executive_summary ?? '',
    '',
    `View your public report: ${publicUrl}`,
    credexFooter,
  ].filter(Boolean).join('\n');
};

const getRequestIp = (request: Request): string => {
  const forwardedFor = request.headers.get('x-forwarded-for') ?? request.headers.get('cf-connecting-ip') ?? request.headers.get('x-real-ip') ?? '';
  return forwardedFor.split(',')[0]?.trim() || 'unknown';
};

const assertRateLimit = async (supabase: any, requestIp: string) => {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from('audit_submission_rate_limits')
    .select('id', { count: 'exact', head: true })
    .eq('ip_address', requestIp)
    .gte('created_at', hourAgo);

  if (error) {
    throw new Error(error.message);
  }

  if ((count ?? 0) >= 3) {
    const rateLimitError = new Error('Rate limit exceeded. Please try again later.');
    (rateLimitError as Error & { status?: number }).status = 429;
    throw rateLimitError;
  }

  const { error: insertError } = await supabase.from('audit_submission_rate_limits').insert({ ip_address: requestIp });
  if (insertError) {
    throw new Error(insertError.message);
  }
};

const maybeSendConfirmationEmail = async (supabase: any, audit: AuditRow, publicUrl: string) => {
  if (!RESEND_API_KEY || !audit.email || audit.email_sent_at) {
    return false;
  }

  const body = buildEmailBody(audit, publicUrl);

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: RESEND_FROM_EMAIL,
      to: [audit.email],
      cc: [MAIN_MAILING_EMAIL],
      reply_to: MAIN_MAILING_EMAIL,
      subject: 'Your AI Audit Results',
      text: body,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend request failed: ${errorText}`);
  }

  await supabase
    .from('audits')
    .update({ email_sent_at: new Date().toISOString() })
    .eq('id', audit.id);

  return true;
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'Missing server configuration.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { createClient } = await import('npm:@supabase/supabase-js@2');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = (await request.json()) as ProcessAuditRequest;

    if (!body.toolStack || !body.savingsData) {
      return new Response(JSON.stringify({ error: 'toolStack and savingsData are required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const requestIp = getRequestIp(request);
    await assertRateLimit(supabase, requestIp);

    const publicId = crypto.randomUUID();
    const prompt = buildGeminiPrompt(body.toolStack, body.savingsData);

    let summary = buildFallbackSummary(body.savingsData);

    try {
      const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 220,
          },
        }),
      });

      if (geminiResponse.ok) {
        const geminiData = (await geminiResponse.json()) as {
          candidates?: Array<{
            content?: {
              parts?: Array<{ text?: string }>;
            };
          }>;
        };

        const rawSummary = geminiData.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join(' ').trim() ?? '';
        summary = rawSummary ? normalizeSummary(rawSummary) : summary;
      }
    } catch {
      summary = buildFallbackSummary(body.savingsData);
    }

    const auditInsert: Omit<AuditRow, 'id' | 'created_at' | 'email_sent_at'> = {
      public_id: publicId,
      email: body.email,
      company_name: body.companyName,
      role: body.role,
      lead_team_size: body.leadTeamSize,
      tool_stack: body.toolStack,
      total_monthly_savings: body.savingsData.totalMonthlySavings,
      total_annual_savings: body.savingsData.totalAnnualSavings,
      executive_summary: summary,
    };

    const { data: insertedAudit, error: insertError } = await supabase
      .from('audits')
      .insert(auditInsert)
      .select('id, public_id, created_at, email, company_name, role, lead_team_size, tool_stack, total_monthly_savings, total_annual_savings, executive_summary, email_sent_at')
      .single();

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const audit = insertedAudit as AuditRow;

    let emailSent = false;
    try {
      emailSent = await maybeSendConfirmationEmail(supabase, audit, `${new URL(request.url).origin}/share/${audit.public_id}`);
    } catch (emailError) {
      const emailMessage = emailError instanceof Error ? emailError.message : 'Email delivery failed.';
      return new Response(JSON.stringify({
        audit,
        public_url: `${new URL('/share', request.url).origin}/share/${audit.public_id}`,
        summary,
        email_sent: false,
        email_error: emailMessage,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      audit,
      public_url: `${new URL('/share', request.url).origin}/share/${audit.public_id}`,
      summary,
      email_sent: emailSent,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const status = typeof error === 'object' && error !== null && 'status' in error && typeof (error as { status?: number }).status === 'number'
      ? (error as { status: number }).status
      : 500;
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
