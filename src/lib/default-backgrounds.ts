export interface DefaultBackground {
  id: string;
  name: string;
  category: string;
  url: string;
  attribution?: string;
}

export const DEFAULT_BACKGROUNDS: DefaultBackground[] = [
  {
    id: 'nature-mountains-1',
    name: 'Mountain Sunrise',
    category: 'nature',
    url: 'https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=1920',
  },
  {
    id: 'nature-ocean-1',
    name: 'Ocean Waves',
    category: 'nature',
    url: 'https://images.pexels.com/photos/189349/pexels-photo-189349.jpeg?auto=compress&cs=tinysrgb&w=1920',
  },
  {
    id: 'nature-forest-1',
    name: 'Forest Path',
    category: 'nature',
    url: 'https://images.pexels.com/photos/1179229/pexels-photo-1179229.jpeg?auto=compress&cs=tinysrgb&w=1920',
  },
  {
    id: 'nature-lake-1',
    name: 'Mountain Lake',
    category: 'nature',
    url: 'https://images.pexels.com/photos/147411/italy-mountains-dawn-daybreak-147411.jpeg?auto=compress&cs=tinysrgb&w=1920',
  },
  {
    id: 'nature-sunset-1',
    name: 'Golden Sunset',
    category: 'nature',
    url: 'https://images.pexels.com/photos/158163/clouds-cloudporn-weather-lookup-158163.jpeg?auto=compress&cs=tinysrgb&w=1920',
  },
  {
    id: 'nature-aurora-1',
    name: 'Northern Lights',
    category: 'nature',
    url: 'https://images.pexels.com/photos/1434608/pexels-photo-1434608.jpeg?auto=compress&cs=tinysrgb&w=1920',
  },
  {
    id: 'workspace-desk-1',
    name: 'Clean Workspace',
    category: 'workspace',
    url: 'https://images.pexels.com/photos/1181376/pexels-photo-1181376.jpeg?auto=compress&cs=tinysrgb&w=1920',
  },
  {
    id: 'workspace-minimal-1',
    name: 'Minimal Setup',
    category: 'workspace',
    url: 'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=1920',
  },
  {
    id: 'abstract-gradient-1',
    name: 'Blue Gradient',
    category: 'abstract',
    url: 'https://images.pexels.com/photos/2387793/pexels-photo-2387793.jpeg?auto=compress&cs=tinysrgb&w=1920',
  },
  {
    id: 'abstract-texture-1',
    name: 'Soft Texture',
    category: 'abstract',
    url: 'https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg?auto=compress&cs=tinysrgb&w=1920',
  },
  {
    id: 'nature-flowers-1',
    name: 'Wildflowers',
    category: 'nature',
    url: 'https://images.pexels.com/photos/133472/pexels-photo-133472.jpeg?auto=compress&cs=tinysrgb&w=1920',
  },
  {
    id: 'nature-sky-1',
    name: 'Blue Sky',
    category: 'nature',
    url: 'https://images.pexels.com/photos/531756/pexels-photo-531756.jpeg?auto=compress&cs=tinysrgb&w=1920',
  },
  {
    id: 'nature-desert-1',
    name: 'Desert Dunes',
    category: 'nature',
    url: 'https://images.pexels.com/photos/2387418/pexels-photo-2387418.jpeg?auto=compress&cs=tinysrgb&w=1920',
  },
  {
    id: 'nature-waterfall-1',
    name: 'Peaceful Waterfall',
    category: 'nature',
    url: 'https://images.pexels.com/photos/1433052/pexels-photo-1433052.jpeg?auto=compress&cs=tinysrgb&w=1920',
  },
  {
    id: 'nature-canyon-1',
    name: 'Grand Canyon',
    category: 'nature',
    url: 'https://images.pexels.com/photos/1619299/pexels-photo-1619299.jpeg?auto=compress&cs=tinysrgb&w=1920',
  },
];

export const BACKGROUND_CATEGORIES = [
  { id: 'all', name: 'All Images' },
  { id: 'nature', name: 'Nature' },
  { id: 'workspace', name: 'Workspace' },
  { id: 'abstract', name: 'Abstract' },
];

export const getDefaultBackgroundByPageId = (pageId: string): string => {
  const defaults: Record<string, string> = {
    'weekly-reflection': 'https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=1920',
    'life-plan': 'https://images.pexels.com/photos/147411/italy-mountains-dawn-daybreak-147411.jpeg?auto=compress&cs=tinysrgb&w=1920',
    'goals': 'https://images.pexels.com/photos/1619299/pexels-photo-1619299.jpeg?auto=compress&cs=tinysrgb&w=1920',
    'weekly-plan': 'https://images.pexels.com/photos/531756/pexels-photo-531756.jpeg?auto=compress&cs=tinysrgb&w=1920',
    'weekly-review': 'https://images.pexels.com/photos/189349/pexels-photo-189349.jpeg?auto=compress&cs=tinysrgb&w=1920',
    'monthly-review': 'https://images.pexels.com/photos/1179229/pexels-photo-1179229.jpeg?auto=compress&cs=tinysrgb&w=1920',
    'daily-planning': 'https://images.pexels.com/photos/158163/clouds-cloudporn-weather-lookup-158163.jpeg?auto=compress&cs=tinysrgb&w=1920',
    'evening-review': 'https://images.pexels.com/photos/1434608/pexels-photo-1434608.jpeg?auto=compress&cs=tinysrgb&w=1920',
    'areas': 'https://images.pexels.com/photos/133472/pexels-photo-133472.jpeg?auto=compress&cs=tinysrgb&w=1920',
    'outcomes': 'https://images.pexels.com/photos/1181376/pexels-photo-1181376.jpeg?auto=compress&cs=tinysrgb&w=1920',
    'today': 'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=1920',
    'week': 'https://images.pexels.com/photos/1433052/pexels-photo-1433052.jpeg?auto=compress&cs=tinysrgb&w=1920',
    'inbox': 'https://images.pexels.com/photos/2387793/pexels-photo-2387793.jpeg?auto=compress&cs=tinysrgb&w=1920',
    'capture': 'https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg?auto=compress&cs=tinysrgb&w=1920',
    'templates': 'https://images.pexels.com/photos/2387418/pexels-photo-2387418.jpeg?auto=compress&cs=tinysrgb&w=1920',
  };

  return defaults[pageId] || DEFAULT_BACKGROUNDS[0].url;
};
