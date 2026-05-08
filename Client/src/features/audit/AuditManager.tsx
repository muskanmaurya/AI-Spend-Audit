import { useState, useEffect } from 'react';
import type { ToolUsage, AuditRecommendation } from '../../types/index'; 
import { analyzeToolSpend } from './auditEngine';

export const useAuditManager = () => {
const [entries, setEntries] = useState<ToolUsage[]>(() => {
    const saved = localStorage.getItem('audit_entries');
    return saved ? JSON.parse(saved) : [];
  });

  // persistence: Load from LocalStorage on start
  useEffect(() => {
    const saved = localStorage.getItem('audit_entries');
    if (saved) setEntries(JSON.parse(saved));
  }, []);

  // persistence: Save to LocalStorage whenever entries change
  useEffect(() => {
    localStorage.setItem('audit_entries', JSON.stringify(entries));
  }, [entries]);

  const addEntry = (entry: ToolUsage) => {
    setEntries([...entries, entry]);
  };

  const getFullAudit = () => {

    const results: AuditRecommendation[] = entries.map(entry => analyzeToolSpend(entry));
    
    const totalMonthlySavings = results.reduce((sum, res) => sum + res.potentialSavings, 0);
    
    return {
      results,
      totalMonthlySavings,
      totalAnnualSavings: totalMonthlySavings * 12
    };
  };

  return { entries, addEntry, getFullAudit };
};

