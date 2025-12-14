import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { DEFAULT_PRIMARY_COLOR, DEFAULT_FEATURE_FLAGS, ROUTES } from '../lib/constants';

export function SetupOrganizationPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [organizationName, setOrganizationName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateSubdomain = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 30);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !organizationName.trim()) return;

    setError('');
    setLoading(true);

    try {
      const subdomain = generateSubdomain(organizationName);

      const { data: existingOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('subdomain', subdomain)
        .maybeSingle();

      const finalSubdomain = existingOrg
        ? `${subdomain}-${Math.random().toString(36).substring(2, 6)}`
        : subdomain;

      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: organizationName.trim(),
          subdomain: finalSubdomain,
          primary_color: DEFAULT_PRIMARY_COLOR,
          subscription_tier: 'STARTER',
          feature_flags: DEFAULT_FEATURE_FLAGS,
          settings: {},
        })
        .select()
        .single();

      if (orgError) throw orgError;

      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: newOrg.id,
          user_id: user.id,
          role: 'ADMIN',
          joined_at: new Date().toISOString(),
        });

      if (memberError) throw memberError;

      const { error: userUpdateError } = await supabase
        .from('users')
        .update({ organization_id: newOrg.id })
        .eq('id', user.id);

      if (userUpdateError) throw userUpdateError;

      // Give database a moment to commit changes
      await new Promise(resolve => setTimeout(resolve, 500));
      // Force a full page reload to the Today page
      window.location.href = ROUTES.TODAY;
    } catch (err: any) {
      console.error('Error creating organization:', err);
      setError(err.message || 'Failed to create organization. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-amber-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-soft-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Building2 className="w-16 h-16 text-primary-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to RPM Life</h1>
          <p className="text-base text-gray-600">Let's set up your organization to get started</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="orgName" className="block text-sm font-semibold text-gray-700 mb-2">
              Organization Name
            </label>
            <input
              id="orgName"
              type="text"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="My Company"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-2">
              This will be your workspace name. You can change it later.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !organizationName.trim()}
            className="w-full py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-base flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Organization...
              </>
            ) : (
              'Continue to RPM Life'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
