import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Target, X, CreditCard as Edit2, Trash2, CheckCircle2, ExternalLink, TrendingUp, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useOrganization } from '../contexts/OrganizationContext';
import { AIPurposeRefinement } from '../components/AIPurposeRefinement';
import type { Goal } from '../lib/database.types';
import { BackgroundHeroSection } from '../components/BackgroundHeroSection';
import { ImageUploadModal } from '../components/ImageUploadModal';
import { usePageBackground } from '../hooks/usePageBackground';

interface Area {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface Outcome {
  id: string;
  title: string;
  description: string | null;
  purpose: string;
  status: string;
  area_id: string;
  goal_id: string | null;
  created_at: string;
  areas?: Area;
  goals?: Goal;
}

export function OutcomesPage() {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const navigate = useNavigate();
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingOutcome, setEditingOutcome] = useState<Outcome | null>(null);
  const [showDrafts, setShowDrafts] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    purpose: '',
    area_id: '',
    goal_id: '',
  });
  const [loading, setLoading] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);
  const {
    getBackgroundUrl,
    getBackgroundPosition,
    getOverlayOpacity,
    updateBackground,
    uploadImage,
  } = usePageBackground('outcomes');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, showDrafts]);

  const loadData = async () => {
    try {
      const { data: areasData } = await supabase
        .from('areas')
        .select('*')
        .eq('user_id', user?.id)
        .order('name');

      const { data: goalsData } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'ACTIVE')
        .eq('is_draft', false)
        .order('year', { ascending: false })
        .order('quarter', { ascending: false });

      let outcomesQuery = supabase
        .from('outcomes')
        .select('*, areas(*), goals(*)')
        .eq('user_id', user?.id);

      if (showDrafts) {
        outcomesQuery = outcomesQuery.eq('is_draft', true);
      } else {
        outcomesQuery = outcomesQuery.eq('is_draft', false);
      }

      const { data: outcomesData } = await outcomesQuery.order('created_at', { ascending: false });

      setAreas(areasData || []);
      setGoals(goalsData || []);
      setOutcomes(outcomesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
    if (e) e.preventDefault();

    if (!organization?.id) {
      console.error('No organization found');
      alert('Unable to create outcome: No organization found. Please contact support.');
      return;
    }

    try {
      if (editingOutcome) {
        await supabase
          .from('outcomes')
          .update({
            title: formData.title,
            description: formData.description,
            purpose: formData.purpose,
            area_id: formData.area_id,
            goal_id: formData.goal_id || null,
            is_draft: isDraft,
          })
          .eq('id', editingOutcome.id);
      } else {
        const { error } = await supabase.from('outcomes').insert({
          user_id: user?.id,
          organization_id: organization.id,
          title: formData.title,
          description: formData.description || null,
          purpose: formData.purpose,
          area_id: formData.area_id,
          goal_id: formData.goal_id || null,
          status: 'ACTIVE',
          is_draft: isDraft,
        });

        if (error) {
          console.error('Error creating outcome:', error);
          alert(`Failed to create outcome: ${error.message}`);
          return;
        }
      }

      setShowModal(false);
      setEditingOutcome(null);
      setFormData({ title: '', description: '', purpose: '', area_id: '', goal_id: '' });
      loadData();
    } catch (error) {
      console.error('Error saving outcome:', error);
      alert('Failed to save outcome. Please try again.');
    }
  };

  const handleEdit = (outcome: Outcome) => {
    setEditingOutcome(outcome);
    setFormData({
      title: outcome.title,
      description: outcome.description || '',
      purpose: outcome.purpose,
      area_id: outcome.area_id,
      goal_id: outcome.goal_id || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this outcome?')) return;

    try {
      await supabase.from('outcomes').delete().eq('id', id);
      loadData();
    } catch (error) {
      console.error('Error deleting outcome:', error);
    }
  };

  const toggleStatus = async (outcome: Outcome) => {
    const newStatus = outcome.status === 'ACTIVE' ? 'COMPLETED' : 'ACTIVE';
    await supabase.from('outcomes').update({ status: newStatus }).eq('id', outcome.id);
    loadData();
  };

  const openNewModal = () => {
    setEditingOutcome(null);
    setFormData({ title: '', description: '', purpose: '', area_id: areas[0]?.id || '', goal_id: '' });
    setShowModal(true);
  };

  const activeOutcomes = outcomes.filter(o => o.status === 'ACTIVE');
  const completedOutcomes = outcomes.filter(o => o.status === 'COMPLETED');

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
          <h1 className="text-5xl font-bold mb-4">Outcomes</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Define your results and massive action plans
          </p>
        </div>
      </BackgroundHeroSection>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 pb-12 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowDrafts(!showDrafts)}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                showDrafts
                  ? 'bg-amber-100 text-amber-700 border-2 border-amber-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="hidden xs:inline">{showDrafts ? 'Showing Drafts' : 'Show Drafts'}</span>
              <span className="xs:hidden">Drafts</span>
            </button>
            <button
              onClick={openNewModal}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-primary-500 text-white rounded-lg sm:rounded-xl font-semibold hover:bg-primary-600 transition-colors shadow-lg text-sm sm:text-base min-h-touch-target"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline">New Outcome</span>
              <span className="xs:hidden">New</span>
            </button>
          </div>
        </div>

      {activeOutcomes.length === 0 && completedOutcomes.length === 0 ? (
        <div className="bg-white rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center shadow-soft">
          <Target className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No outcomes yet</h3>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Create your first outcome to get started with RPM</p>
          <button
            onClick={openNewModal}
            className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-primary-500 text-white rounded-lg sm:rounded-xl font-semibold hover:bg-primary-600 transition-colors text-sm sm:text-base min-h-touch-target"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            Create Outcome
          </button>
        </div>
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {activeOutcomes.length > 0 && (
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Active Outcomes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {activeOutcomes.map((outcome) => (
                  <div
                    key={outcome.id}
                    className={`bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-soft hover:shadow-soft-lg transition-shadow relative group ${
                      outcome.is_draft ? 'border-2 border-amber-300' : ''
                    }`}
                  >
                    <div
                      onClick={() => navigate(`/outcomes/${outcome.id}`)}
                      className="cursor-pointer mb-4"
                    >
                      <div className="flex items-start gap-2 sm:gap-3">
                        {outcome.is_draft ? (
                          <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 flex-shrink-0 mt-1" />
                        ) : (
                          <Target className="w-5 h-5 sm:w-6 sm:h-6 text-primary-500 flex-shrink-0 mt-1" />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 hover:text-primary-600 transition-colors">
                            {outcome.title}
                            <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 inline ml-1 sm:ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </h3>
                          {outcome.description && (
                            <p className="text-xs sm:text-sm text-gray-600">{outcome.description}</p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-1 sm:gap-2">
                            {outcome.is_draft && (
                              <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-amber-100 text-amber-700">
                                DRAFT
                              </span>
                            )}
                            {outcome.areas && (
                              <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-gray-100 text-gray-700 truncate max-w-full">
                                {outcome.areas.name}
                              </span>
                            )}
                            {outcome.goals && (
                              <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-blue-100 text-blue-700 truncate max-w-full">
                                <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                                <span className="truncate">{outcome.goals.title}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStatus(outcome);
                        }}
                        className="p-1.5 sm:p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors min-h-touch-target min-w-touch-target flex items-center justify-center"
                        title="Mark as completed"
                      >
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(outcome);
                        }}
                        className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors min-h-touch-target min-w-touch-target flex items-center justify-center"
                      >
                        <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(outcome.id);
                        }}
                        className="p-1.5 sm:p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors min-h-touch-target min-w-touch-target flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {completedOutcomes.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Completed Outcomes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedOutcomes.map((outcome) => (
                  <div
                    key={outcome.id}
                    className="bg-gray-50 rounded-2xl p-6 shadow-soft opacity-75"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-1 line-through">{outcome.title}</h3>
                          {outcome.description && (
                            <p className="text-sm text-gray-600">{outcome.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <button
                          onClick={() => toggleStatus(outcome)}
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Mark as active"
                        >
                          <Target className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(outcome.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingOutcome ? 'Edit Outcome' : 'New Outcome'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Lose 20 pounds"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Purpose</label>
                  {formData.title && formData.purpose && (
                    <AIPurposeRefinement
                      title={formData.title}
                      currentPurpose={formData.purpose}
                      context={formData.description}
                      onPurposeUpdated={(newPurpose) => setFormData({ ...formData, purpose: newPurpose })}
                    />
                  )}
                </div>
                <textarea
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Why is this outcome important to you?"
                  rows={2}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Additional details..."
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Area</label>
                <select
                  value={formData.area_id}
                  onChange={(e) => setFormData({ ...formData, area_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  <option value="">Select an area</option>
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
                {areas.length === 0 && (
                  <p className="mt-2 text-sm text-gray-500">
                    No areas yet.{' '}
                    <a href="/areas" className="text-primary-600 hover:text-primary-700">
                      Create one first
                    </a>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link to Goal (Optional)
                </label>
                <select
                  value={formData.goal_id}
                  onChange={(e) => setFormData({ ...formData, goal_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">No goal - standalone outcome</option>
                  {goals.map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.title} ({goal.goal_type === 'YEARLY' ? goal.year : `Q${goal.quarter} ${goal.year}`})
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-sm text-gray-500">
                  Link this outcome to a goal to track progress automatically
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={areas.length === 0 || !formData.title?.trim()}
                  className="flex-1 px-6 py-3 border-2 border-primary-500 text-primary-600 rounded-xl font-semibold hover:bg-primary-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  title="Save as draft to continue editing later"
                >
                  <FileText className="w-4 h-4" />
                  Save Draft
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
                  disabled={areas.length === 0}
                >
                  {editingOutcome?.is_draft ? 'Publish Outcome' : editingOutcome ? 'Save Changes' : 'Create Outcome'}
                </button>
              </div>
            </form>
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
