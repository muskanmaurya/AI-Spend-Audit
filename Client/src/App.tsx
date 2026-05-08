// import {useAuditManager} from './features/audit/AuditManager.tsx';


// function App() {
//   const { entries, addEntry, getFullAudit } = useAuditManager();

//   return (
//     <div className="min-h-screen bg-gray-50 py-10">
//       <div className="max-w-4xl mx-auto px-4">
        
//         {/* Header */}
//         <div className="text-center mb-10">
//           <h1 className="text-4xl font-bold text-gray-900 mb-2">AI Spend Audit</h1>
//           <p className="text-gray-600">Optimize your AI tool stack and stop overpaying.</p>
//         </div>

//         {/* The Form */}
//         <AuditForm onAdd={addEntry} />

//         {/* Temporary list view to prove it works */}
//         <div className="mt-10">
//           <h3 className="text-lg font-semibold mb-3">Currently Added Tools ({entries.length})</h3>
//           <pre className="bg-gray-800 text-white p-4 rounded-lg text-sm overflow-auto">
//             {JSON.stringify(getFullAudit(), null, 2)}
//           </pre>
//         </div>

//       </div>
//     </div>
//   );
// }

// export default App;

import { useAuditManager } from './features/audit/AuditManager';
import { AuditForm } from './features/audit/AuditForm';

function App() {
  const { entries, addEntry, getFullAudit } = useAuditManager();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900">AI Spend Audit</h1>
          <p className="mt-2 text-gray-600">Optimize your tech stack and save thousands.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: The Form */}
          <div>
            <AuditForm onAddTool={addEntry} />
          </div>

          {/* Right Column: Preview of added tools (Temporary for Day 3) */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-xl font-bold mb-4">Your Stack ({entries.length} Tools)</h2>
            {entries.length === 0 ? (
              <p className="text-gray-500 text-sm">No tools added yet. Add a tool to begin the audit.</p>
            ) : (
              <ul className="space-y-3">
                {entries.map(tool => (
                  <li key={tool.id} className="border-b pb-2">
                    <span className="font-semibold">{tool.toolName}</span> - {tool.plan} 
                    <span className="text-gray-500 text-sm block">Spend: ${tool.monthlySpend} | Seats: {tool.seats}</span>
                  </li>
                ))}
              </ul>
            )}
            
            {entries.length > 0 && (
              <button 
                onClick={() => console.log(getFullAudit())}
                className="mt-6 w-full bg-green-600 text-white font-semibold py-2 px-4 rounded hover:bg-green-700 transition"
              >
                Generate Audit Report (Check Console)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;