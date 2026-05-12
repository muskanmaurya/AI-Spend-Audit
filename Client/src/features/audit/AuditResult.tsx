import type { AuditRecommendation, ToolUsage } from '../../types/index';
import { LeadCapture } from './LeadCapture';

interface AuditResultsProps {
  auditData: {
    results: AuditRecommendation[];
    totalMonthlySavings: number;
    totalAnnualSavings: number;
  };
  toolStack?: ToolUsage[];
  onBack: () => void;
}

export const AuditResults = ({ auditData, toolStack = [], onBack }: AuditResultsProps) => {
  const { results, totalMonthlySavings, totalAnnualSavings } = auditData;
  const formatMoney = (amount: number) => amount.toLocaleString('en-US');
  
  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      {/* High Savings Trigger Banner */}
      {totalMonthlySavings > 500 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 flex items-center justify-between shadow-sm">
          <p className="text-blue-800 text-sm font-medium">
            🚀 <strong>High Savings Detected!</strong> Credex can help you capture these savings faster.
          </p>
          <button className="bg-blue-600 text-white text-xs px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition">
            Talk to an Expert
          </button>
        </div>
      )}

      {/* Hero Section: The "Wow" Factor */}
      <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-2xl p-8 text-white text-center shadow-xl">
        <h2 className="text-2xl font-medium opacity-90">Total Annual Savings</h2>
        <p className="text-6xl font-black mt-2">${formatMoney(totalAnnualSavings)}</p>
        <div className="mt-4 inline-block bg-white/20 px-4 py-1 rounded-full text-sm">
          That's ${formatMoney(totalMonthlySavings)}/month back in your pocket
        </div>
      </div>

      {/* Individual Breakdown Cards */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-800 px-2">Breakdown by Tool</h3>
        {results.map((res, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-start gap-4 justify-between">
              {/* Left: Tool info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-lg font-bold text-blue-600">{res.toolName}</h4>
                <p className="text-gray-600 mt-1 text-sm leading-relaxed">{res.reasoning}</p>
              </div>

              {/* Right: Savings badge - flex-shrink-0 to prevent wrapping */}
              <div className="flex-shrink-0 ml-4">
                <span className={`inline-flex whitespace-nowrap text-sm font-bold px-3 py-1 rounded-full ${res.potentialSavings > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {res.potentialSavings > 0 ? `Save $${formatMoney(res.potentialSavings)}/mo` : 'Optimized'}
                </span>
              </div>
            </div>
            
            {/* Action Section */}
            {res.potentialSavings > 0 && (
              <div className="mt-4 pt-4 border-t border-dashed border-gray-100 flex items-start gap-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex-shrink-0">Action:</span>
                <span className="text-sm font-semibold text-gray-700">{res.action}</span>
              </div>
            )}
          </div>
        ))}
      </div>
      {/* Lead Capture Section */}
      <LeadCapture
        totalMonthlySavings={totalMonthlySavings}
        totalAnnualSavings={totalAnnualSavings}
        toolStack={toolStack}
      />

      {/* Navigation Controls */}
      <div className="mt-8 flex justify-center">
        <button 
          onClick={onBack}
          className="text-gray-500 hover:text-gray-800 font-medium transition"
        >
          ← Edit my stack
        </button>
      </div>
    </div>
  );
};