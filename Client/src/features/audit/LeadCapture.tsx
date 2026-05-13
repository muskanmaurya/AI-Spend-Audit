import { useState, type FormEvent } from 'react';
import { saveAudit, type AuditRecord, type SavingsData } from '../../lib/auditService';
import type { ToolUsage } from '../../types/index';

interface LeadCaptureProps {
  toolStack: ToolUsage[];
  savingsData: SavingsData;
  onAuditSaved?: (audit: AuditRecord) => void;
}

export const LeadCapture = ({ toolStack, savingsData, onAuditSaved }: LeadCaptureProps) => {
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('');
  const [leadTeamSize, setLeadTeamSize] = useState('');
  const [faxNumber, setFaxNumber] = useState(''); // Honeypot field
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Honeypot check: if website field is filled, it's likely a bot
    if (faxNumber) {
      return;
    }

    if (!email) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const savedAudit = await saveAudit({
        email,
        company_name: companyName.trim() || null,
        role: role.trim() || null,
        lead_team_size: leadTeamSize ? Number(leadTeamSize) : null,
        tool_stack: toolStack,
        savingsData,
      });

      setSuccess(true);
      setEmail('');
      setCompanyName('');
      setRole('');
      setLeadTeamSize('');
      if (onAuditSaved) {
        onAuditSaved(savedAudit);
      }
    } catch {
      setError('Failed to save audit. Please try again.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center mt-8">
        <div className="text-4xl mb-4">✓</div>
        <h3 className="text-lg font-bold text-green-700 mb-2">Audit Saved!</h3>
        <p className="text-green-600">Check your inbox for the executive summary.</p>
        {onAuditSaved && (
          <p className="mt-3 text-sm text-green-700">
            Your share link is ready once the summary finishes generating.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm mt-8">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Save Your Audit</h3>
      <p className="text-gray-600 mb-6">Enter your email to save this audit and receive a detailed executive summary.</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Honeypot field - hidden from users */}
        <input
          type="text"
          name="fax_number"
          value={faxNumber}
          onChange={(e) => setFaxNumber(e.target.value)}
          style={{ display: 'none' }}
          tabIndex={-1}
          autoComplete="off"
        />

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            placeholder="your@email.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
              Company Name <span className="text-gray-400">(optional)</span>
            </label>
            <input
              id="companyName"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={loading}
              placeholder="Acme Inc."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              Role <span className="text-gray-400">(optional)</span>
            </label>
            <input
              id="role"
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={loading}
              placeholder="Finance, Engineering, Founder"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="leadTeamSize" className="block text-sm font-medium text-gray-700 mb-2">
              Team Size <span className="text-gray-400">(optional)</span>
            </label>
            <input
              id="leadTeamSize"
              type="number"
              min="1"
              value={leadTeamSize}
              onChange={(e) => setLeadTeamSize(e.target.value)}
              disabled={loading}
              placeholder="12"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              Saving...
            </>
          ) : (
            'Save Audit'
          )}
        </button>
      </form>
    </div>
  );
};