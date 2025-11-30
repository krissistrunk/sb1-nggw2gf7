/**
 * Mock Organizations Data
 */

export interface MockOrganization {
  id: string;
  name: string;
  subdomain: string;
  primary_color: string;
  logo_url: string | null;
  favicon_url: string | null;
  subscription_tier: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  created_at: string;
  last_active_at: string;
}

export const MOCK_ORGANIZATIONS: MockOrganization[] = [
  {
    id: 'org-001',
    name: 'Personal Growth Academy',
    subdomain: 'sarah-personal',
    primary_color: '#3B82F6',
    logo_url: null,
    favicon_url: null,
    subscription_tier: 'PROFESSIONAL',
    created_at: '2023-01-15T08:00:00Z',
    last_active_at: new Date().toISOString(),
  },
  {
    id: 'org-002',
    name: 'TechCorp Training',
    subdomain: 'techcorp',
    primary_color: '#10B981',
    logo_url: null,
    favicon_url: null,
    subscription_tier: 'ENTERPRISE',
    created_at: '2023-02-10T09:30:00Z',
    last_active_at: new Date().toISOString(),
  },
  {
    id: 'org-003',
    name: 'Creative Learning Hub',
    subdomain: 'creative-hub',
    primary_color: '#8B5CF6',
    logo_url: null,
    favicon_url: null,
    subscription_tier: 'PROFESSIONAL',
    created_at: '2023-03-05T10:15:00Z',
    last_active_at: new Date().toISOString(),
  },
  {
    id: 'org-004',
    name: 'Global Education Institute',
    subdomain: 'global-ed',
    primary_color: '#F59E0B',
    logo_url: null,
    favicon_url: null,
    subscription_tier: 'ENTERPRISE',
    created_at: '2023-04-20T11:00:00Z',
    last_active_at: new Date().toISOString(),
  },
  {
    id: 'org-005',
    name: 'Innovation Team Co',
    subdomain: 'innovation-team',
    primary_color: '#EF4444',
    logo_url: null,
    favicon_url: null,
    subscription_tier: 'STARTER',
    created_at: '2023-05-12T14:30:00Z',
    last_active_at: new Date().toISOString(),
  },
];

export function getMockOrganizationById(id: string): MockOrganization | undefined {
  return MOCK_ORGANIZATIONS.find(org => org.id === id);
}

export function getMockOrganizationBySubdomain(subdomain: string): MockOrganization | undefined {
  return MOCK_ORGANIZATIONS.find(org => org.subdomain === subdomain);
}
