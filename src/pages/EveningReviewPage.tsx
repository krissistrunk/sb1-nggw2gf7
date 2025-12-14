import { useState, useEffect } from 'react';
import { Moon, Star, CheckCircle2, XCircle, Lightbulb, TrendingUp, Flame, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useOrganization } from '../contexts/OrganizationContext';
import type { Action } from '../lib/database.types';
import { BackgroundHeroSection } from '../components/BackgroundHeroSection';
import { ImageUploadModal } from '../components/ImageUploadModal';
import { usePageBackground } from '../hooks/usePageBackground';

export function EveningReviewPage() {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const [todayActions, setTodayActions] = useState<Action[]>([]);
  const [reflection, setReflection] = useState('');
  const [wins, setWins] = useState('');
  const [lessons, setLessons] = useState('');
  const [incomplete, setIncomplete] = useState('');
  const [energyLevel, setEnergyLevel] = useState(3);
  const [gratitude, setGratitude] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const {
    getBackgroundUrl,
    getBackgroundPosition,
    getOverlayOpacity,
    updateBackground,
    uploadImage,
  } = usePageBackground('evening-review');

  const today = new Date().toISOString().split('T')[0];
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  useEffect(() => {
    if (user && organization) {
      loadData();
    }
  }, [user, organization]);

  const loadData = async () => {
    const userId = user?.id;
    const organizationId = organization?.id;
    if (!userId || !organizationId) return;

    try {
      const { data: actionsData } = await supabase
        .from('actions')
        .select('*')
        .eq('user_id', userId)
        .eq('scheduled_date', today)
        .order('done', { ascending: true });

      setTodayActions(actionsData || []);

      const { data: dailyNoteData } = await supabase
        .from('daily_notes')
        .select('*')
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .eq('date', today)
        .maybeSingle();

      if (dailyNoteData) {
        setReflection(dailyNoteData.evening_reflection || '');
        setEnergyLevel(dailyNoteData.energy_level || 3);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReview = async () => {
    const userId = user?.id;
    const organizationId = organization?.id;
    if (!userId || !organizationId) return;

    setSaving(true);
    try {
      const reflectionText = `
WINS: ${wins}

LESSONS: ${lessons}

INCOMPLETE: ${incomplete}

GRATITUDE: ${gratitude}

REFLECTION: ${reflection}
      `.trim();

      const { data: existingNote } = await supabase
        .from('daily_notes')
        .select('id')
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .eq('date', today)
        .maybeSingle();

      if (existingNote) {
        await supabase
          .from('daily_notes')
          .update({
            evening_reflection: reflectionText,
            energy_level: energyLevel,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingNote.id);
      } else {
        await supabase.from('daily_notes').insert({
          user_id: userId,
          organization_id: organizationId,
          date: today,
          evening_reflection: reflectionText,
          energy_level: energyLevel,
        });
      }

      window.location.href = '/today';
    } catch (error) {
      console.error('Error saving review:', error);
    } finally {
      setSaving(false);
    }
  };

  const completedActions = todayActions.filter((a) => a.done);
  const incompleteActions = todayActions.filter((a) => !a.done);
  const completionRate =
    todayActions.length > 0 ? Math.round((completedActions.length / todayActions.length) * 100) : 0;

  const mustActions = todayActions.filter((a) => a.is_must);
  const completedMustActions = mustActions.filter((a) => a.done);
  const mustCompletionRate = mustActions.length > 0 ? Math.round((completedMustActions.length / mustActions.length) * 100) : 0;

  const totalTime = todayActions.reduce((sum, a) => sum + (a.duration_minutes || 0), 0);
  const completedTime = completedActions.reduce((sum, a) => sum + (a.duration_minutes || 0), 0);
  const mustTime = mustActions.reduce((sum, a) => sum + (a.duration_minutes || 0), 0);
  const completedMustTime = completedMustActions.reduce((sum, a) => sum + (a.duration_minutes || 0), 0);

  const delegatedActions = todayActions.filter((a) => a.delegated_to);

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
          <Moon className="w-16 h-16 mx-auto mb-4 opacity-90" />
          <h1 className="text-5xl font-bold mb-4">Evening Review</h1>
          <p className="text-xl text-white/90">{todayFormatted}</p>
        </div>
      </BackgroundHeroSection>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pb-12 space-y-6">

      <div className="bg-white rounded-2xl p-8 shadow-soft">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Today's Performance</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-green-700">Completed</span>
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-900">{completedActions.length}</p>
            <p className="text-xs text-green-700 mt-1">{completedTime} min completed</p>
          </div>

          <div className="bg-amber-50 rounded-xl p-6 border-2 border-amber-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-amber-700">Incomplete</span>
              <XCircle className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-3xl font-bold text-amber-900">{incompleteActions.length}</p>
            <p className="text-xs text-amber-700 mt-1">{totalTime - completedTime} min not completed</p>
          </div>

          <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-blue-700">Completion</span>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-900">{completionRate}%</p>
            <p className="text-xs text-blue-700 mt-1">{completedTime} of {totalTime} min</p>
          </div>
        </div>

        {mustActions.length > 0 && (
          <div className="mb-6 p-6 bg-orange-50 rounded-xl border-2 border-orange-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-600" />
                Must Actions Performance
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-orange-700 mb-1">Must Actions</p>
                <p className="text-2xl font-bold text-orange-900">
                  {completedMustActions.length} / {mustActions.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-orange-700 mb-1">Must Completion</p>
                <p className="text-2xl font-bold text-orange-900">{mustCompletionRate}%</p>
              </div>
              <div>
                <p className="text-sm text-orange-700 mb-1">Must Time</p>
                <p className="text-2xl font-bold text-orange-900">
                  {completedMustTime} / {mustTime} min
                </p>
              </div>
            </div>
          </div>
        )}

        {delegatedActions.length > 0 && (
          <div className="mb-6 p-6 bg-blue-50 rounded-xl border-2 border-blue-200">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
              <User className="w-5 h-5 text-blue-600" />
              Delegated Actions ({delegatedActions.length})
            </h3>
            <div className="space-y-2">
              {delegatedActions.map((action) => (
                <div key={action.id} className="flex items-center gap-3 p-2 bg-white rounded-lg">
                  {action.done ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  )}
                  <span className="flex-1 text-sm text-gray-900">{action.title}</span>
                  <span className="text-xs text-blue-700 font-medium">{action.delegated_to}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {todayActions.length > 0 && (
          <div className="space-y-4 mb-8">
            {completedActions.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Completed Actions
                </h3>
                <div className="space-y-2">
                  {completedActions.map((action) => (
                    <div
                      key={action.id}
                      className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200"
                    >
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <div className="flex-1 flex items-center gap-2 flex-wrap">
                        <span className="text-gray-900">{action.title}</span>
                        {action.is_must && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-orange-200 text-orange-900 text-xs font-semibold rounded">
                            <Flame className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{action.duration_minutes || 60}m</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {incompleteActions.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-amber-600" />
                  Incomplete Actions
                </h3>
                <div className="space-y-2">
                  {incompleteActions.map((action) => (
                    <div
                      key={action.id}
                      className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200"
                    >
                      <XCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <div className="flex-1 flex items-center gap-2 flex-wrap">
                        <span className="text-gray-900">{action.title}</span>
                        {action.is_must && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-orange-200 text-orange-900 text-xs font-semibold rounded">
                            <Flame className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{action.duration_minutes || 60}m</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-soft">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Reflection Questions</h2>

        <div className="space-y-6">
          <div>
            <label className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-3">
              <Star className="w-5 h-5 text-yellow-500" />
              What were your wins today?
            </label>
            <textarea
              value={wins}
              onChange={(e) => setWins(e.target.value)}
              placeholder="What did you accomplish? What are you proud of?"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-3">
              <Lightbulb className="w-5 h-5 text-blue-500" />
              What lessons did you learn?
            </label>
            <textarea
              value={lessons}
              onChange={(e) => setLessons(e.target.value)}
              placeholder="What insights or lessons came up today?"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          {incompleteActions.length > 0 && (
            <div>
              <label className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-3">
                <XCircle className="w-5 h-5 text-amber-500" />
                Why were some actions incomplete?
              </label>
              <textarea
                value={incomplete}
                onChange={(e) => setIncomplete(e.target.value)}
                placeholder="What got in the way? What will you do differently?"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>
          )}

          <div>
            <label className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-3">
              <Moon className="w-5 h-5 text-indigo-500" />
              What are you grateful for today?
            </label>
            <textarea
              value={gratitude}
              onChange={(e) => setGratitude(e.target.value)}
              placeholder="Three things you're grateful for today..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-lg font-semibold text-gray-900 mb-3">
              Overall reflection
            </label>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="How was your day overall? Any additional thoughts?"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-lg font-semibold text-gray-900 mb-3">
              Energy Level (1-5)
            </label>
            <div className="flex gap-3">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => setEnergyLevel(level)}
                  className={`flex-1 py-4 rounded-xl font-semibold transition-all ${
                    energyLevel === level
                      ? 'bg-primary-500 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              1 = Exhausted, 5 = Energized
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveReview}
          disabled={saving}
          className="w-full mt-8 px-8 py-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? 'Saving...' : 'Complete Evening Review'}
        </button>
      </div>

      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-200">
        <h3 className="font-bold text-indigo-900 mb-2">Tomorrow's Planning</h3>
        <p className="text-sm text-indigo-800 mb-4">
          Great work reflecting on today! When you're ready, plan tomorrow morning to set yourself
          up for success.
        </p>
        <a
          href="/daily-planning"
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg"
        >
          Plan Tomorrow
        </a>
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
