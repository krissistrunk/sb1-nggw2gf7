import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, Target, Heart, Briefcase, DollarSign, Users, BookOpen, Sparkles, Smile, type LucideIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

import type { Area as AreaRow } from '../lib/database.types';

const ICON_MAP: Record<string, LucideIcon> = {
  Heart,
  Briefcase,
  DollarSign,
  Users,
  BookOpen,
  Sparkles,
  Smile,
  Target,
};

interface CategorySidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function CategorySidebar({ isOpen, onToggle }: CategorySidebarProps) {
  const { user } = useAuth();
  const location = useLocation();
  const [areas, setAreas] = useState<AreaRow[]>([]);

  useEffect(() => {
    if (user) {
      loadAreas();
    }
  }, [user]);

  const loadAreas = async () => {
    const userId = user?.id;
    if (!userId) return;

    try {
      const { data } = await supabase
        .from('areas')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order', { ascending: true })
        .order('name');

      setAreas(data || []);
    } catch (error) {
      console.error('Error loading areas:', error);
    }
  };

  const getIconComponent = (iconName: string) => {
    return ICON_MAP[iconName] || Target;
  };

  const isActiveCategory = (areaId: string) => {
    return location.pathname.includes(`/area/${areaId}`);
  };

  return (
    <>
      <div
        className={`fixed left-0 top-16 bottom-0 bg-white border-r border-gray-200 transition-all duration-300 z-40 ${
          isOpen ? 'w-64' : 'w-16'
        }`}
      >
        <div className="flex flex-col h-full">
          <button
            onClick={onToggle}
            className="flex items-center justify-center h-12 border-b border-gray-200 hover:bg-gray-50 transition-colors"
          >
            {isOpen ? (
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-600" />
            )}
          </button>

          <div className="flex-1 overflow-y-auto py-4">
            <div className="space-y-1 px-2">
              {areas.map((area) => {
                const Icon = getIconComponent(area.icon);
                const active = isActiveCategory(area.id);
                const color = area.color;

                return (
                  <Link
                    key={area.id}
                    to={`/area/${area.id}`}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
                      active
                        ? 'bg-gray-100'
                        : 'hover:bg-gray-50'
                    }`}
                    title={!isOpen ? area.name : undefined}
                  >
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all"
                      style={{
                        backgroundColor: active ? `${color}20` : `${color}10`,
                      }}
                    >
                      <Icon
                        className="w-5 h-5"
                        style={{ color }}
                      />
                    </div>

                    {isOpen && (
                      <span className={`text-sm font-medium truncate ${
                        active ? 'text-gray-900' : 'text-gray-600'
                      }`}>
                        {area.name}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="border-t border-gray-200 p-2">
            <Link
              to="/areas"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-gray-600 hover:text-gray-900"
              title={!isOpen ? 'Manage Areas' : undefined}
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100">
                <Plus className="w-5 h-5" />
              </div>
              {isOpen && (
                <span className="text-sm font-medium">Manage Areas</span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
}
