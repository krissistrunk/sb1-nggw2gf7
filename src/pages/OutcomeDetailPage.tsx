import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Target, Heart, Zap, Plus, Trash2, GripVertical, CreditCard as Edit2, ArrowLeft, Calendar, TrendingUp, User, Clock, X, Check, Flame } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useActions } from '../hooks/useActions';
import { SortableActionItem } from '../components/SortableActionItem';
import { AIActionSuggestions } from '../components/AIActionSuggestions';
import type { OutcomeWithRelations, Action } from '../lib/database.types';

export function OutcomeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { reorderActions, deleteAction } = useActions();
  const [outcome, setOutcome] = useState<OutcomeWithRelations | null>(null);
  const [newActionTitle, setNewActionTitle] = useState('');
  const [newActionDuration, setNewActionDuration] = useState(30);
  const [newActionDelegatedTo, setNewActionDelegatedTo] = useState('');
  const [editingAction, setEditingAction] = useState<string | null>(null);
  const [editActionTitle, setEditActionTitle] = useState('');
  const [editActionDuration, setEditActionDuration] = useState(30);
  const [editActionDelegatedTo, setEditActionDelegatedTo] = useState('');
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    if (user && id) {
      loadOutcome();
    }
  }, [user, id]);

  const loadOutcome = async () => {
    try {
      const { data: outcomeData } = await supabase
        .from('outcomes')
        .select(`
          *,
          areas (*)
        `)
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();

      if (!outcomeData) {
        navigate('/outcomes');
        return;
      }

      const { data: actionsData } = await supabase
        .from('actions')
        .select('*')
        .eq('outcome_id', id)
        .order('sort_order', { ascending: true });

      setOutcome({
        ...outcomeData,
        actions: actionsData || [],
      } as OutcomeWithRelations);
    } catch (error) {
      console.error('Error loading outcome:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionTitle.trim()) return;

    try {
      const maxSortOrder = outcome?.actions.length || 0;

      await supabase.from('actions').insert({
        outcome_id: id,
        user_id: user?.id,
        title: newActionTitle.trim(),
        duration_minutes: newActionDuration,
        delegated_to: newActionDelegatedTo.trim() || null,
        delegated_date: newActionDelegatedTo.trim() ? new Date().toISOString() : null,
        done: false,
        priority: 2,
        sort_order: maxSortOrder,
      });

      setNewActionTitle('');
      setNewActionDuration(30);
      setNewActionDelegatedTo('');
      loadOutcome();
    } catch (error) {
      console.error('Error adding action:', error);
    }
  };

  const handleDeleteAction = async (actionId: string) => {
    if (!confirm('Delete this action?')) return;

    try {
      await deleteAction(actionId);
      loadOutcome();
    } catch (error) {
      console.error('Error deleting action:', error);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !outcome) {
      return;
    }

    const oldIndex = outcome.actions.findIndex((a) => a.id === active.id);
    const newIndex = outcome.actions.findIndex((a) => a.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedActions = arrayMove(outcome.actions, oldIndex, newIndex);

    setOutcome({
      ...outcome,
      actions: reorderedActions,
    });

    try {
      const actionIds = reorderedActions.map((a) => a.id);
      await reorderActions(id!, actionIds);
    } catch (error) {
      console.error('Error saving action order:', error);
      await loadOutcome();
    }
  };

  const handleStartEditAction = (action: Action) => {
    setEditingAction(action.id);
    setEditActionTitle(action.title);
    setEditActionDuration(action.duration_minutes || 30);
    setEditActionDelegatedTo(action.delegated_to || '');
  };

  const handleSaveEditAction = async (actionId: string) => {
    if (!editActionTitle.trim()) return;

    try {
      await supabase
        .from('actions')
        .update({
          title: editActionTitle,
          duration_minutes: editActionDuration,
          delegated_to: editActionDelegatedTo.trim() || null,
          delegated_date: editActionDelegatedTo.trim() ? new Date().toISOString() : null,
        })
        .eq('id', actionId);

      setEditingAction(null);
      setEditActionTitle('');
      setEditActionDuration(30);
      setEditActionDelegatedTo('');
      loadOutcome();
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

  const handleToggleAction = async (action: Action) => {
    try {
      await supabase
        .from('actions')
        .update({
          done: !action.done,
          completed_at: !action.done ? new Date().toISOString() : null,
        })
        .eq('id', action.id);

      loadOutcome();
    } catch (error) {
      console.error('Error toggling action:', error);
    }
  };

  const handleUpdatePriority = async (actionId: string, priority: 1 | 2 | 3) => {
    try {
      await supabase.from('actions').update({ priority }).eq('id', actionId);
      loadOutcome();
    } catch (error) {
      console.error('Error updating priority:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!outcome) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Outcome not found</div>
      </div>
    );
  }

  const completedActions = outcome.actions.filter((a) => a.done);
  const pendingActions = outcome.actions.filter((a) => !a.done);
  const completionRate =
    outcome.actions.length > 0
      ? Math.round((completedActions.length / outcome.actions.length) * 100)
      : 0;

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1:
        return 'bg-red-100 text-red-700 border-red-300';
      case 2:
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 3:
        return 'bg-blue-100 text-blue-700 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1:
        return 'High';
      case 2:
        return 'Medium';
      case 3:
        return 'Low';
      default:
        return 'Medium';
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/outcomes')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Outcomes
      </button>

      <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-8 text-white shadow-soft-lg">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-8 h-8" />
              <span className="text-sm font-semibold text-primary-100">RESULT</span>
            </div>
            <h1 className="text-4xl font-bold mb-4">{outcome.title}</h1>
            {outcome.description && (
              <p className="text-xl text-primary-100 mb-4">{outcome.description}</p>
            )}
          </div>
          <button
            onClick={() => navigate(`/outcomes?edit=${outcome.id}`)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Edit2 className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {outcome.areas && (
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-sm text-primary-100 mb-1">Area</p>
              <p className="font-semibold">{outcome.areas.name}</p>
            </div>
          )}
          {outcome.target_date && (
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-sm text-primary-100 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Target Date
              </p>
              <p className="font-semibold">
                {new Date(outcome.target_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          )}
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-sm text-primary-100 mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Progress
            </p>
            <p className="font-semibold">{completionRate}% Complete</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-soft border-l-4 border-red-500">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="w-6 h-6 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900">PURPOSE</h2>
        </div>
        <p className="text-lg text-gray-700 italic leading-relaxed">{outcome.purpose}</p>
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-soft">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary-500" />
            <h2 className="text-2xl font-bold text-gray-900">MASSIVE ACTION PLAN</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              {pendingActions.length} pending, {completedActions.length} completed
            </div>
            <AIActionSuggestions
              outcome={outcome}
              existingActions={outcome.actions}
              onActionsAdded={loadOutcome}
            />
          </div>
        </div>

        <form onSubmit={handleAddAction} className="mb-8">
          <div className="space-y-3">
            <input
              type="text"
              value={newActionTitle}
              onChange={(e) => setNewActionTitle(e.target.value)}
              placeholder="Add a new action to your MAP..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2 px-3 py-2 border-2 border-gray-300 rounded-xl bg-gray-50">
                <Clock className="w-4 h-4 text-gray-500" />
                <input
                  type="number"
                  value={newActionDuration}
                  onChange={(e) => setNewActionDuration(parseInt(e.target.value) || 30)}
                  min="5"
                  max="480"
                  step="5"
                  className="w-16 bg-transparent focus:outline-none"
                />
                <span className="text-sm text-gray-600">min</span>
              </div>
              <input
                type="text"
                value={newActionDelegatedTo}
                onChange={(e) => setNewActionDelegatedTo(e.target.value)}
                placeholder="Delegate to (optional)"
                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors shadow-lg flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Action
              </button>
            </div>
          </div>
        </form>

        {outcome.actions.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Zap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Actions Yet</h3>
            <p className="text-gray-600">
              Add actions above to create your Massive Action Plan for this outcome
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingActions.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Pending Actions</h3>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={pendingActions.map((a) => a.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {pendingActions.map((action) => (
                        <SortableActionItem
                          key={action.id}
                          action={action}
                          isEditing={editingAction === action.id}
                          editActionTitle={editActionTitle}
                          editActionDuration={editActionDuration}
                          editActionDelegatedTo={editActionDelegatedTo}
                          onToggleAction={handleToggleAction}
                          onStartEdit={handleStartEditAction}
                          onSaveEdit={handleSaveEditAction}
                          onCancelEdit={handleCancelEdit}
                          onDelete={handleDeleteAction}
                          setEditActionTitle={setEditActionTitle}
                          setEditActionDuration={setEditActionDuration}
                          setEditActionDelegatedTo={setEditActionDelegatedTo}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}

            {completedActions.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Completed Actions</h3>
                <div className="space-y-2">
                  {completedActions.map((action) => (
                    <div
                      key={action.id}
                      className="group flex items-start gap-3 p-4 bg-green-50 rounded-xl opacity-75"
                    >
                      <button
                        onClick={() => handleToggleAction(action)}
                        className="w-5 h-5 rounded border-2 border-green-500 bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5 text-white"
                      >
                        <span className="text-xs">✓</span>
                      </button>
                      <div className="flex-1">
                        <p className="text-gray-700 line-through">{action.title}</p>
                        {action.completed_at && (
                          <p className="text-xs text-gray-500 mt-1">
                            Completed{' '}
                            {new Date(action.completed_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteAction(action.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-2xl p-6 border-2 border-primary-200">
        <h3 className="font-bold text-primary-900 mb-2">Next Steps</h3>
        <p className="text-sm text-primary-800 mb-4">
          Schedule your actions by dragging them onto your weekly calendar, or select this outcome
          during your daily planning ritual.
        </p>
        <div className="flex gap-3">
          <a
            href="/weekly-plan"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors shadow-lg"
          >
            <Calendar className="w-5 h-5" />
            Go to Weekly Calendar
          </a>
          <a
            href="/daily-planning"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-600 border-2 border-primary-600 rounded-xl font-semibold hover:bg-primary-50 transition-colors"
          >
            Plan Today
          </a>
        </div>
      </div>
    </div>
  );
}
