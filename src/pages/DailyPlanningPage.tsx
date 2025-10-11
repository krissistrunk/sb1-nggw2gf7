import { useState, useEffect } from 'react';
import { Target, Heart, Zap, ChevronRight, CheckCircle2, Clock, Plus, X, Inbox, Flame, User, Trash2 } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useOrganization } from '../contexts/OrganizationContext';
import { useActions } from '../hooks/useActions';
import { DraggableActionItem } from '../components/DraggableActionItem';
import type { OutcomeWithRelations, DailyNote, Action, InboxItem } from '../lib/database.types';
import { BackgroundHeroSection } from '../components/BackgroundHeroSection';
import { ImageUploadModal } from '../components/ImageUploadModal';
import { usePageBackground } from '../hooks/usePageBackground';

type PlanningStep = 'welcome' | 'review-outcomes' | 'select-focus' | 'set-purpose' | 'plan-actions' | 'time-block' | 'commit';

export function DailyPlanningPage() {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const { deleteAction, reorderActions } = useActions();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  const [currentStep, setCurrentStep] = useState<PlanningStep>('welcome');
  const [outcomes, setOutcomes] = useState<OutcomeWithRelations[]>([]);
  const [selectedOutcomes, setSelectedOutcomes] = useState<OutcomeWithRelations[]>([]);
  const [morningIntention, setMorningIntention] = useState('');
  const [purposes, setPurposes] = useState<Record<string, string>>({});
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingActionForOutcome, setAddingActionForOutcome] = useState<string | null>(null);
  const [newActionTitle, setNewActionTitle] = useState('');
  const [newActionDuration, setNewActionDuration] = useState(30);
  const [actionIdeas, setActionIdeas] = useState<InboxItem[]>([]);
  const [showActionIdeas, setShowActionIdeas] = useState(false);
  const [editingAction, setEditingAction] = useState<string | null>(null);
  const [editActionTitle, setEditActionTitle] = useState('');
  const [editActionDuration, setEditActionDuration] = useState(30);
  const [mustActions, setMustActions] = useState<Set<string>>(new Set());
  const [delegatedActions, setDelegatedActions] = useState<Record<string, string>>({});
  const [editActionDelegatedTo, setEditActionDelegatedTo] = useState('');
  const [newActionDelegatedTo, setNewActionDelegatedTo] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const {
    getBackgroundUrl,
    getBackgroundPosition,
    getOverlayOpacity,
    updateBackground,
    uploadImage,
  } = usePageBackground('daily-planning');

  const today = new Date().toISOString().split('T')[0];
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  useEffect(() => {
    if (user && organization) {
      loadData();
    }
  }, [user, organization]);

  const loadData = async () => {
    try {
      const { data: outcomesData } = await supabase
        .from('outcomes')
        .select(`
          *,
          areas (*)
        `)
        .eq('user_id', user?.id)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false });

      if (!outcomesData) {
        setOutcomes([]);
        setLoading(false);
        return;
      }

      const outcomesWithActions = await Promise.all(
        outcomesData.map(async (outcome) => {
          const { data: actionsData } = await supabase
            .from('actions')
            .select('*')
            .eq('outcome_id', outcome.id)
            .eq('done', false)
            .order('sort_order', { ascending: true });

          return {
            ...outcome,
            actions: actionsData || [],
          } as OutcomeWithRelations;
        })
      );

      setOutcomes(outcomesWithActions);

      const { data: actionIdeasData } = await supabase
        .from('inbox_items')
        .select('*')
        .eq('user_id', user?.id)
        .eq('item_type', 'ACTION_IDEA')
        .eq('triaged', false)
        .order('created_at', { ascending: false });

      setActionIdeas(actionIdeasData || []);

      const { data: dailyNoteData } = await supabase
        .from('daily_notes')
        .select('*')
        .eq('user_id', user?.id)
        .eq('date', today)
        .maybeSingle();

      if (dailyNoteData) {
        setMorningIntention(dailyNoteData.morning_intention || '');
        setCurrentStep('commit');
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOutcome = (outcome: OutcomeWithRelations) => {
    if (selectedOutcomes.find((o) => o.id === outcome.id)) {
      setSelectedOutcomes(selectedOutcomes.filter((o) => o.id !== outcome.id));
      const newPurposes = { ...purposes };
      delete newPurposes[outcome.id];
      setPurposes(newPurposes);
    } else if (selectedOutcomes.length < 3) {
      setSelectedOutcomes([...selectedOutcomes, outcome]);
      setPurposes({ ...purposes, [outcome.id]: outcome.purpose || '' });
    }
  };

  const handleToggleAction = (actionId: string) => {
    if (selectedActions.includes(actionId)) {
      setSelectedActions(selectedActions.filter((id) => id !== actionId));
    } else {
      setSelectedActions([...selectedActions, actionId]);
    }
  };

  const handleToggleMust = (actionId: string) => {
    const newMustActions = new Set(mustActions);
    if (newMustActions.has(actionId)) {
      newMustActions.delete(actionId);
    } else {
      newMustActions.add(actionId);
    }
    setMustActions(newMustActions);
  };

  const handleDelegationChange = (actionId: string, delegatedTo: string) => {
    if (delegatedTo.trim()) {
      setDelegatedActions({ ...delegatedActions, [actionId]: delegatedTo });
    } else {
      const newDelegated = { ...delegatedActions };
      delete newDelegated[actionId];
      setDelegatedActions(newDelegated);
    }
  };

  const handleAddAction = async (outcomeId: string) => {
    if (!newActionTitle.trim()) return;

    try {
      const outcome = outcomes.find((o) => o.id === outcomeId);
      const maxSortOrder = outcome?.actions.length || 0;

      const { data: newAction } = await supabase
        .from('actions')
        .insert({
          user_id: user?.id,
          outcome_id: outcomeId,
          title: newActionTitle,
          duration_minutes: newActionDuration,
          done: false,
          delegated_to: newActionDelegatedTo.trim() || null,
          delegated_date: newActionDelegatedTo.trim() ? new Date().toISOString() : null,
          sort_order: maxSortOrder,
        })
        .select()
        .single();

      if (newAction) {
        setOutcomes(
          outcomes.map((o) =>
            o.id === outcomeId ? { ...o, actions: [...o.actions, newAction as Action] } : o
          )
        );

        setSelectedOutcomes(
          selectedOutcomes.map((o) =>
            o.id === outcomeId ? { ...o, actions: [...o.actions, newAction as Action] } : o
          )
        );

        setSelectedActions([...selectedActions, newAction.id]);
      }

      setNewActionTitle('');
      setNewActionDuration(30);
      setNewActionDelegatedTo('');
      setAddingActionForOutcome(null);
    } catch (error) {
      console.error('Error adding action:', error);
    }
  };

  const handleConvertActionIdea = async (inboxItem: InboxItem, outcomeId: string) => {
    try {
      const { data: newAction } = await supabase
        .from('actions')
        .insert({
          user_id: user?.id,
          outcome_id: outcomeId,
          title: inboxItem.content,
          duration_minutes: 30,
          done: false,
        })
        .select()
        .single();

      if (newAction) {
        await supabase
          .from('inbox_items')
          .update({ triaged: true, triaged_to_id: newAction.id })
          .eq('id', inboxItem.id);

        setOutcomes(
          outcomes.map((o) =>
            o.id === outcomeId ? { ...o, actions: [...o.actions, newAction as Action] } : o
          )
        );

        setSelectedOutcomes(
          selectedOutcomes.map((o) =>
            o.id === outcomeId ? { ...o, actions: [...o.actions, newAction as Action] } : o
          )
        );

        setSelectedActions([...selectedActions, newAction.id]);
        setActionIdeas(actionIdeas.filter((item) => item.id !== inboxItem.id));
      }
    } catch (error) {
      console.error('Error converting action idea:', error);
    }
  };

  const handleStartEditAction = (action: Action) => {
    setEditingAction(action.id);
    setEditActionTitle(action.title);
    setEditActionDuration(action.duration_minutes || 30);
    setEditActionDelegatedTo(action.delegated_to || '');
  };

  const handleSaveEditAction = async (actionId: string, outcomeId: string) => {
    if (!editActionTitle.trim()) return;

    try {
      const { data: updatedAction } = await supabase
        .from('actions')
        .update({
          title: editActionTitle,
          duration_minutes: editActionDuration,
          delegated_to: editActionDelegatedTo.trim() || null,
          delegated_date: editActionDelegatedTo.trim() ? new Date().toISOString() : null,
        })
        .eq('id', actionId)
        .select()
        .single();

      if (updatedAction) {
        setOutcomes(
          outcomes.map((o) =>
            o.id === outcomeId
              ? {
                  ...o,
                  actions: o.actions.map((a) =>
                    a.id === actionId ? (updatedAction as Action) : a
                  ),
                }
              : o
          )
        );

        setSelectedOutcomes(
          selectedOutcomes.map((o) =>
            o.id === outcomeId
              ? {
                  ...o,
                  actions: o.actions.map((a) =>
                    a.id === actionId ? (updatedAction as Action) : a
                  ),
                }
              : o
          )
        );
      }

      setEditingAction(null);
      setEditActionTitle('');
      setEditActionDuration(30);
      setEditActionDelegatedTo('');
    } catch (error) {
      console.error('Error updating action:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingAction(null);
    setEditActionTitle('');
    setEditActionDuration(30);
    setEditActionDelegatedTo('');
  };

  const handleDeleteAction = async (actionId: string, outcomeId: string) => {
    if (!confirm('Are you sure you want to delete this action?')) return;

    try {
      await deleteAction(actionId);

      setOutcomes(
        outcomes.map((o) =>
          o.id === outcomeId
            ? { ...o, actions: o.actions.filter((a) => a.id !== actionId) }
            : o
        )
      );

      setSelectedOutcomes(
        selectedOutcomes.map((o) =>
          o.id === outcomeId
            ? { ...o, actions: o.actions.filter((a) => a.id !== actionId) }
            : o
        )
      );

      setSelectedActions(selectedActions.filter((id) => id !== actionId));

      const newMustActions = new Set(mustActions);
      newMustActions.delete(actionId);
      setMustActions(newMustActions);

      if (editingAction === actionId) {
        handleCancelEdit();
      }
    } catch (error) {
      console.error('Error deleting action:', error);
      alert('Failed to delete action. Please try again.');
    }
  };

  const handleDragEnd = async (event: DragEndEvent, outcomeId: string) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const outcome = outcomes.find((o) => o.id === outcomeId);
    if (!outcome) return;

    const oldIndex = outcome.actions.findIndex((a) => a.id === active.id);
    const newIndex = outcome.actions.findIndex((a) => a.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedActions = arrayMove(outcome.actions, oldIndex, newIndex);

    setOutcomes(
      outcomes.map((o) =>
        o.id === outcomeId ? { ...o, actions: reorderedActions } : o
      )
    );

    setSelectedOutcomes(
      selectedOutcomes.map((o) =>
        o.id === outcomeId ? { ...o, actions: reorderedActions } : o
      )
    );

    try {
      const actionIds = reorderedActions.map((a) => a.id);
      await reorderActions(outcomeId, actionIds);
    } catch (error) {
      console.error('Error saving action order:', error);
      await loadData();
    }
  };

  const handleSaveDailyPlan = async () => {
    setSaving(true);
    try {
      const { data: existingNote } = await supabase
        .from('daily_notes')
        .select('id')
        .eq('user_id', user?.id)
        .eq('organization_id', organization?.id)
        .eq('date', today)
        .maybeSingle();

      if (existingNote) {
        await supabase
          .from('daily_notes')
          .update({
            morning_intention: morningIntention,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingNote.id);
      } else {
        await supabase.from('daily_notes').insert({
          user_id: user?.id,
          organization_id: organization?.id,
          date: today,
          morning_intention: morningIntention,
        });
      }

      await Promise.all(
        selectedActions.map((actionId) =>
          supabase
            .from('actions')
            .update({
              scheduled_date: today,
              is_must: mustActions.has(actionId),
            })
            .eq('id', actionId)
        )
      );

      window.location.href = '/today';
    } catch (error) {
      console.error('Error saving daily plan:', error);
    } finally {
      setSaving(false);
    }
  };

  const allActions = selectedOutcomes.flatMap((o) => o.actions);
  const selectedActionsList = allActions.filter((a) => selectedActions.includes(a.id));
  const totalEstimatedMinutes = selectedActionsList.reduce((sum, a) => sum + (a.duration_minutes || 60), 0);
  const mustEstimatedMinutes = selectedActionsList
    .filter((a) => mustActions.has(a.id))
    .reduce((sum, a) => sum + (a.duration_minutes || 60), 0);

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
          <Zap className="w-16 h-16 mx-auto mb-4 opacity-90" />
          <h1 className="text-5xl font-bold mb-4">Daily Planning Ritual</h1>
          <p className="text-xl text-white/90">{todayFormatted}</p>
        </div>
      </BackgroundHeroSection>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pb-12 space-y-6">
      {currentStep === 'welcome' && (
        <div className="bg-white rounded-2xl p-8 shadow-soft">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome to Your Daily Planning
          </h2>
          <p className="text-gray-700 mb-6">
            Using Tony Robbins' RPM methodology, we'll help you create a focused, purposeful day.
            This ritual takes 10-15 minutes and will set you up for success.
          </p>
          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Review Your Outcomes</h3>
                <p className="text-sm text-gray-600">
                  See all your active results and choose what matters most today
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Select 1-3 Focus Outcomes</h3>
                <p className="text-sm text-gray-600">
                  Pick the results that will move you forward most significantly
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Connect to Your Purpose</h3>
                <p className="text-sm text-gray-600">
                  Remind yourself WHY each outcome matters to you
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center flex-shrink-0">
                4
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Plan Your Massive Actions</h3>
                <p className="text-sm text-gray-600">
                  Select the specific actions you'll take today to achieve your results
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center flex-shrink-0">
                5
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Commit & Begin</h3>
                <p className="text-sm text-gray-600">
                  Set your intention and start your day with clarity and purpose
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setCurrentStep('review-outcomes')}
            className="w-full px-8 py-4 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors shadow-lg flex items-center justify-center gap-2"
          >
            Begin Daily Planning
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {currentStep === 'review-outcomes' && (
        <div className="bg-white rounded-2xl p-8 shadow-soft">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Your Active Outcomes</h2>
            <p className="text-gray-600">
              These are all your current results. In the next step, you'll choose 1-3 to focus on
              today.
            </p>
          </div>

          {outcomes.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Target className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No Outcomes Yet</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Create your first outcome to begin planning</p>
              <a
                href="/outcomes"
                className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-primary-500 text-white rounded-lg sm:rounded-xl font-semibold hover:bg-primary-600 transition-colors text-sm sm:text-base min-h-touch-target"
              >
                Create Outcome
              </a>
            </div>
          ) : (
            <>
              <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                {outcomes.map((outcome) => (
                  <div
                    key={outcome.id}
                    className="border-2 border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      <Target className="w-5 h-5 sm:w-6 sm:h-6 text-primary-500 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">{outcome.title}</h3>
                        {outcome.description && (
                          <p className="text-xs sm:text-sm text-gray-600 mb-2">{outcome.description}</p>
                        )}
                        <div className="flex items-center gap-2 mb-2 sm:mb-3">
                          <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 flex-shrink-0" />
                          <p className="text-xs sm:text-sm text-gray-700 italic">{outcome.purpose}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                          <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>{outcome.actions.length} actions in MAP</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setCurrentStep('select-focus')}
                className="w-full px-6 sm:px-8 py-3 sm:py-4 bg-primary-500 text-white rounded-lg sm:rounded-xl font-semibold hover:bg-primary-600 transition-colors shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base min-h-touch-target"
              >
                Continue to Focus Selection
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </>
          )}
        </div>
      )}

      {currentStep === 'select-focus' && (
        <div className="bg-white rounded-2xl p-8 shadow-soft">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Select 1-3 Outcomes to Focus On Today
            </h2>
            <p className="text-gray-600">
              Choose the results that will have the biggest impact. Quality over quantity!
            </p>
            <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs sm:text-sm text-blue-800">
                <strong>Selected: {selectedOutcomes.length} / 3</strong>
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-8">
            {outcomes.map((outcome) => {
              const isSelected = selectedOutcomes.find((o) => o.id === outcome.id);
              return (
                <button
                  key={outcome.id}
                  onClick={() => handleSelectOutcome(outcome)}
                  disabled={!isSelected && selectedOutcomes.length >= 3}
                  className={`w-full text-left p-6 border-2 rounded-xl transition-all ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                        isSelected
                          ? 'border-primary-500 bg-primary-500 text-white'
                          : 'border-gray-300'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{outcome.title}</h3>
                      <p className="text-sm text-gray-600">{outcome.purpose}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentStep('set-purpose')}
            disabled={selectedOutcomes.length === 0}
            className="w-full px-8 py-4 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to Purpose
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {currentStep === 'set-purpose' && (
        <div className="bg-white rounded-2xl p-8 shadow-soft">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect to Your Purpose</h2>
            <p className="text-gray-600">
              Remind yourself WHY these outcomes matter. This is what will fuel your motivation and
              focus.
            </p>
          </div>

          <div className="space-y-6 mb-8">
            {selectedOutcomes.map((outcome) => (
              <div key={outcome.id} className="border-2 border-primary-200 rounded-xl p-6 bg-primary-50">
                <div className="flex items-start gap-3 mb-4">
                  <Target className="w-6 h-6 text-primary-600 flex-shrink-0 mt-1" />
                  <h3 className="text-xl font-bold text-gray-900">{outcome.title}</h3>
                </div>
                <div className="flex items-start gap-2 mb-3">
                  <Heart className="w-5 h-5 text-red-500 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Why this matters:</p>
                    <p className="text-lg text-gray-900 italic leading-relaxed">
                      {purposes[outcome.id] || outcome.purpose}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-900 mb-3">
              Set Your Morning Intention
            </label>
            <textarea
              value={morningIntention}
              onChange={(e) => setMorningIntention(e.target.value)}
              placeholder="What is your intention for today? How will you show up?"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          <button
            onClick={() => setCurrentStep('plan-actions')}
            className="w-full px-8 py-4 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors shadow-lg flex items-center justify-center gap-2"
          >
            Continue to Action Planning
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {currentStep === 'plan-actions' && (
        <div className="bg-white rounded-2xl p-8 shadow-soft">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Your Massive Actions</h2>
            <p className="text-gray-600">
              Choose the specific actions you'll take today to achieve your outcomes. Focus on
              high-impact actions.
            </p>
            <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex flex-col gap-2">
                <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2">
                  <p className="text-xs sm:text-sm text-green-800">
                    <strong>Actions selected: {selectedActions.length}</strong>
                  </p>
                  <p className="text-xs sm:text-sm text-green-800 flex items-center gap-1">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                    <strong>Total: ~{totalEstimatedMinutes} minutes</strong>
                  </p>
                </div>
                {mustEstimatedMinutes > 0 && (
                  <div className="flex items-center gap-1 text-xs sm:text-sm">
                    <Flame className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600" />
                    <strong className="text-orange-800">
                      Must Actions: ~{mustEstimatedMinutes} min ({Math.round((mustEstimatedMinutes / totalEstimatedMinutes) * 100)}% of total)
                    </strong>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6 mb-8">
            {selectedOutcomes.map((outcome) => (
              <div key={outcome.id} className="border-2 border-primary-200 rounded-xl p-6 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{outcome.title}</h3>
                  <button
                    onClick={() => setAddingActionForOutcome(outcome.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Action
                  </button>
                </div>

                {addingActionForOutcome === outcome.id && (
                  <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-white rounded-lg border-2 border-primary-300">
                    <div className="flex flex-col gap-2 mb-3">
                      <input
                        type="text"
                        value={newActionTitle}
                        onChange={(e) => setNewActionTitle(e.target.value)}
                        placeholder="What action will you take?"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
                        autoFocus
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            handleAddAction(outcome.id);
                          }
                        }}
                      />
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <input
                            type="number"
                            value={newActionDuration}
                            onChange={(e) => setNewActionDuration(parseInt(e.target.value) || 30)}
                            min="5"
                            max="480"
                            step="5"
                            className="w-12 sm:w-16 bg-transparent focus:outline-none text-sm sm:text-base"
                          />
                          <span className="text-xs sm:text-sm text-gray-600">min</span>
                        </div>
                        <input
                          type="text"
                          value={newActionDelegatedTo}
                          onChange={(e) => setNewActionDelegatedTo(e.target.value)}
                          placeholder="Delegate to (optional)"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
                        />
                        <button
                          onClick={() => handleAddAction(outcome.id)}
                          disabled={!newActionTitle.trim()}
                          className="px-3 sm:px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 min-h-touch-target"
                        >
                          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <button
                          onClick={() => {
                            setAddingActionForOutcome(null);
                            setNewActionTitle('');
                            setNewActionDuration(30);
                            setNewActionDelegatedTo('');
                          }}
                          className="px-3 sm:px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors min-h-touch-target"
                        >
                          <X className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </div>

                    {actionIdeas.length > 0 && (
                      <div className="border-t pt-3">
                        <button
                          onClick={() => setShowActionIdeas(!showActionIdeas)}
                          className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 mb-2"
                        >
                          <Inbox className="w-4 h-4" />
                          {showActionIdeas ? 'Hide' : 'Show'} brainstormed action ideas ({actionIdeas.length})
                        </button>

                        {showActionIdeas && (
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {actionIdeas.map((idea) => (
                              <button
                                key={idea.id}
                                onClick={() => handleConvertActionIdea(idea, outcome.id)}
                                className="w-full text-left p-2 bg-blue-50 border border-blue-200 rounded text-sm hover:bg-blue-100 transition-colors"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-gray-900">{idea.content}</span>
                                  <Plus className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {outcome.actions.length === 0 && addingActionForOutcome !== outcome.id ? (
                  <p className="text-sm text-gray-500 italic">
                    No actions yet. Click "Add Action" to create your Massive Action Plan.
                  </p>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event) => handleDragEnd(event, outcome.id)}
                  >
                    <SortableContext
                      items={outcome.actions.map((a) => a.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {outcome.actions.map((action) => {
                          const isSelected = selectedActions.includes(action.id);
                          const isEditing = editingAction === action.id;
                          const isMust = mustActions.has(action.id);
                          const isDelegated = !!action.delegated_to;

                          return (
                            <DraggableActionItem
                              key={action.id}
                              action={action}
                              isSelected={isSelected}
                              isMust={isMust}
                              isEditing={isEditing}
                              isDelegated={isDelegated}
                              editActionTitle={editActionTitle}
                              editActionDuration={editActionDuration}
                              editActionDelegatedTo={editActionDelegatedTo}
                              onToggleAction={handleToggleAction}
                              onToggleMust={handleToggleMust}
                              onStartEdit={handleStartEditAction}
                              onSaveEdit={handleSaveEditAction}
                              onCancelEdit={handleCancelEdit}
                              onDelete={handleDeleteAction}
                              setEditActionTitle={setEditActionTitle}
                              setEditActionDuration={setEditActionDuration}
                              setEditActionDelegatedTo={setEditActionDelegatedTo}
                            />
                          );
                        })}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => setCurrentStep('commit')}
            disabled={selectedActions.length === 0}
            className="w-full px-8 py-4 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Review & Commit
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {currentStep === 'commit' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-8 text-white shadow-soft-lg">
            <h2 className="text-3xl font-bold mb-4">Your Daily Plan is Ready!</h2>
            <p className="text-xl text-green-100">
              You've created a focused, purposeful plan for today. Now it's time to take massive
              action!
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-soft">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Today's Focus Outcomes</h3>
            <div className="space-y-4 mb-6">
              {selectedOutcomes.map((outcome) => (
                <div key={outcome.id} className="border-l-4 border-primary-500 pl-4">
                  <h4 className="font-bold text-gray-900">{outcome.title}</h4>
                  <p className="text-sm text-gray-600 italic mt-1">
                    <Heart className="w-3 h-3 inline mr-1" />
                    {purposes[outcome.id] || outcome.purpose}
                  </p>
                </div>
              ))}
            </div>

            {morningIntention && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-6">
                <p className="text-sm font-semibold text-blue-900 mb-1">Your Intention:</p>
                <p className="text-blue-800">{morningIntention}</p>
              </div>
            )}

            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">
                Actions for Today ({selectedActions.length})
              </h4>
              <div className="space-y-2">
                {allActions
                  .filter((a) => selectedActions.includes(a.id))
                  .map((action) => (
                    <div key={action.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Zap className="w-4 h-4 text-primary-500" />
                      <span className="text-gray-900">{action.title}</span>
                      <span className="text-xs text-gray-500 ml-auto">
                        {action.duration_minutes || 60}min
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep('welcome')}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Start Over
              </button>
              <button
                onClick={handleSaveDailyPlan}
                disabled={saving}
                className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors shadow-lg disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save & Go to Today View'}
              </button>
            </div>
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
