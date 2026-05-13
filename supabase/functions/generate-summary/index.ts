const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') ?? '';

type ToolUsage = {
  id: string;
  toolName: string;
  plan: string;
  monthlySpend: number;
  seats: number;
  teamSize: number;
  useCase: string;
};

type SummaryRequestBody = {
  audit_id: string;
  tool_stack: ToolUsage[];
  total_savings: {
    monthly: number;
    annual: number;
  };
};

type AuditRow = {
  id: string;
  executive_summary: string | null;
  tool_stack: ToolUsage[];
  total_monthly_savings: number;
  total_annual_savings: number;
  email: string | null;
  company_name: string | null;
  role: string | null;
  lead_team_size: number | null;
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

const buildPrompt = (toolStack: ToolUsage[], totalSavings: SummaryRequestBody['total_savings']) => {
  return [
    'You are a sharp C-suite analyst for an AI spend audit product.',
    'Write a C-Suite Executive Summary that is strictly under 100 words.',
    'Highlight the biggest waste area and provide exactly one specific strategic move.',
    'Use direct business language, no bullet points, no markdown, no preamble.',
    `Tool stack JSON: ${JSON.stringify(toolStack)}`,
    `Total savings JSON: ${JSON.stringify(totalSavings)}`,
  ].join(' ');
};

const buildEmailBody = (audit: AuditRow, summary: string) => {
  const companyLine = audit.company_name ? `Company: ${audit.company_name}\n` : '';
  const roleLine = audit.role ? `Role: ${audit.role}\n` : '';
  const teamLine = audit.lead_team_size ? `Team size: ${audit.lead_team_size}\n` : '';
  const credexLine = audit.total_monthly_savings > 500
    ? 'Credex will reach out soon for high-savings opportunities.\n'
    : 'We will keep you posted when new optimizations apply to your stack.\n';

  return [
    'Thanks for using AI Spend Audit.',
    '',
    `Total monthly savings: $${audit.total_monthly_savings.toLocaleString('en-US')}`,
    `Total annual savings: $${audit.total_annual_savings.toLocaleString('en-US')}`,
    companyLine.trimEnd(),
    roleLine.trimEnd(),
    teamLine.trimEnd(),
    credexLine.trimEnd(),
    '',
    'Executive summary:',
    summary,
  ].filter(Boolean).join('\n');
};

const maybeSendConfirmationEmail = async (supabase: Awaited<ReturnType<typeof import('npm:@supabase/supabase-js@2').createClient>>, audit: AuditRow, summary: string) => {
  if (!RESEND_API_KEY || !RESEND_FROM_EMAIL || !audit.email || audit.email_sent_at) {
    return;
  }

  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: RESEND_FROM_EMAIL,
      to: [audit.email],
      subject: 'Your AI Spend Audit is ready',
      text: buildEmailBody(audit, summary),
    }),
  });

  if (!emailResponse.ok) {
    const errorText = await emailResponse.text();
    throw new Error(`Resend request failed: ${errorText}`);
  }

  await supabase
    .from('audits')
    .update({ email_sent_at: new Date().toISOString() })
    .eq('id', audit.id);
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: 'Missing server configuration.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { createClient } = await import('npm:@supabase/supabase-js@2');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = (await req.json()) as SummaryRequestBody;

    if (!body.audit_id) {
      return new Response(JSON.stringify({ error: 'audit_id is required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: existingAudit, error: fetchError } = await supabase
      .from('audits')
      .select('id, executive_summary, tool_stack, total_monthly_savings, total_annual_savings, email, company_name, role, lead_team_size, email_sent_at')
      .eq('id', body.audit_id)
      .maybeSingle();

    if (fetchError) {
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!existingAudit) {
      return new Response(JSON.stringify({ error: 'Audit not found.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const audit = existingAudit as AuditRow;

    if (typeof audit.executive_summary === 'string' && audit.executive_summary.length > 0) {
      if (audit.email && !audit.email_sent_at && RESEND_API_KEY && RESEND_FROM_EMAIL) {
        await maybeSendConfirmationEmail(supabase, audit, audit.executive_summary);
      }

      return new Response(
        JSON.stringify({ summary: audit.executive_summary, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const prompt = buildPrompt(body.tool_stack, body.total_savings);

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 220,
        temperature: 0.2,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      return new Response(JSON.stringify({ error: errorText }), {
        status: anthropicResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const anthropicData = (await anthropicResponse.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };

    const rawSummary = anthropicData.content
      ?.filter((message) => message.type === 'text' && typeof message.text === 'string')
      .map((message) => message.text ?? '')
      .join(' ')
      .trim() ?? '';

    const summary = normalizeSummary(rawSummary);

    const { error: updateError } = await supabase
      .from('audits')
      .update({ executive_summary: summary })
      .eq('id', body.audit_id);

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      await maybeSendConfirmationEmail(supabase, {
        ...audit,
        executive_summary: summary,
      }, summary);
    } catch {
      // Keep the summary response working even if email delivery fails.
    }

    return new Response(JSON.stringify({ summary, cached: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
