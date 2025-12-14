import { useState, useEffect } from 'react';
import { Target, Plus, X, Check, Timer, Flame, User, Clock, Trash2, Inbox, Zap, Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useOrganization } from '../contexts/OrganizationContext';
import { useActions } from '../hooks/useActions';
import { FocusTimer } from '../components/FocusTimer';
import { DailyProgressWidget } from '../components/DailyProgressWidget';
import { AIDailyPlanner } from '../components/AIDailyPlanner';
import type { Action as ActionType } from '../lib/database.types';
import { BackgroundHeroSection } from '../components/BackgroundHeroSection';
import { ImageUploadModal } from '../components/ImageUploadModal';
import { usePageBackground } from '../hooks/usePageBackground';
import { OUTCOME_STATUS } from '../constants/status';

interface Outcome {
  id: string;
  title: string;
  area_id: string;
  purpose?: string | null;
}

interface ActionExtended {
  id: string;
  title: string;
  done: boolean;
  outcome_id: string;
  duration_minutes: number;
  is_must: boolean;
  delegated_to: string | null;
}

export function TodayPage() {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const { deleteAction } = useActions();
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [selectedOutcomes, setSelectedOutcomes] = useState<Outcome[]>([]);
  const [todayActions, setTodayActions] = useState<ActionExtended[]>([]);
  const [allOutcomeActions, setAllOutcomeActions] = useState<Record<string, ActionExtended[]>>({});
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showFocusTimer, setShowFocusTimer] = useState(false);
  const [selectedAction, setSelectedAction] = useState<ActionType | undefined>(undefined);
  const [showImageModal, setShowImageModal] = useState(false);
  const [quickAddAction, setQuickAddAction] = useState('');
  const {
    getBackgroundUrl,
    getBackgroundPosition,
    getOverlayOpacity,
    updateBackground,
    uploadImage,
  } = usePageBackground('today');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: outcomesData } = await supabase
        .from('outcomes')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', OUTCOME_STATUS.ACTIVE)
        .order('created_at', { ascending: false });

      const { data: actionsData } = await supabase
        .from('actions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('scheduled_date', today)
        .order('is_must', { ascending: false })
        .order('created_at', { ascending: false });

      setOutcomes(outcomesData || []);
      setTodayActions(actionsData || []);

      const selectedIds =
        actionsData?.map(a => a.outcome_id).filter((v, i, a) => a.indexOf(v) === i).slice(0, 5) || [];
      const selected = (outcomesData || []).filter(o => selectedIds.includes(o.id));
      setSelectedOutcomes(selected);

      if (selected.length > 0) {
        await loadSelectedOutcomeActions(selected.map(o => o.id));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedOutcomeActions = async (outcomeIds: string[]) => {
    try {
      const actionsMap: Record<string, ActionExtended[]> = {};

      for (const outcomeId of outcomeIds) {
        const { data } = await supabase
          .from('actions')
          .select('*')
          .eq('outcome_id', outcomeId)
          .eq('done', false)
          .order('is_must', { ascending: false })
          .order('sort_order', { ascending: true })
          .limit(10);

        actionsMap[outcomeId] = data || [];
      }

      setAllOutcomeActions(actionsMap);
    } catch (error) {
      console.error('Error loading outcome actions:', error);
    }
  };

  const handleSelectOutcome = async (outcome: Outcome) => {
    if (selectedOutcomes.length < 5 && !selectedOutcomes.find(o => o.id === outcome.id)) {
      const newSelected = [...selectedOutcomes, outcome];
      setSelectedOutcomes(newSelected);
      await loadSelectedOutcomeActions([outcome.id]);
    }
    setShowOutcomeModal(false);
  };

  const handleRemoveOutcome = (outcomeId: string) => {
    setSelectedOutcomes(selectedOutcomes.filter(o => o.id !== outcomeId));
  };

  const toggleAction = async (actionId: string, done: boolean) => {
    await supabase
      .from('actions')
      .update({ done, completed_at: done ? new Date().toISOString() : null })
      .eq('id', actionId);

    loadData();
  };

  const handleDeleteAction = async (actionId: string) => {
    if (!confirm('Are you sure you want to delete this action?')) return;

    try {
      await deleteAction(actionId);
      loadData();
    } catch (error) {
      console.error('Error deleting action:', error);
    }
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddAction.trim() || !user) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      if (selectedOutcomes.length > 0) {
        const firstOutcomeId = selectedOutcomes[0].id;
        await supabase.from('actions').insert({
          user_id: user.id,
          outcome_id: firstOutcomeId,
          title: quickAddAction.trim(),
          scheduled_date: today,
          done: false,
        });
      } else {
        // Use organization from context - guaranteed to exist due to ProtectedRoute
        if (!organization) {
          console.error('No organization found');
          return;
        }
        
        await supabase.from('inbox_items').insert({
          user_id: user.id,
          organization_id: organization.id,
          content: quickAddAction.trim(),
          item_type: 'ACTION_IDEA',
          triaged: false,
        });
      }

      setQuickAddAction('');
      loadData();
    } catch (error) {
      console.error('Error adding quick action:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <BackgroundHeroSection
        imageUrl={getBackgroundUrl()}
        imagePosition={getBackgroundPosition()}
        overlayOpacity={getOverlayOpacity()}
        height="h-64"
        onEditClick={() => setShowImageModal(true)}
      >
        <div className="text-center text-white px-4">
          <Target className="w-16 h-16 mx-auto mb-4 opacity-90" />
          <h1 className="text-5xl font-bold mb-4">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h1>
          <p className="text-xl text-white/90">What will move you forward today?</p>
        </div>
      </BackgroundHeroSection>

      {/* FIX APPLIED HERE: removed -mt-12, added relative z-10 mt-8 */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pb-12 space-y-4 sm:space-y-6 lg:space-y-8">

        <DailyProgressWidget />

        {/* Quick Add Action */}
        <form onSubmit={handleQuickAdd} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-soft border border-gray-200">
          <div className="flex flex-col gap-2">
            {selectedOutcomes.length > 0 ? (
              <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                <Target className="w-3 h-3 text-primary-500" />
                <span>Adding to: <span className="font-semibold text-primary-600">{selectedOutcomes[0].title}</span></span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                <Inbox className="w-3 h-3 text-gray-500" />
                <span>Will be saved to Inbox (select an outcome above first to add directly)</span>
              </div>
            )}
            <div className="flex gap-2 sm:gap-3">
              <input
                type="text"
                value={quickAddAction}
                onChange={(e) => setQuickAddAction(e.target.value)}
                placeholder="Quick add action for today..."
                className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg sm:rounded-xl text-sm sm:text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!quickAddAction.trim()}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-primary-500 text-white rounded-lg sm:rounded-xl font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base whitespace-nowrap"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden xs:inline">Add</span>
              </button>
            </div>
          </div>
        </form>

        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-soft">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-2">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Today's Top 5 Outcomes</h2>
            <div className="flex items-center gap-2">
              <AIDailyPlanner
                outcomes={outcomes}
                actions={todayActions}
                onRecommendationAccepted={async (outcomeIds) => {
                  const recommended = outcomes.filter(o => outcomeIds.includes(o.id)).slice(0, 5);
                  setSelectedOutcomes(recommended);

                  const today = new Date().toISOString().split('T')[0];

                  for (const outcomeId of outcomeIds) {
                    const { data: outcomeActions } = await supabase
                      .from('actions')
                      .select('*')
                      .eq('outcome_id', outcomeId)
                      .eq('done', false)
                      .is('scheduled_date', null)
                      .order('is_must', { ascending: false })
                      .order('sort_order', { ascending: true })
                      .limit(3);

                    if (outcomeActions && outcomeActions.length > 0) {
                      for (const action of outcomeActions) {
                        await supabase
                          .from('actions')
                          .update({ scheduled_date: today })
                          .eq('id', action.id);
                      }
                    }
                  }

                  await loadData();
                  await loadSelectedOutcomeActions(outcomeIds);
                }}
              />
              <div className="flex gap-2 text-xs sm:text-sm">
                <div className="flex items-center gap-1 px-2 py-1 bg-orange-50 rounded">
                  <Flame className="w-3 h-3 text-orange-600" />
                  <span className="text-orange-800 font-medium">
                    {todayActions.filter(a => a.is_must && !a.done).length} Must
                  </span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded">
                  <Clock className="w-3 h-3 text-blue-600" />
                  <span className="text-blue-800 font-medium">
                    {todayActions.reduce((sum, a) => sum + (a.duration_minutes || 0), 0)} min
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
            {selectedOutcomes.map(outcome => (
              <div key={outcome.id} className="px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 bg-primary-50 border-2 border-primary-500 rounded-lg sm:rounded-xl text-primary-700 flex items-center gap-2 text-sm sm:text-base">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="truncate">{outcome.title}</span>
                <button onClick={() => handleRemoveOutcome(outcome.id)} className="ml-1 sm:ml-2 hover:text-primary-900 flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {selectedOutcomes.length < 5 && (
              <button
                onClick={() => setShowOutcomeModal(true)}
                className="px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 border-2 border-dashed border-gray-300 rounded-lg sm:rounded-xl text-gray-500 hover:border-primary-500 hover:text-primary-600 transition-colors flex items-center gap-2 text-sm sm:text-base min-h-touch-target"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden xs:inline">Select Outcome</span>
                <span className="xs:hidden">Add</span>
              </button>
            )}
          </div>

          {selectedOutcomes.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Target className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 opacity-40 text-gray-400" />
              <p className="text-sm sm:text-base text-gray-600 mb-4">Select up to 5 outcomes to focus on today</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <button
                  onClick={() => window.location.href = '/daily-planning'}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg sm:rounded-xl font-semibold hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg flex items-center gap-2 text-sm sm:text-base min-h-touch-target"
                >
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                  Start Daily Planning Ritual
                </button>
                <button
                  onClick={() => setShowOutcomeModal(true)}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-gray-300 text-gray-700 rounded-lg sm:rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm sm:text-base min-h-touch-target"
                >
                  Select Outcomes Manually
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-4">The planning ritual helps you choose the right focus for today</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {selectedOutcomes.map(outcome => {
                const scheduledActions = todayActions.filter(a => a.outcome_id === outcome.id);
                const allActions = allOutcomeActions[outcome.id] || [];
                const actions = scheduledActions.length > 0 ? scheduledActions : allActions.slice(0, 5);

                return (
                  <div key={outcome.id} className="border-l-4 border-primary-500 pl-3 sm:pl-4">
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">{outcome.title}</h3>
                    {outcome.purpose && (
                      <div className="mb-3 p-3 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border-2 border-red-200">
                        <div className="flex items-start gap-2">
                          <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-red-900 text-xs sm:text-sm mb-1">Your WHY:</h4>
                            <p className="text-xs sm:text-sm text-red-800 italic leading-relaxed">{outcome.purpose}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {actions.length > 0 ? (
                      <div className="space-y-2">
                        {actions.map(action => (
                          <div key={action.id} className={`flex items-center gap-2 sm:gap-3 group min-h-touch-target p-2 rounded ${
                            action.is_must ? 'bg-orange-50 border border-orange-200' : ''
                          } ${action.delegated_to ? 'opacity-60' : ''}`}>
                            <button
                              onClick={() => toggleAction(action.id, !action.done)}
                              className={`w-5 h-5 sm:w-6 sm:h-6 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                                action.done
                                  ? 'bg-primary-500 border-primary-500 text-white'
                                  : 'border-gray-300 hover:border-primary-500'
                              }`}
                            >
                              {action.done && <Check className="w-3 h-3 sm:w-4 sm:h-4" />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-sm sm:text-base ${
                                  action.done ? 'line-through text-gray-500' : 'text-gray-700'
                                }`}>
                                  {action.title}
                                </span>
                                {action.is_must && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-orange-200 text-orange-900 text-xs font-semibold rounded">
                                    <Flame className="w-3 h-3" />
                                    MUST
                                  </span>
                                )}
                                {action.delegated_to && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                                    <User className="w-3 h-3" />
                                    {action.delegated_to}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">
                                ~{action.duration_minutes || 60} min
                              </p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {!action.done && !action.delegated_to && (
                                <button
                                  onClick={() => {
                                    setSelectedAction(action as ActionType);
                                    setShowFocusTimer(true);
                                  }}
                                  className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1.5 sm:p-1 hover:bg-blue-100 rounded text-blue-600"
                                  title="Start Focus Timer"
                                >
                                  <Timer className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteAction(action.id)}
                                className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1.5 sm:p-1 hover:bg-red-100 rounded text-red-600"
                                title="Delete Action"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm text-gray-500">No actions scheduled for today</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-soft-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-start sm:justify-between gap-3 sm:gap-4">
            <div className="flex-1">
              <h3 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Ready to Start?</h3>
              <p className="text-sm sm:text-base text-primary-100">Begin with your most important action</p>
            </div>
            <button
              onClick={() => {
                setSelectedAction(undefined);
                setShowFocusTimer(true);
              }}
              className="w-full sm:w-auto bg-white text-primary-600 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold hover:bg-primary-50 transition-colors flex items-center justify-center gap-2 shadow-lg text-sm sm:text-base min-h-touch-target"
            >
              <Timer className="w-4 h-4 sm:w-5 sm:h-5" />
              Start Focus Timer
            </button>
          </div>
        </div>

        <FocusTimer
          isOpen={showFocusTimer}
          onClose={() => {
            setShowFocusTimer(false);
            setSelectedAction(undefined);
            loadData();
          }}
          action={selectedAction}
        />

        {showOutcomeModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4" onClick={() => setShowOutcomeModal(false)}>
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 max-w-2xl w-full max-h-[85vh] sm:max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Select an Outcome</h2>
                <button onClick={() => setShowOutcomeModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
              {outcomes.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {outcomes.map(outcome => (
                    <button
                      key={outcome.id}
                      onClick={() => handleSelectOutcome(outcome)}
                      disabled={selectedOutcomes.find(o => o.id === outcome.id) !== undefined}
                      className="w-full text-left p-3 sm:p-4 border-2 border-gray-200 rounded-lg sm:rounded-xl hover:border-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-touch-target"
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Target className="w-4 h-4 sm:w-5 sm:h-5 text-primary-500 flex-shrink-0" />
                        <span className="font-medium text-gray-900 text-sm sm:text-base">{outcome.title}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12 text-gray-500">
                  <Target className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 opacity-40" />
                  <p className="mb-3 sm:mb-4 text-sm sm:text-base">No outcomes yet</p>
                  <button
                    onClick={() => window.location.href = '/outcomes'}
                    className="px-4 sm:px-6 py-2.5 sm:py-3 bg-primary-500 text-white rounded-lg sm:rounded-xl font-semibold hover:bg-primary-600 transition-colors text-sm sm:text-base min-h-touch-target"
                  >
                    Create Your First Outcome
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
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
