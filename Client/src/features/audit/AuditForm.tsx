import { useState } from 'react';
import type { ToolUsage } from '../../types/index';
import { TOOL_PLAN_MAP, USE_CASES } from '../../data/toolOptions';

interface AuditFormProps {
  onAddTool: (tool: ToolUsage) => void;
}

export const AuditForm = ({ onAddTool }: AuditFormProps) => {
  // Local state for the form fields
  const [toolName, setToolName] = useState("ChatGPT");
  const [plan, setPlan] = useState("Plus");
  const [monthlySpend, setMonthlySpend] = useState<number | "">("");
  const [seats, setSeats] = useState<number>(1);
  const [teamSize, setTeamSize] = useState<number>(1);
  const [useCase, setUseCase] = useState<ToolUsage['useCase']>("coding");

  // When a user changes the tool, automatically update the available plans
  const handleToolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTool = e.target.value;
    setToolName(selectedTool);
    setPlan(TOOL_PLAN_MAP[selectedTool][0]); // Auto-select the first plan for the new tool
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (monthlySpend === "") return; // Basic validation

    const newTool: ToolUsage = {
      id: crypto.randomUUID(), // Generates a unique ID
      toolName,
      plan,
      monthlySpend: Number(monthlySpend),
      seats,
      teamSize,
      useCase
    };

    onAddTool(newTool);
    
    // Reset form for the next tool
    setMonthlySpend("");
    setSeats(1);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-xl font-bold mb-4">Add AI Tool</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Tool Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Tool</label>
          <select value={toolName} onChange={handleToolChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border">
            {Object.keys(TOOL_PLAN_MAP).map(tool => (
              <option key={tool} value={tool}>{tool}</option>
            ))}
          </select>
        </div>

        {/* Dynamic Plan Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Plan</label>
          <select value={plan} onChange={(e) => setPlan(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border">
            {TOOL_PLAN_MAP[toolName].map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Monthly Spend</label>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-gray-700 font-medium">$</span>
            <input type="number" required min="0" value={monthlySpend} onChange={(e) => setMonthlySpend(Number(e.target.value))} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border" placeholder="e.g. 20" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Seats</label>
          <input type="number" required min="1" value={seats} onChange={(e) => setSeats(Number(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Total Team Size</label>
          <input type="number" required min="1" value={teamSize} onChange={(e) => setTeamSize(Number(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border" />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700">Primary Use Case</label>
        <select value={useCase} onChange={(e) => setUseCase(e.target.value as any)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border">
          {USE_CASES.map(uc => (
            <option key={uc} value={uc}>{uc.charAt(0).toUpperCase() + uc.slice(1)}</option>
          ))}
        </select>
      </div>

      <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded hover:bg-blue-700 transition">
        Add Tool to Audit
      </button>
    </form>
  );
};