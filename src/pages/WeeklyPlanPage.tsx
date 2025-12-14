import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Star, Clock, Check, MoreVertical, Calendar as CalendarIcon, Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useOrganization } from '../contexts/OrganizationContext';
import { Target, Heart, Briefcase, DollarSign, Users, BookOpen, Sparkles, Smile } from 'lucide-react';
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

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return `${hour}:00`;
});

interface Area {
  id: string;
  name: string;
  icon: string;
  color: string;
  color_hex?: string | null;
}

interface Action {
  id: string;
  title: string;
  area_id?: string | null;
  outcome_id?: string | null;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
  estimated_minutes?: number | null;
  is_priority?: boolean | null;
  done?: boolean;
  result_notes?: string | null;
}

interface TimeBlock {
  id: string;
  action_id?: string | null;
  title: string;
  scheduled_start: string;
  scheduled_end: string;
  duration_minutes: number;
  completed: boolean;
  area?: Area;
  action?: Action;
}

export function WeeklyPlanPage() {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [areas, setAreas] = useState<Area[]>([]);
  const [unscheduledActions, setUnscheduledActions] = useState<Action[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'all' | 'scheduled' | 'unscheduled'>('all');
  const [draggedAction, setDraggedAction] = useState<Action | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showTimeBlockModal, setShowTimeBlockModal] = useState(false);
  const [newTimeBlock, setNewTimeBlock] = useState({
    title: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    duration: 60,
  });
  const {
    getBackgroundUrl,
    getBackgroundPosition,
    getOverlayOpacity,
    updateBackground,
    uploadImage,
  } = usePageBackground('weekly-plan');

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    if (user && organization) {
      loadData();
    }
  }, [user, organization, currentWeek]);

  const loadData = async () => {
    await Promise.all([
      loadAreas(),
      loadUnscheduledActions(),
      loadTimeBlocks(),
    ]);
  };

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
      setExpandedAreas(new Set((data || []).map(a => a.id)));
    } catch (error) {
      console.error('Error loading areas:', error);
    }
  };

  const loadUnscheduledActions = async () => {
    const userId = user?.id;
    if (!userId) return;

    try {
      const { data } = await supabase
        .from('actions')
        .select('*')
        .eq('user_id', userId)
        .eq('done', false)
        .is('scheduled_date', null)
        .order('is_priority', { ascending: false })
        .order('created_at', { ascending: false });

      setUnscheduledActions(data || []);
    } catch (error) {
      console.error('Error loading actions:', error);
    }
  };

  const loadTimeBlocks = async () => {
    const userId = user?.id;
    const organizationId = organization?.id;
    if (!userId || !organizationId) return;

    try {
      const weekEnd = addDays(weekStart, 7);

      const { data: blocks, error: blocksError } = await supabase
        .from('time_blocks')
        .select('*')
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .gte('scheduled_start', weekStart.toISOString())
        .lt('scheduled_start', weekEnd.toISOString())
        .order('scheduled_start');

      if (blocksError) throw blocksError;

      const actionIds = Array.from(
        new Set((blocks || []).map((b) => b.action_id).filter((id): id is string => Boolean(id)))
      );

      const { data: actionsData, error: actionsError } = actionIds.length
        ? await supabase.from('actions').select('*').in('id', actionIds)
        : { data: [] as Action[], error: null };

      if (actionsError) throw actionsError;

      const actionsById = new Map<string, Action>((actionsData || []).map((a) => [a.id, a]));

      const areaIds = Array.from(
        new Set((actionsData || []).map((a) => a.area_id).filter((id): id is string => Boolean(id)))
      );

      const { data: areasData, error: areasError } = areaIds.length
        ? await supabase.from('areas').select('*').in('id', areaIds)
        : { data: [] as Area[], error: null };

      if (areasError) throw areasError;

      const areasById = new Map<string, Area>((areasData || []).map((a) => [a.id, a]));

      const blocksWithAreas: TimeBlock[] = (blocks || []).map((block) => {
        const action = block.action_id ? actionsById.get(block.action_id) : undefined;
        const area = action?.area_id ? areasById.get(action.area_id) : undefined;
        return { ...block, action, area };
      });

      setTimeBlocks(blocksWithAreas);
    } catch (error) {
      console.error('Error loading time blocks:', error);
    }
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

  const getActionsByArea = (areaId: string) => {
    return unscheduledActions.filter(a => a.area_id === areaId);
  };

  const handleDragStart = (action: Action) => {
    setDraggedAction(action);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (date: Date, timeSlot: string) => {
    if (!draggedAction) return;
    const userId = user?.id;
    const organizationId = organization?.id;
    if (!userId || !organizationId) return;

    const [hours, minutes] = timeSlot.split(':').map(Number);
    const scheduledStart = new Date(date);
    scheduledStart.setHours(hours, minutes, 0, 0);

    const duration = draggedAction.estimated_minutes || 30;
    const scheduledEnd = new Date(scheduledStart.getTime() + duration * 60000);

    try {
      await supabase.from('time_blocks').insert({
        user_id: userId,
        organization_id: organizationId,
        action_id: draggedAction.id,
        outcome_id: draggedAction.outcome_id ?? null,
        title: draggedAction.title,
        scheduled_start: scheduledStart.toISOString(),
        scheduled_end: scheduledEnd.toISOString(),
        duration_minutes: duration,
        completed: false,
      });

      await supabase
        .from('actions')
        .update({
          scheduled_date: format(date, 'yyyy-MM-dd'),
          scheduled_time: timeSlot,
        })
        .eq('id', draggedAction.id);

      setDraggedAction(null);
      loadData();
    } catch (error) {
      console.error('Error scheduling action:', error);
    }
  };

  const getBlocksForSlot = (date: Date, timeSlot: string) => {
    return timeBlocks.filter(block => {
      const blockStart = parseISO(block.scheduled_start);
      const [hours, minutes] = timeSlot.split(':').map(Number);
      return (
        isSameDay(blockStart, date) &&
        blockStart.getHours() === hours &&
        blockStart.getMinutes() === minutes
      );
    });
  };

  const toggleBlockComplete = async (blockId: string, completed: boolean) => {
    try {
      await supabase
        .from('time_blocks')
        .update({ completed: !completed })
        .eq('id', blockId);

      loadData();
    } catch (error) {
      console.error('Error toggling block:', error);
    }
  };

  const previousWeek = () => setCurrentWeek(addDays(currentWeek, -7));
  const nextWeek = () => setCurrentWeek(addDays(currentWeek, 7));

  const handleCreateTimeBlock = async () => {
    if (!newTimeBlock.title.trim()) return;
    const userId = user?.id;
    const organizationId = organization?.id;
    if (!userId || !organizationId) return;

    try {
      const [hours, minutes] = newTimeBlock.startTime.split(':').map(Number);
      const scheduledStart = new Date(newTimeBlock.date);
      scheduledStart.setHours(hours, minutes, 0, 0);

      const scheduledEnd = new Date(scheduledStart.getTime() + newTimeBlock.duration * 60000);

      await supabase.from('time_blocks').insert({
        user_id: userId,
        organization_id: organizationId,
        title: newTimeBlock.title,
        scheduled_start: scheduledStart.toISOString(),
        scheduled_end: scheduledEnd.toISOString(),
        duration_minutes: newTimeBlock.duration,
        completed: false,
      });

      setShowTimeBlockModal(false);
      setNewTimeBlock({
        title: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: '09:00',
        duration: 60,
      });
      loadData();
    } catch (error) {
      console.error('Error creating time block:', error);
    }
  };

  return (
    <div>
      <BackgroundHeroSection
        imageUrl={getBackgroundUrl()}
        imagePosition={getBackgroundPosition()}
        overlayOpacity={getOverlayOpacity()}
        height="h-48"
        onEditClick={() => setShowImageModal(true)}
      >
        <div className="text-center text-white px-4">
          <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-90" />
          <h1 className="text-4xl font-bold mb-2">Weekly Plan</h1>
          <p className="text-lg text-white/90">
            {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
          </p>
        </div>
      </BackgroundHeroSection>

      
      <div className="relative z-10 max-w-full mx-auto px-4 sm:px-6 lg:px-8 mt-8 pb-8"> 
        <div className="flex h-[calc(100vh-16rem)] gap-4">
      <div className="w-80 bg-white rounded-2xl shadow-lg p-6 overflow-y-auto flex-shrink-0">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Capture List</h2>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('all')}
              className={`px-2 py-1 text-xs font-medium rounded ${
                viewMode === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setViewMode('unscheduled')}
              className={`px-2 py-1 text-xs font-medium rounded ${
                viewMode === 'unscheduled' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Unscheduled
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {areas.map(area => {
            const Icon = getIconComponent(area.icon);
            const areaActions = getActionsByArea(area.id);
            const isExpanded = expandedAreas.has(area.id);
            const color = area.color_hex || area.color;

            if (areaActions.length === 0 && viewMode === 'unscheduled') return null;

            return (
              <div key={area.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleArea(area.id)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <span className="flex-1 text-left font-medium text-gray-900">{area.name}</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {areaActions.length}
                  </span>
                  <ChevronRight
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      isExpanded ? 'rotate-90' : ''
                    }`}
                  />
                </button>

                {isExpanded && areaActions.length > 0 && (
                  <div className="border-t border-gray-200 bg-gray-50 p-2 space-y-1">
                    {areaActions.map(action => (
                      <div
                        key={action.id}
                        draggable
                        onDragStart={() => handleDragStart(action)}
                        className="bg-white p-3 rounded-lg border border-gray-200 cursor-move hover:shadow-md transition-all group"
                      >
                        <div className="flex items-start gap-2">
                          {action.is_priority && (
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 line-clamp-2">
                              {action.title}
                            </p>
                            {action.estimated_minutes && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                {action.estimated_minutes}m
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={previousWeek}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
              </h1>
              <button
                onClick={nextWeek}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowTimeBlockModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-primary-500 text-primary-600 rounded-xl font-semibold hover:bg-primary-50 transition-colors"
              >
                <Plus className="w-5 h-5" />
                New Time Block
              </button>
              <Link
                to="/weekly-review"
                className="px-6 py-2 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors shadow-lg"
              >
                Complete My Week
              </Link>
            </div>
          </div>

          <div className="flex gap-2">
            {areas.slice(0, 5).map(area => {
              const Icon = getIconComponent(area.icon);
              const color = area.color_hex || area.color;
              const areaBlocks = timeBlocks.filter(b => b.area?.id === area.id);
              const totalMinutes = areaBlocks.reduce((sum, b) => sum + b.duration_minutes, 0);
              const hours = Math.floor(totalMinutes / 60);
              const minutes = totalMinutes % 60;

              return (
                <div
                  key={area.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ backgroundColor: `${color}10` }}
                >
                  <Icon className="w-4 h-4" style={{ color }} />
                  <span className="text-sm font-medium text-gray-900">{area.name}</span>
                  <span className="text-xs text-gray-600">
                    {hours > 0 && `${hours}h`} {minutes}m
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
            <div className="p-3 border-r border-gray-200 text-xs font-medium text-gray-600">
              Time
            </div>
            {weekDays.map(day => (
              <div key={day.toISOString()} className="p-3 border-r border-gray-200 text-center">
                <div className="text-xs text-gray-600">{format(day, 'EEE')}</div>
                <div className="text-sm font-bold text-gray-900">{format(day, 'd')}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-8">
            <div className="border-r border-gray-200">
              {TIME_SLOTS.map(slot => (
                <div key={slot} className="h-16 px-2 py-1 border-b border-gray-200 text-xs text-gray-600">
                  {slot}
                </div>
              ))}
            </div>

            {weekDays.map(day => (
              <div key={day.toISOString()} className="border-r border-gray-200">
                {TIME_SLOTS.map(slot => {
                  const blocks = getBlocksForSlot(day, slot);

                  return (
                    <div
                      key={`${day.toISOString()}-${slot}`}
                      className="h-16 border-b border-gray-200 p-1 hover:bg-gray-50 transition-colors relative"
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(day, slot)}
                    >
                      {blocks.map(block => {
                        const color = block.area?.color_hex || block.area?.color || '#3B82F6';
                        const heightBlocks = Math.ceil(block.duration_minutes / 15);

                        return (
                          <div
                            key={block.id}
                            className="absolute inset-1 rounded-lg p-2 text-xs group cursor-pointer"
                            style={{
                              backgroundColor: `${color}20`,
                              borderLeft: `3px solid ${color}`,
                              height: `${heightBlocks * 4}rem`,
                            }}
                            onClick={() => toggleBlockComplete(block.id, block.completed)}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span className="font-medium text-gray-900 line-clamp-2">
                                {block.title}
                              </span>
                              {block.completed && (
                                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                              )}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {block.duration_minutes}m
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
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

      {showTimeBlockModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowTimeBlockModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">New Time Block</h2>
              <button
                onClick={() => setShowTimeBlockModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={newTimeBlock.title}
                  onChange={(e) => setNewTimeBlock({ ...newTimeBlock, title: e.target.value })}
                  placeholder="e.g., Deep Work, Meeting, Exercise"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={newTimeBlock.date}
                  onChange={(e) => setNewTimeBlock({ ...newTimeBlock, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                <input
                  type="time"
                  value={newTimeBlock.startTime}
                  onChange={(e) => setNewTimeBlock({ ...newTimeBlock, startTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  value={newTimeBlock.duration}
                  onChange={(e) => setNewTimeBlock({ ...newTimeBlock, duration: parseInt(e.target.value) || 60 })}
                  min="15"
                  step="15"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowTimeBlockModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTimeBlock}
                  disabled={!newTimeBlock.title.trim()}
                  className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
                >
                  Create Block
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
