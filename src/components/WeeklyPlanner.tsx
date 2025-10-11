import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import type { OutcomeWithRelations, Action, TimeBlock } from '../lib/database.types';
import { useActions } from '../hooks/useActions';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useOrganization } from '../contexts/OrganizationContext';

interface WeeklyPlannerProps {
  outcomes: OutcomeWithRelations[];
  onRefresh: () => void;
}

interface DaySchedule {
  date: string;
  dayName: string;
  actions: Action[];
}

export function WeeklyPlanner({ outcomes, onRefresh }: WeeklyPlannerProps) {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const { scheduleAction, toggleAction, deleteAction } = useActions();
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const [weekSchedule, setWeekSchedule] = useState<DaySchedule[]>([]);
  const [selectedOutcome, setSelectedOutcome] = useState<string>('all');
  const [draggedAction, setDraggedAction] = useState<Action | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'timeblocks'>('calendar');
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    generateWeekSchedule();
    if (viewMode === 'timeblocks') {
      loadTimeBlocks();
    }
  }, [currentWeek, outcomes, viewMode]);

  const loadTimeBlocks = async () => {
    if (!user || !organization) return;

    const startOfWeek = getMonday(currentWeek);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const { data, error } = await supabase
      .from('time_blocks')
      .select('*')
      .eq('user_id', user.id)
      .eq('organization_id', organization.id)
      .gte('start_time', startOfWeek.toISOString())
      .lte('start_time', endOfWeek.toISOString())
      .order('start_time');

    if (!error && data) {
      setTimeBlocks(data);
    }
  };

  const generateWeekSchedule = () => {
    const startOfWeek = getMonday(currentWeek);
    const schedule: DaySchedule[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateString = date.toISOString().split('T')[0];

      const dayActions = outcomes.flatMap((o) =>
        o.actions.filter((a) => a.scheduled_date === dateString)
      );

      schedule.push({
        date: dateString,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        actions: dayActions,
      });
    }

    setWeekSchedule(schedule);
  };

  const getMonday = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const previousWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(currentWeek.getDate() - 7);
    setCurrentWeek(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(currentWeek.getDate() + 7);
    setCurrentWeek(newDate);
  };

  const thisWeek = () => {
    setCurrentWeek(new Date());
  };

  const handleDragStart = (action: Action) => {
    setDraggedAction(action);
  };

  const handleDrop = async (dateString: string) => {
    if (!draggedAction) return;

    try {
      await scheduleAction(draggedAction.id, dateString);
      setDraggedAction(null);
      onRefresh();
    } catch (err) {
      console.error('Failed to schedule action:', err);
    }
  };

  const handleToggleAction = async (actionId: string, done: boolean) => {
    try {
      await toggleAction(actionId, !done);
      onRefresh();
    } catch (err) {
      console.error('Failed to toggle action:', err);
    }
  };

  const handleDeleteAction = async (actionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!confirm('Are you sure you want to delete this action?')) return;

    try {
      await deleteAction(actionId);
      onRefresh();
    } catch (err) {
      console.error('Failed to delete action:', err);
    }
  };

  const activeOutcomes = outcomes.filter((o) => o.status === 'ACTIVE');
  const unscheduledActions =
    selectedOutcome === 'all'
      ? activeOutcomes.flatMap((o) => o.actions.filter((a) => !a.scheduled_date && !a.done))
      : activeOutcomes
          .find((o) => o.id === selectedOutcome)
          ?.actions.filter((a) => !a.scheduled_date && !a.done) || [];

  const startDate = getMonday(currentWeek);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  const renderTimeBlockView = () => {
    const hours = Array.from({ length: 16 }, (_, i) => i + 6);
    const selectedDate = new Date(selectedDay);
    const dayBlocks = timeBlocks.filter(block => {
      const blockDate = new Date(block.start_time).toISOString().split('T')[0];
      return blockDate === selectedDay;
    });

    return (
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {weekSchedule.map((day) => (
                <option key={day.date} value={day.date}>
                  {day.dayName} - {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[600px]">
          {hours.map((hour) => {
            const hourBlocks = dayBlocks.filter(block => {
              const blockHour = new Date(block.start_time).getHours();
              return blockHour === hour;
            });

            return (
              <div key={hour} className="flex border-b border-gray-100">
                <div className="w-20 flex-shrink-0 p-3 text-sm font-medium text-gray-500 border-r border-gray-200">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div className="flex-1 p-2 min-h-[60px] relative">
                  {hourBlocks.length > 0 ? (
                    <div className="space-y-1">
                      {hourBlocks.map((block) => {
                        const action = outcomes
                          .flatMap(o => o.actions)
                          .find(a => a.id === block.action_id);
                        return (
                          <div
                            key={block.id}
                            className={`p-2 rounded-lg text-sm ${
                              block.completed
                                ? 'bg-green-100 text-green-900'
                                : 'bg-blue-100 text-blue-900'
                            }`}
                          >
                            <div className="font-medium">
                              {action?.title || 'Focus Session'}
                            </div>
                            <div className="text-xs opacity-70">
                              {block.duration_minutes} minutes
                              {block.completed && ' - Completed'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 italic">Available</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Weekly Planning</h1>
          <p className="text-gray-600">Schedule your action items and plan your week</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              viewMode === 'calendar'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            Calendar
          </button>
          <button
            onClick={() => setViewMode('timeblocks')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              viewMode === 'timeblocks'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            Time Blocks
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-gray-200">
        <button
          onClick={previousWeek}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">
            {startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} -{' '}
            {endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </h2>
          <button
            onClick={thisWeek}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-1"
          >
            Today
          </button>
        </div>

        <button
          onClick={nextWeek}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {viewMode === 'timeblocks' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {renderTimeBlockView()}
          </div>
          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
            <Clock className="w-8 h-8 text-blue-500 mb-3" />
            <h3 className="font-semibold text-blue-900 mb-2">Time Block View</h3>
            <p className="text-sm text-blue-700 mb-4">
              View your completed focus sessions throughout the week. Each block represents
              a focused work session you've completed using the Focus Timer.
            </p>
            <div className="space-y-2 text-xs text-blue-600">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-100 rounded"></div>
                <span>Active Session</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-100 rounded"></div>
                <span>Completed Session</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-7 border-b border-gray-200">
              {weekSchedule.map((day) => {
                const isToday = day.date === new Date().toISOString().split('T')[0];
                const completedCount = day.actions.filter((a) => a.done).length;
                const totalCount = day.actions.length;

                return (
                  <div
                    key={day.date}
                    className={`p-4 text-center border-r border-gray-200 last:border-r-0 ${
                      isToday ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="text-sm font-semibold text-gray-600 mb-1">
                      {day.dayName}
                    </div>
                    <div className={`text-2xl font-bold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                      {new Date(day.date).getDate()}
                    </div>
                    {totalCount > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        {completedCount}/{totalCount}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-7">
              {weekSchedule.map((day) => (
                <div
                  key={day.date}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(day.date)}
                  className="min-h-[200px] p-3 border-r border-gray-200 last:border-r-0 space-y-2"
                >
                  {day.actions.map((action) => {
                    const outcome = outcomes.find((o) => o.id === action.outcome_id);
                    return (
                      <div
                        key={action.id}
                        draggable
                        onDragStart={() => handleDragStart(action)}
                        className={`group relative p-1.5 sm:p-2 rounded-lg text-[10px] sm:text-xs cursor-move hover:shadow-md transition-shadow ${
                          action.done
                            ? 'bg-gray-100 text-gray-500 line-through'
                            : 'bg-blue-50 text-blue-900'
                        }`}
                      >
                        <div
                          className="flex items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1"
                          onClick={() => handleToggleAction(action.id, action.done)}
                        >
                          <input
                            type="checkbox"
                            checked={action.done}
                            onChange={() => {}}
                            className="flex-shrink-0 cursor-pointer w-3 h-3 sm:w-4 sm:h-4"
                          />
                          <span className="font-medium line-clamp-2 flex-1">{action.title}</span>
                          <button
                            onClick={(e) => handleDeleteAction(action.id, e)}
                            className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-0.5 hover:bg-red-100 rounded text-red-600 flex-shrink-0"
                            title="Delete Action"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        {outcome && (
                          <div className="text-[9px] sm:text-[10px] opacity-60 truncate">
                            {outcome.title}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Unscheduled Actions</h3>

            <select
              value={selectedOutcome}
              onChange={(e) => setSelectedOutcome(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 sm:mb-3 text-sm"
            >
              <option value="all">All Outcomes</option>
              {activeOutcomes.map((outcome) => (
                <option key={outcome.id} value={outcome.id}>
                  {outcome.title}
                </option>
              ))}
            </select>

            <div className="space-y-2 max-h-[400px] sm:max-h-[600px] overflow-y-auto">
              {unscheduledActions.length === 0 ? (
                <p className="text-xs sm:text-sm text-gray-500 text-center py-3 sm:py-4">
                  All actions are scheduled
                </p>
              ) : (
                unscheduledActions.map((action) => {
                  const outcome = outcomes.find((o) => o.id === action.outcome_id);
                  return (
                    <div
                      key={action.id}
                      draggable
                      onDragStart={() => handleDragStart(action)}
                      className="group p-2 sm:p-3 bg-gray-50 rounded-lg cursor-move hover:bg-gray-100 transition-colors relative"
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-xs sm:text-sm text-gray-900 mb-1">
                            {action.title}
                          </div>
                          {outcome && (
                            <div className="text-[10px] sm:text-xs text-gray-600 truncate">
                              {outcome.title}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={(e) => handleDeleteAction(action.id, e)}
                          className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded text-red-600 flex-shrink-0"
                          title="Delete Action"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2 text-xs sm:text-sm">Drag & Drop</h3>
            <p className="text-[10px] sm:text-xs text-blue-700">
              Drag unscheduled actions to any day on the calendar to schedule them.
            </p>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
