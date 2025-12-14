import { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, parseISO } from 'date-fns';
import { Check, ChevronDown, ChevronUp, TrendingUp, Clock, Target as TargetIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Target, Heart, Briefcase, DollarSign, Users, BookOpen, Sparkles, Smile } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BackgroundHeroSection } from '../components/BackgroundHeroSection';
import { ImageUploadModal } from '../components/ImageUploadModal';
import { usePageBackground } from '../hooks/usePageBackground';

const ICON_MAP: Record<string, any> = {
  Heart,
  Briefcase,
  DollarSign,
  Users,
  BookOpen,
  Sparkles,
  Smile,
  Target,
};

interface Area {
  id: string;
  name: string;
  icon: string;
  color: string;
  color_hex?: string;
}

interface TimeBlock {
  id: string;
  title: string;
  scheduled_start: string;
  scheduled_end: string;
  duration_minutes: number;
  actual_minutes?: number;
  completed: boolean;
  notes?: string;
  area?: Area;
}

interface AreaStats {
  area: Area;
  completedBlocks: number;
  totalBlocks: number;
  plannedMinutes: number;
  actualMinutes: number;
}

export function WeeklyReflectionPage() {
  const { user } = useAuth();
  const [weekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [areaStats, setAreaStats] = useState<AreaStats[]>([]);
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());
  const [reflections, setReflections] = useState({
    wins: '',
    challenges: '',
    learnings: '',
    nextWeek: '',
  });
  const [showImageModal, setShowImageModal] = useState(false);
  const {
    getBackgroundUrl,
    getBackgroundPosition,
    getOverlayOpacity,
    updateBackground,
    uploadImage,
  } = usePageBackground('weekly-reflection');

  const weekEnd = addDays(weekStart, 7);

  useEffect(() => {
    if (user) {
      loadWeekData();
    }
  }, [user]);

  const loadWeekData = async () => {
    try {
      const { data: blocks } = await supabase
        .from('time_blocks')
        .select('*')
        .eq('user_id', user?.id)
        .gte('scheduled_start', weekStart.toISOString())
        .lt('scheduled_start', weekEnd.toISOString())
        .order('scheduled_start');

      const blocksWithAreas = await Promise.all(
        (blocks || []).map(async (block) => {
          if (block.action_id) {
            const { data: action } = await supabase
              .from('actions')
              .select('area_id')
              .eq('id', block.action_id)
              .single();

            if (action?.area_id) {
              const { data: area } = await supabase
                .from('areas')
                .select('*')
                .eq('id', action.area_id)
                .single();

              return { ...block, area };
            }
          }
          return block;
        })
      );

      setTimeBlocks(blocksWithAreas as TimeBlock[]);
      calculateAreaStats(blocksWithAreas as TimeBlock[]);
    } catch (error) {
      console.error('Error loading week data:', error);
    }
  };

  const calculateAreaStats = (blocks: TimeBlock[]) => {
    const areaMap = new Map<string, AreaStats>();

    blocks.forEach(block => {
      if (block.area) {
        const existing = areaMap.get(block.area.id);
        if (existing) {
          existing.totalBlocks++;
          if (block.completed) existing.completedBlocks++;
          existing.plannedMinutes += block.duration_minutes;
          existing.actualMinutes += block.actual_minutes || block.duration_minutes;
        } else {
          areaMap.set(block.area.id, {
            area: block.area,
            completedBlocks: block.completed ? 1 : 0,
            totalBlocks: 1,
            plannedMinutes: block.duration_minutes,
            actualMinutes: block.actual_minutes || block.duration_minutes,
          });
        }
      }
    });

    const stats = Array.from(areaMap.values()).sort((a, b) => b.actualMinutes - a.actualMinutes);
    setAreaStats(stats);
    setExpandedAreas(new Set(stats.map(s => s.area.id)));
  };

  const getIconComponent = (iconName: string) => {
    return ICON_MAP[iconName] || Target;
  };

  const toggleArea = (areaId: string) => {
    setExpandedAreas(prev => {
      const next = new Set(prev);
      if (next.has(areaId)) {
        next.delete(areaId);
      } else {
        next.add(areaId);
      }
      return next;
    });
  };

  const getBlocksForArea = (areaId: string) => {
    return timeBlocks.filter(b => b.area?.id === areaId && b.completed);
  };

  const totalPlannedMinutes = areaStats.reduce((sum, s) => sum + s.plannedMinutes, 0);
  const totalActualMinutes = areaStats.reduce((sum, s) => sum + s.actualMinutes, 0);
  const totalCompletedBlocks = areaStats.reduce((sum, s) => sum + s.completedBlocks, 0);
  const totalBlocks = areaStats.reduce((sum, s) => sum + s.totalBlocks, 0);
  const completionRate = totalBlocks > 0 ? Math.round((totalCompletedBlocks / totalBlocks) * 100) : 0;

  return (
    <div className="min-h-screen">
      <BackgroundHeroSection
        imageUrl={getBackgroundUrl()}
        imagePosition={getBackgroundPosition()}
        overlayOpacity={getOverlayOpacity()}
        onEditClick={() => setShowImageModal(true)}
      >
        <div className="text-center text-white">
          <h1 className="text-5xl font-bold mb-4">Weekly Reflection</h1>
          <p className="text-xl text-white/90">
            {format(weekStart, 'MMMM d')} - {format(addDays(weekStart, 6), 'MMMM d, yyyy')}
          </p>
          <div className="flex items-center justify-center gap-8 mt-8">
            <div className="text-center">
              <div className="text-4xl font-bold">{completionRate}%</div>
              <div className="text-sm text-white/80">Completion Rate</div>
            </div>
            <div className="w-px h-12 bg-white/30" />
            <div className="text-center">
              <div className="text-4xl font-bold">{totalCompletedBlocks}</div>
              <div className="text-sm text-white/80">Actions Completed</div>
            </div>
            <div className="w-px h-12 bg-white/30" />
            <div className="text-center">
              <div className="text-4xl font-bold">{Math.round(totalActualMinutes / 60)}h</div>
              <div className="text-sm text-white/80">Total Time</div>
            </div>
          </div>
        </div>
      </BackgroundHeroSection>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pb-12">
  
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Actions Completed This Week</h2>
            </div>

            <div className="space-y-4">
              {areaStats.length === 0 ? (
                <div className="text-center py-12">
                  <TargetIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No completed actions this week</p>
                  <Link
                    to="/weekly-plan"
                    className="inline-block mt-4 px-6 py-2 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors"
                  >
                    Plan Your Week
                  </Link>
                </div>
              ) : (
                areaStats.map(stat => {
                  const Icon = getIconComponent(stat.area.icon);
                  const color = stat.area.color_hex || stat.area.color;
                  const isExpanded = expandedAreas.has(stat.area.id);
                  const blocks = getBlocksForArea(stat.area.id);

                  return (
                    <div key={stat.area.id} className="border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleArea(stat.area.id)}
                        className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${color}20` }}
                        >
                          <Icon className="w-6 h-6" style={{ color }} />
                        </div>
                        <div className="flex-1 text-left">
                          <h3 className="font-semibold text-gray-900">{stat.area.name}</h3>
                          <p className="text-sm text-gray-600">
                            {stat.completedBlocks} of {stat.totalBlocks} actions completed
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">
                            {Math.round(stat.actualMinutes / 60)}h {stat.actualMinutes % 60}m
                          </div>
                          <div className="text-sm text-gray-600">
                            {Math.round((stat.completedBlocks / stat.totalBlocks) * 100)}%
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </button>

                      {isExpanded && blocks.length > 0 && (
                        <div className="border-t border-gray-200 bg-gray-50 p-4">
                          <ul className="space-y-2">
                            {blocks.map(block => (
                              <li key={block.id} className="flex items-start gap-3 text-sm">
                                <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <span className="text-gray-900">{block.title}</span>
                                  {block.notes && (
                                    <p className="text-gray-600 text-xs mt-1">{block.notes}</p>
                                  )}
                                </div>
                                <span className="text-gray-500 text-xs">
                                  {block.duration_minutes}m
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Reflections on My Week</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  What were my biggest wins this week?
                </label>
                <textarea
                  value={reflections.wins}
                  onChange={(e) => setReflections({ ...reflections, wins: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Celebrate your achievements..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  What challenges did I face?
                </label>
                <textarea
                  value={reflections.challenges}
                  onChange={(e) => setReflections({ ...reflections, challenges: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="What obstacles came up..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  What did I learn?
                </label>
                <textarea
                  value={reflections.learnings}
                  onChange={(e) => setReflections({ ...reflections, learnings: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Key insights and lessons..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  What will I focus on next week?
                </label>
                <textarea
                  value={reflections.nextWeek}
                  onChange={(e) => setReflections({ ...reflections, nextWeek: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Looking ahead..."
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Total Weekly Work by Category</h2>
          </div>

          <div className="space-y-4">
            {areaStats.map(stat => {
              const Icon = getIconComponent(stat.area.icon);
              const color = stat.area.color_hex || stat.area.color;
              const plannedHours = Math.round((stat.plannedMinutes / 60) * 10) / 10;
              const actualHours = Math.round((stat.actualMinutes / 60) * 10) / 10;
              const percentage = totalActualMinutes > 0
                ? Math.round((stat.actualMinutes / totalActualMinutes) * 100)
                : 0;

              return (
                <div key={stat.area.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${color}20` }}
                      >
                        <Icon className="w-4 h-4" style={{ color }} />
                      </div>
                      <span className="font-medium text-gray-900">{stat.area.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600">
                        Planned: {plannedHours}h
                      </span>
                      <span className="font-semibold text-gray-900">
                        Actual: {actualHours}h
                      </span>
                      <span className="text-gray-500">
                        {percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: color,
                        opacity: 0.8,
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-700">
                        {stat.completedBlocks} / {stat.totalBlocks} actions
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {areaStats.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between text-lg font-semibold">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">
                  {Math.round(totalActualMinutes / 60)}h {totalActualMinutes % 60}m
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-center gap-4">
          <Link
            to="/weekly-plan"
            className="px-8 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors shadow-lg"
          >
            Plan Next Week
          </Link>
          <button
            className="px-8 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            Save Reflections
          </button>
        </div>
      </div>

      {showImageModal && (
        <ImageUploadModal
          currentImageUrl={getBackgroundUrl()}
          currentPosition={getBackgroundPosition()}
          currentOpacity={getOverlayOpacity()}
          onSave={updateBackground}
          onUpload={uploadImage}
          onClose={() => setShowImageModal(false)}
        />
      )}
    </div>
  );
}
