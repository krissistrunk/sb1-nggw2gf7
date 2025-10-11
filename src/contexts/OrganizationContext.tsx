import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Organization } from '../lib/database.types';
import { supabase } from '../lib/supabase';

interface OrganizationContextType {
  organization: Organization | null;
  loading: boolean;
  setOrganization: (org: Organization | null) => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrganization();
  }, []);

  useEffect(() => {
    if (organization) {
      applyTheme(organization);
    }
  }, [organization]);

  const loadOrganization = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .maybeSingle();

      if (userData?.organization_id) {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', userData.organization_id)
          .maybeSingle();

        if (orgData) {
          setOrganization(orgData);
        }
      }
    } catch (error) {
      console.error('Error loading organization:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyTheme = (org: Organization) => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', org.primary_color);

    if (org.favicon_url) {
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'shortcut icon';
      link.href = org.favicon_url;
      document.getElementsByTagName('head')[0].appendChild(link);
    }

    document.title = org.name || 'RPM Life';
  };

  return (
    <OrganizationContext.Provider value={{ organization, loading, setOrganization }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within OrganizationProvider');
  }
  return context;
}
