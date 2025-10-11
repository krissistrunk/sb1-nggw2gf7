import { useState } from 'react';
import { Sparkles, Check, X, Loader2 } from 'lucide-react';
import { aiService, AIActionSuggestion } from '../lib/ai-service';
import { supabase } from '../lib/supabase';
import { useOrganization } from '../contexts/OrganizationContext';

interface AIActionSuggestionsProps {
  outcome: {
    id: string;
    title: string;
    purpose: string;
    description?: string;
  };
  existingActions: Array<{ title: string }>;
  onActionsAdded: () => void;
}

export function AIActionSuggestions({ outcome, existingActions, onActionsAdded }: AIActionSuggestionsProps) {
  const { organization } = useOrganization();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AIActionSuggestion[]>([]);
  const [selectedActions, setSelectedActions] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const handleGetSuggestions = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await aiService.suggestActions(outcome, existingActions);
      setSuggestions(result.actions);
      setSelectedActions(new Set(result.actions.map((_, i) => i)));
      setIsOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get suggestions');
      console.error('Error getting AI suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAction = (index: number) => {
    const newSelected = new Set(selectedActions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedActions(newSelected);
  };

  const handleAddActions = async () => {
    if (!organization?.id) return;

    try {
      const actionsToAdd = suggestions.filter((_, i) => selectedActions.has(i));

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const actionInserts = actionsToAdd.map((action, index) => ({
        outcome_id: outcome.id,
        user_id: userData.user.id,
        title: action.title,
        notes: action.notes || null,
        priority: action.priority,
        duration_minutes: action.duration_minutes,
        done: false,
        sort_order: existingActions.length + index,
      }));

      await supabase.from('actions').insert(actionInserts);

      setIsOpen(false);
      setSuggestions([]);
      setSelectedActions(new Set());
      onActionsAdded();
    } catch (err) {
      console.error('Error adding actions:', err);
      setError('Failed to add actions');
    }
  };

  return (
    <>
      <button
        onClick={handleGetSuggestions}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-blue-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Thinking...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            AI Suggest Actions
          </>
        )}
      </button>

      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setIsOpen(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">AI Action Suggestions</h2>
                  <p className="text-sm text-gray-600">Select actions to add to your outcome</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-3">
              {suggestions.map((action, index) => (
                <div
                  key={index}
                  onClick={() => toggleAction(index)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedActions.has(index)
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      selectedActions.has(index)
                        ? 'border-purple-500 bg-purple-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedActions.has(index) && <Check className="w-3 h-3 text-white" />}
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                      {action.notes && (
                        <p className="text-sm text-gray-600 mb-2">{action.notes}</p>
                      )}
                      {action.reasoning && (
                        <p className="text-xs text-gray-500 italic mb-2">{action.reasoning}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs">
                        <span className={`px-2 py-1 rounded-full font-medium ${
                          action.priority === 1 ? 'bg-red-100 text-red-700' :
                          action.priority === 2 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          Priority {action.priority}
                        </span>
                        <span className="text-gray-500">
                          ~{action.duration_minutes} min
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddActions}
                disabled={selectedActions.size === 0}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add {selectedActions.size} Action{selectedActions.size !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
