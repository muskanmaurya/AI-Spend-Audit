import { useState } from 'react';
import type { AuditRecommendation, ToolUsage } from '../../types/index';
import { LeadCapture } from './LeadCapture';
import type { SavingsData } from '../../lib/auditService';

interface AuditResultsProps {
  auditData: {
    results: AuditRecommendation[];
    totalMonthlySavings: number;
    totalAnnualSavings: number;
  };
  auditId?: string | null;
  shareUrl?: string | null;
  readOnly?: boolean;
  summaryLoading?: boolean;
  executiveSummary?: string | null;
  toolStack?: ToolUsage[];
  savingsData?: SavingsData;
  onBack?: () => void;
  onAuditSaved?: (audit: import('../../lib/auditService').AuditRecord) => void;
}

export const AuditResults = ({
  auditData,
  auditId,
  shareUrl,
  readOnly = false,
  summaryLoading = false,
  executiveSummary = null,
  toolStack = [],
  savingsData,
  onBack,
  onAuditSaved,
}: AuditResultsProps) => {
  const { results, totalMonthlySavings, totalAnnualSavings } = auditData;
  const formatMoney = (amount: number) => amount.toLocaleString('en-US');
  const highComplexity = results.length > 5;
  const resolvedShareUrl = shareUrl ?? (auditId ? `${window.location.origin}/share/${auditId}` : window.location.href);
  const canShare = Boolean(auditId ?? shareUrl);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const isLowSavings = totalMonthlySavings < 100;
  const highSavings = totalMonthlySavings > 500;

  const handleShare = async () => {
    const title = 'My AI Savings Report';
    const message = `I saved $${formatMoney(totalMonthlySavings)} on my AI stack!`;

    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: message,
          url: resolvedShareUrl,
        });
      } else {
        await navigator.clipboard.writeText(resolvedShareUrl);
      }

      setToastMessage('Link Copied!');
      window.setTimeout(() => setToastMessage(null), 2000);
    } catch {
      try {
        await navigator.clipboard.writeText(resolvedShareUrl);
        setToastMessage('Link Copied!');
        window.setTimeout(() => setToastMessage(null), 2000);
      } catch {
        setToastMessage('Sharing unavailable.');
        window.setTimeout(() => setToastMessage(null), 2000);
      }
    }
  };
  
  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      {/* High Savings Trigger Banner */}
      {highSavings && (
        <div className="bg-blue-600 rounded-xl p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between shadow-sm text-white">
          <p className="text-sm font-medium leading-6">
            🚀 <strong>High Savings Detected!</strong>{' '}
            {highComplexity
              ? 'Your stack is complex. Credex experts can manage these migrations for you.'
              : 'Our partners at Credex can help you automate these savings.'}
          </p>
          <button className="bg-white text-blue-700 text-xs px-4 py-2 rounded-lg font-bold hover:bg-blue-50 transition self-start">
            Claim your savings with Credex
          </button>
        </div>
      )}

      {/* AI Summary */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h3 className="text-xl font-bold text-gray-900">C-Suite Executive Summary</h3>
          <div className="flex items-center gap-3">
            {canShare && (
              <button
                onClick={handleShare}
                className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-600 hover:border-blue-300 hover:text-blue-700 transition"
              >
                Share My Report
              </button>
            )}
            {!readOnly && onBack && (
              <button onClick={onBack} className="text-gray-500 hover:text-gray-800 font-medium transition">
                ← Edit my stack
              </button>
            )}
          </div>
        </div>

        {summaryLoading ? (
          <div className="space-y-3" aria-label="Generating AI insights">
            <div className="h-4 w-full rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-pulse" />
            <div className="h-4 w-11/12 rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-pulse" />
            <div className="h-4 w-4/5 rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-pulse" />
            <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm font-medium text-gray-500">
              Generating AI Insights...
            </div>
          </div>
        ) : executiveSummary ? (
          <p className="text-gray-700 leading-7">{executiveSummary}</p>
        ) : (
          <p className="text-gray-500 leading-7">
            {readOnly ? 'No AI summary is available for this report yet.' : 'Save this audit to generate your executive summary.'}
          </p>
        )}
      </section>

      {/* Hero Section: The "Wow" Factor */}
      <div className={`${isLowSavings ? 'bg-slate-100 text-slate-800' : 'bg-gradient-to-r from-green-600 to-green-500 text-white'} rounded-2xl p-8 text-center shadow-xl`}>
        <h2 className="text-2xl font-medium opacity-90">Total Annual Savings</h2>
        <p className="text-6xl font-black mt-2">${formatMoney(totalAnnualSavings)}</p>
        <div className={`mt-4 inline-block px-4 py-2 rounded-full text-sm ${isLowSavings ? 'bg-white/70 text-slate-700' : 'bg-white/20'}`}>
          {isLowSavings
            ? "You're spending well. We'll notify you if new optimizations arise."
            : `That's $${formatMoney(totalMonthlySavings)}/month back in your pocket`}
        </div>
      </div>

      {/* Individual Breakdown Cards */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-800 px-2">Breakdown by Tool</h3>
        {results.map((res, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h4 className="text-lg font-bold text-blue-600">{res.toolName}</h4>
                <p className="text-gray-600 mt-1 text-sm leading-relaxed">{res.reasoning}</p>
              </div>

              <div className="flex-shrink-0 ml-4">
                <span className={`inline-flex whitespace-nowrap text-sm font-bold px-3 py-1 rounded-full ${res.potentialSavings > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {res.potentialSavings > 0 ? `Save $${formatMoney(res.potentialSavings)}/mo` : 'Optimized'}
                </span>
              </div>
            </div>
            
            {res.potentialSavings > 0 && (
              <div className="mt-4 pt-4 border-t border-dashed border-gray-100 flex items-start gap-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex-shrink-0">Action:</span>
                <span className="text-sm font-semibold text-gray-700">{res.action}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {!readOnly && (
        <LeadCapture
          toolStack={toolStack}
          savingsData={savingsData ?? {
            totalMonthlySavings,
            totalAnnualSavings,
            optimizationScore: 100,
            toolCount: toolStack.length,
            topTool: toolStack[0]?.toolName ?? 'your stack',
          }}
          onAuditSaved={onAuditSaved}
        />
      )}

      {toastMessage && (
        <div className="fixed bottom-6 right-6 rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-lg">
          {toastMessage}
        </div>
      )}

      {!readOnly && onBack && (
        <div className="mt-8 flex justify-center">
          <button onClick={onBack} className="text-gray-500 hover:text-gray-800 font-medium transition">
            ← Edit my stack
          </button>
        </div>
      )}
    </div>
  );
};