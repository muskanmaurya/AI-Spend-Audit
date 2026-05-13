import { useState, useEffect } from 'react';
import type { ToolUsage, AuditRecommendation } from '../../types/index'; 
import { analyzeToolSpend } from './auditEngine';

export const useAuditManager = () => {
  const [entries, setEntries] = useState<ToolUsage[]>(() => {
    try {
      const saved = localStorage.getItem('audit_entries');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [showResults, setShowResults] = useState(() => {
    try {
      const saved = localStorage.getItem('audit_showResults');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  // persistence: Save entries to LocalStorage whenever they change
  useEffect(() => {
    localStorage.setItem('audit_entries', JSON.stringify(entries));
  }, [entries]);

  // persistence: Save showResults state to LocalStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('audit_showResults', JSON.stringify(showResults));
  }, [showResults]);

  const addEntry = (entry: ToolUsage) => {
    setEntries((currentEntries) => [...currentEntries, entry]);
  };

  const removeEntry = (idToRemove: string) => {
    setEntries((currentEntries) => currentEntries.filter((entry) => entry.id !== idToRemove));
  };

  const clearAudit = () => {
    setEntries([]);
    setShowResults(false);
    localStorage.removeItem('audit_entries');
    localStorage.removeItem('audit_showResults');
  };

  const getFullAudit = () => {

    const results: AuditRecommendation[] = entries.map(entry => analyzeToolSpend(entry));
    
    const totalMonthlySavings = results.reduce((sum, res) => sum + res.potentialSavings, 0);
    const optimizedCount = results.filter((result) => result.potentialSavings === 0).length;
    const optimizationScore = results.length > 0 ? Math.round((optimizedCount / results.length) * 100) : 100;
    
    return {
      results,
      totalMonthlySavings,
      totalAnnualSavings: totalMonthlySavings * 12,
      savingsData: {
        totalMonthlySavings,
        totalAnnualSavings: totalMonthlySavings * 12,
        optimizationScore,
        toolCount: results.length,
        topTool: entries[0]?.toolName ?? 'your stack',
      }
    };
  };

  return { entries, addEntry, removeEntry, clearAudit, getFullAudit, showResults, setShowResults };
};

