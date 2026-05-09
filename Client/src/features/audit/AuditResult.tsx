import type { AuditRecommendation } from '../../types/index';

interface AuditResultsProps {
  auditData: {
    results: AuditRecommendation[];
    totalMonthlySavings: number;
    totalAnnualSavings: number;
  };
  onBack: () => void;
}

export const AuditResults = ({ auditData, onBack }: AuditResultsProps) => {
  const { results, totalMonthlySavings, totalAnnualSavings } = auditData;

  return (
    <div className="animate-in fade-in duration-500">
      {/* 1. Hero Section: The "Wow" Factor */}
      <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-2xl p-8 text-white text-center mb-8 shadow-xl">
        <h2 className="text-2xl font-medium opacity-90">Total Annual Savings</h2>
        <p className="text-6xl font-black mt-2">${totalAnnualSavings.toLocaleString()}</p>
        <div className="mt-4 inline-block bg-white/20 px-4 py-1 rounded-full text-sm">
          That's ${totalMonthlySavings} back in your pocket every month
        </div>
      </div>

      {/* 2. Individual Breakdown Cards */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-800 px-2">Breakdown by Tool</h3>
        {results.map((res, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-lg font-bold text-blue-600">{res.toolName}</h4>
                <p className="text-gray-600 mt-1">{res.reasoning}</p>
              </div>
              <div className="text-right">
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${res.potentialSavings > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {res.potentialSavings > 0 ? `Save $${res.potentialSavings}/mo` : 'Optimized'}
                </span>
              </div>
            </div>
            
            {res.potentialSavings > 0 && (
              <div className="mt-4 pt-4 border-t border-dashed border-gray-100 flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Action:</span>
                <span className="text-sm font-semibold text-gray-700">{res.action}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 3. Navigation Controls */}
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