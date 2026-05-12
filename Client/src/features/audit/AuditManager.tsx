import { useState, useEffect } from 'react';
import type { ToolUsage, AuditRecommendation } from '../../types/index'; 
import { analyzeToolSpend } from './auditEngine';

export const useAuditManager = () => {
const [entries, setEntries] = useState<ToolUsage[]>(() => {
    try {
      const saved = localStorage.getItem('audit_entries');
      return saved ? JSON.parse(saved) : [];
    } catch {
      console.warn('Failed to parse stored entries, starting fresh');
      return [];
    }
  });

  const [showResults, setShowResults] = useState(() => {
    try {
      const saved = localStorage.getItem('audit_showResults');
      return saved ? JSON.parse(saved) : false;
    } catch {
      console.warn('Failed to parse stored showResults state');
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
    setEntries([...entries, entry]);
  };

  const removeEntry = (idToRemove: string) => {
    setEntries(entries.filter(entry => entry.id !== idToRemove));
  };

  const clearAudit = () => {
    setEntries([]); // Clears the React state (updates the screen)
    localStorage.removeItem('audit_entries'); // Wipes the saved data from the browser
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

  return { entries, addEntry, removeEntry, clearAudit, getFullAudit, showResults, setShowResults };
};

