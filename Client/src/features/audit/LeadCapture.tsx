import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

interface LeadCaptureProps {
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  toolStack: Array<{ toolName: string; plan: string; monthlySpend: number }>;
  onSuccess?: () => void;
}

export const LeadCapture = ({ totalMonthlySavings, totalAnnualSavings, toolStack, onSuccess }: LeadCaptureProps) => {
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState(''); // Honeypot field
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Honeypot check: if website field is filled, it's likely a bot
    if (website) {
      console.warn('Honeypot field detected - likely bot submission');
      return;
    }

    if (!email) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Save audit to Supabase
      const { error: insertError } = await supabase
        .from('audits')
        .insert([
          {
            email,
            total_monthly_savings: totalMonthlySavings,
            total_annual_savings: totalAnnualSavings,
            tool_stack: toolStack,
          },
        ]);

      if (insertError) {
        console.error('Supabase error:', insertError);
        setError('Failed to save audit. Please try again.');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setEmail('');
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Error saving audit:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center mt-8">
        <div className="text-4xl mb-4">✓</div>
        <h3 className="text-lg font-bold text-green-700 mb-2">Audit Saved!</h3>
        <p className="text-green-600">Check your inbox for the executive summary.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm mt-8">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Save Your Audit</h3>
      <p className="text-gray-600 mb-6">Enter your email to save this audit and receive a detailed PDF report.</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Honeypot field - hidden from users */}
        <input
          type="text"
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
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