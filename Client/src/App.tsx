import { useAuditManager } from './features/audit/AuditManager';
import { AuditForm } from './features/audit/AuditForm';
import { AuditResults } from './features/audit/AuditResult'; // Import your new component
import { useEffect, useState } from 'react';
import {
  buildShareUrl,
  buildFallbackSummary,
  fetchPublicAuditById,
  normalizeAuditRecord,
  type AuditRecord,
  type SharedAuditView,
} from './lib/auditService';

const getAuditIdFromLocation = (): string | null => {
  const shareMatch = window.location.pathname.match(/^\/share\/([^/?#]+)/);

  if (shareMatch?.[1]) {
    return decodeURIComponent(shareMatch[1]);
  }

  return new URLSearchParams(window.location.search).get('auditId');
};

function App() {
  const { entries, addEntry, removeEntry, clearAudit, getFullAudit, showResults, setShowResults } = useAuditManager();
  const [sharedAuditId, setSharedAuditId] = useState<string | null>(() => getAuditIdFromLocation());
  const [sharedAudit, setSharedAudit] = useState<SharedAuditView | null>(null);
  const [sharedLoading, setSharedLoading] = useState(false);
  const [privateAudit, setPrivateAudit] = useState<SharedAuditView | null>(null);
  const [sharedError, setSharedError] = useState<string | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      setSharedAuditId(getAuditIdFromLocation());
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    if (sharedAuditId) {
      document.title = 'My AI Savings Report';
    } else {
      document.title = 'AI Spend Audit';
    }
  }, [sharedAuditId]);

  useEffect(() => {
    const currentAudit = sharedAudit ?? privateAudit;
    const title = currentAudit ? 'My AI Savings Report' : 'AI Spend Audit';
    const description = currentAudit
      ? `I saved $${currentAudit.totalAnnualSavings.toLocaleString()} on my AI stack!`
      : 'Stop overpaying for AI licenses today.';

    document.title = title;

    const updateMeta = (selector: string, attribute: 'name' | 'property', key: string, content: string) => {
      let metaTag = document.head.querySelector<HTMLMetaElement>(`${selector}[${attribute}="${key}"]`);

      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.setAttribute(attribute, key);
        document.head.appendChild(metaTag);
      }

      metaTag.content = content;
    };

    updateMeta('meta', 'name', 'description', description);
    updateMeta('meta', 'property', 'og:title', title);
    updateMeta('meta', 'property', 'og:description', description);
    updateMeta('meta', 'property', 'twitter:title', title);
    updateMeta('meta', 'property', 'twitter:description', description);
  }, [privateAudit, sharedAudit]);

  useEffect(() => {
    if (!sharedAuditId) {
      setSharedAudit(null);
      setSharedError(null);
      setSharedLoading(false);
      return;
    }

    let isCancelled = false;

    const loadSharedAudit = async () => {
      setSharedLoading(true);
      setSharedError(null);

      try {
        const record = await fetchPublicAuditById(sharedAuditId);

        if (!record) {
          if (!isCancelled) {
            setSharedError('Shared audit not found.');
            setSharedLoading(false);
          }
          return;
        }

        const normalized = normalizeAuditRecord(record);

        if (isCancelled) {
          return;
        }

        setSharedLoading(false);
        setSharedAudit({
          ...normalized,
          executiveSummary: normalized.executiveSummary ?? buildFallbackSummary(normalized.toolStack, normalized.totalMonthlySavings, normalized.totalAnnualSavings),
        });
      } catch (error) {
        if (!isCancelled) {
          setSharedError(error instanceof Error ? error.message : 'Unable to load shared audit.');
        }
      } finally {
        if (!isCancelled) {
          setSharedLoading(false);
        }
      }
    };

    void loadSharedAudit();

    return () => {
      isCancelled = true;
    };
  }, [sharedAuditId]);

  useEffect(() => {
    if (!privateAudit || privateAudit.executiveSummary) {
      return;
    }

    setPrivateAudit((currentAudit) =>
      currentAudit
        ? {
            ...currentAudit,
            executiveSummary: buildFallbackSummary(currentAudit.toolStack, currentAudit.totalMonthlySavings, currentAudit.totalAnnualSavings),
          }
        : currentAudit,
    );
  }, [privateAudit]);

  const handleAuditSaved = (audit: AuditRecord) => {
    setPrivateAudit(normalizeAuditRecord(audit));
    setShowResults(true);
  };

  const sharedView = sharedAuditId;

  // 2. Wrap the view logic
  if (sharedView) {
    if (sharedLoading) {
      return (
        <div className="min-h-screen bg-gray-50 p-8">
          <div className="mx-auto flex max-w-3xl items-center justify-center rounded-3xl border border-gray-200 bg-white p-10 text-gray-500 shadow-sm">
            Loading your shared report...
          </div>
        </div>
      );
    }

    if (sharedError) {
      return (
        <div className="min-h-screen bg-gray-50 p-8">
          <div className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-white p-10 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900">Shared report unavailable</h1>
            <p className="mt-3 text-gray-600">{sharedError}</p>
          </div>
        </div>
      );
    }

    if (!sharedAudit) {
      return null;
    }

    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto">
          <AuditResults 
            auditData={{
              results: sharedAudit.results,
              totalMonthlySavings: sharedAudit.totalMonthlySavings,
              totalAnnualSavings: sharedAudit.totalAnnualSavings,
            }}
            auditId={sharedAudit.auditId}
            shareUrl={buildShareUrl(sharedAudit.publicId)}
            readOnly
            executiveSummary={sharedAudit.executiveSummary}
            toolStack={sharedAudit.toolStack}
          />
        </div>
      </div>
    );
  }

  if (showResults) {
    const fullAudit = getFullAudit();
    const currentAudit = privateAudit ?? normalizeAuditRecord({
      id: 'local-preview',
      created_at: new Date().toISOString(),
      total_monthly_savings: fullAudit.totalMonthlySavings,
      total_annual_savings: fullAudit.totalAnnualSavings,
      tool_stack: entries,
      executive_summary: null,
    });

    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto">
          <AuditResults
            auditData={{
              results: currentAudit.results,
              totalMonthlySavings: currentAudit.totalMonthlySavings,
              totalAnnualSavings: currentAudit.totalAnnualSavings,
            }}
            auditId={privateAudit?.auditId ?? null}
            shareUrl={privateAudit?.publicId ? buildShareUrl(privateAudit.publicId) : null}
            executiveSummary={currentAudit.executiveSummary}
            toolStack={entries}
            savingsData={fullAudit.savingsData}
            onBack={() => {
              setShowResults(false);
              setPrivateAudit(null);
            }}
            onAuditSaved={handleAuditSaved}
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Your Current Stack</h2>
              {entries.length > 0 && (
                <button 
                  onClick={() => {
                    if (window.confirm('Clear all entries and reset audit?')) {
                      clearAudit();
                    }
                  }} 
                  className="text-xs uppercase tracking-widest text-gray-400 hover:text-red-500 transition font-semibold"
                >
                  Clear Stack
                </button>
              )}
            </div>
            
            {entries.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-xl">
                <p className="text-gray-400">Add your first tool to begin...</p>
              </div>
            ) : (
              <>
                <ul className="space-y-4 mb-8">
                  {entries.map((tool) => (
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
                  onClick={() => setShowResults(true)}
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