import { useState, useEffect } from 'react';
import { X, Package, Target, Heart, ChevronDown, ChevronUp, Lightbulb, Save, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useOrganization } from '../contexts/OrganizationContext';
import type { ChunkWithItems, Area, Goal } from '../lib/database.types';
import { AIPurposeRefinement } from './AIPurposeRefinement';
import { OUTCOME_STATUS } from '../constants/status';

interface ChunkToOutcomeModalProps {
  chunk: ChunkWithItems;
  areas: Area[];
  goals: Goal[];
  onClose: () => void;
  onSuccess: (outcomeId: string, shouldNavigate: boolean) => void;
}

export function ChunkToOutcomeModal({
  chunk,
  areas,
  goals,
  onClose,
  onSuccess,
}: ChunkToOutcomeModalProps) {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const [title, setTitle] = useState(chunk.name);
  const [purpose, setPurpose] = useState('');
  const [description, setDescription] = useState(chunk.description || '');
  const [areaId, setAreaId] = useState('');
  const [goalId, setGoalId] = useState('');
  const [archiveChunk, setArchiveChunk] = useState(true);
  const [autoCreateActions, setAutoCreateActions] = useState(false);
  const [postConversionAction, setPostConversionAction] = useState<'stay' | 'navigate'>('stay');
  const [rememberSettings, setRememberSettings] = useState(false);
  const [showItems, setShowItems] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUserSettings();
  }, [user]);

  const loadUserSettings = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('users')
        .select('settings')
        .eq('id', user.id)
        .single();

      if (data?.settings) {
        const settings = data.settings as any;
        if (settings.autoCreateActionsFromChunks !== undefined) {
          setAutoCreateActions(settings.autoCreateActionsFromChunks);
        }
        if (settings.defaultPostConversionAction) {
          setPostConversionAction(settings.defaultPostConversionAction);
        }
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  };

  const saveUserSettings = async () => {
    if (!user || !rememberSettings) return;

    try {
      const { data: currentUser } = await supabase
        .from('users')
        .select('settings')
        .eq('id', user.id)
        .single();

      const currentSettings = (currentUser?.settings as any) || {};

      await supabase
        .from('users')
        .update({
          settings: {
            ...currentSettings,
            autoCreateActionsFromChunks: autoCreateActions,
            defaultPostConversionAction: postConversionAction,
          },
        })
        .eq('id', user.id);
    } catch (error) {
      console.error('Error saving user settings:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !purpose.trim()) {
      setError('Please provide both a result and purpose');
      return;
    }

    if (!user || !organization) return;

    setSubmitting(true);

    try {
      const { data: outcome, error: outcomeError } = await supabase
        .from('outcomes')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          purpose: purpose.trim(),
          area_id: areaId || null,
          goal_id: goalId || null,
          user_id: user.id,
          organization_id: organization.id,
          status: OUTCOME_STATUS.ACTIVE,
          source_chunk_id: chunk.id,
        })
        .select()
        .single();

      if (outcomeError) throw outcomeError;

      if (autoCreateActions && chunk.items.length > 0) {
        const actions = chunk.items.map((item, index) => ({
          outcome_id: outcome.id,
          user_id: user.id,
          title: item.inbox_item.content,
          duration_minutes: 30,
          priority: 2 as 1 | 2 | 3,
          done: false,
          is_must: false,
          sort_order: index,
          source_chunk_item_id: item.id,
        }));

        const { error: actionsError } = await supabase
          .from('actions')
          .insert(actions);

        if (actionsError) throw actionsError;
      }

      await supabase
        .from('chunks')
        .update({
          status: archiveChunk ? 'ARCHIVED' : 'ACTIVE',
          converted_to_type: 'OUTCOME',
          converted_to_id: outcome.id,
          converted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', chunk.id);

      for (const item of chunk.items) {
        await supabase
          .from('inbox_items')
          .update({
            triaged: true,
            triaged_to_id: outcome.id,
          })
          .eq('id', item.inbox_item_id);
      }

      await saveUserSettings();

      onSuccess(outcome.id, postConversionAction === 'navigate');
    } catch (err) {
      console.error('Error creating outcome:', err);
      setError('Failed to create outcome. Please try again.');
      setSubmitting(false);
    }
  };

  const filteredGoals = goals.filter((g) => !areaId || g.area_id === areaId);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6" style={{ color: chunk.color }} />
            <h2 className="text-2xl font-bold text-gray-900">Convert Chunk to Outcome</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="w-5 h-5" style={{ color: chunk.color }} />
                  <h3 className="font-bold text-blue-900">{chunk.name}</h3>
                  <span className="text-sm text-blue-700">
                    ({chunk.items.length} item{chunk.items.length !== 1 ? 's' : ''})
                  </span>
                </div>
                {chunk.description && (
                  <p className="text-sm text-blue-800">{chunk.description}</p>
                )}
              </div>
              <button
                onClick={() => setShowItems(!showItems)}
                className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
              >
                {showItems ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
            </div>

            {showItems && chunk.items.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-blue-200">
                <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide">
                  Chunk Items:
                </p>
                {chunk.items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg p-2 text-sm text-gray-700 flex items-start gap-2"
                  >
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span className="flex-1">{item.inbox_item.content}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border-2 border-orange-200">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-orange-900 mb-1">RPM Methodology Reminder</h4>
                <p className="text-sm text-orange-800 mb-2">
                  Define the specific <strong>RESULT</strong> you want from these items, then your compelling <strong>PURPOSE</strong> (why this is a MUST for you).
                </p>
                <p className="text-xs text-orange-700 italic">
                  Your purpose provides the emotional fuel to follow through when things get difficult.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                <Target className="w-4 h-4 inline mr-1" />
                RESULT: What specific outcome do you want?
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Complete project proposal for client"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-bold text-gray-900">
                  <Heart className="w-4 h-4 inline mr-1 text-red-500" />
                  PURPOSE: Why is this a MUST for you?
                </label>
                <AIPurposeRefinement
                  title={title}
                  currentPurpose={purpose}
                  context={description}
                  onPurposeUpdated={setPurpose}
                />
              </div>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="What will achieving this give you emotionally? How will you FEEL? What will NOT achieving this cost you?"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none resize-none"
                rows={5}
                required
              />
              <p className="text-xs text-gray-600 mt-1">
                Make it emotional and personal. Use feeling words. Include both what you'll gain and what you'll avoid.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Additional context or notes..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none resize-none"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Area (Category)
                </label>
                <select
                  value={areaId}
                  onChange={(e) => {
                    setAreaId(e.target.value);
                    setGoalId('');
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select an area...</option>
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Goal (Optional)
                </label>
                <select
                  value={goalId}
                  onChange={(e) => setGoalId(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                  disabled={!areaId}
                >
                  <option value="">Select a goal...</option>
                  {filteredGoals.map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border-t pt-6 space-y-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Save className="w-5 h-5" />
                Conversion Settings
              </h3>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={archiveChunk}
                  onChange={(e) => setArchiveChunk(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600"
                />
                <div>
                  <span className="font-medium text-gray-900">Archive chunk after conversion</span>
                  <p className="text-sm text-gray-600">
                    The chunk will be hidden from active view but can be accessed later
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoCreateActions}
                  onChange={(e) => setAutoCreateActions(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600"
                />
                <div>
                  <span className="font-medium text-gray-900">
                    Automatically create actions from chunk items
                  </span>
                  <p className="text-sm text-gray-600">
                    Each chunk item will become an action in your massive action plan (you can edit them later)
                  </p>
                </div>
              </label>

              <div>
                <p className="font-medium text-gray-900 mb-2">After creating outcome:</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="postConversion"
                      checked={postConversionAction === 'stay'}
                      onChange={() => setPostConversionAction('stay')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700">Continue in Daily Planning</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="postConversion"
                      checked={postConversionAction === 'navigate'}
                      onChange={() => setPostConversionAction('navigate')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700">Go to Outcome Detail Page</span>
                  </label>
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberSettings}
                  onChange={(e) => setRememberSettings(e.target.checked)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">
                  Remember my preferences for future conversions
                </span>
              </label>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <div className="flex gap-4 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !title.trim() || !purpose.trim()}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  'Creating...'
                ) : (
                  <>
                    Create Outcome
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
