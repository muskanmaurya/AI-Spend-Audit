

import { useState } from 'react'; // Add useState
import { useAuditManager } from './features/audit/AuditManager';
import { AuditForm } from './features/audit/AuditForm';
import { AuditResults } from './features/audit/AuditResult'; // Import your new component

function App() {
  const { entries, addEntry, removeEntry, getFullAudit } = useAuditManager();
  
  // 1. Create a "View" state to track which page we are on
  const [showResults, setShowResults] = useState(false);

  // 2. Wrap the view logic
  if (showResults) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto">
          <AuditResults 
            auditData={getFullAudit()} 
            onBack={() => setShowResults(false)} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-black text-gray-900 tracking-tight">AI Spend Audit</h1>
          <p className="mt-3 text-lg text-gray-600">Stop overpaying for AI licenses today.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-2">
            <AuditForm onAddTool={addEntry} />
          </div>

          <div className="md:col-span-3 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Your Current Stack</h2>
            
            {entries.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-xl">
                <p className="text-gray-400">Add your first tool to begin...</p>
              </div>
            ) : (
              <>
                <ul className="space-y-4 mb-8">
                  {entries.map(tool => (
                    <li key={tool.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div>
                        <p className="font-bold text-gray-800">{tool.toolName}</p>
                        <p className="text-sm text-gray-500">{tool.plan} • {tool.seats} seats</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono font-bold">${tool.monthlySpend}</span>
                        <button onClick={() => removeEntry(tool.id)} className="text-red-400 hover:text-red-600 text-sm font-bold">Remove</button>
                      </div>
                    </li>
                  ))}
                </ul>

                <button 
                  onClick={() => setShowResults(true)} // Toggle the view here!
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-xl shadow-lg shadow-green-200 transition-all active:scale-[0.98]"
                >
                  Analyze My Savings →
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;