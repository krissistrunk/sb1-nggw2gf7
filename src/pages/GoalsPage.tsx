import { useState, useEffect } from 'react';
import { Target, Plus, X, Save, Calendar, TrendingUp, CheckCircle2, Archive, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useOrganization } from '../contexts/OrganizationContext';
import type { Goal, Area, GoalInsert, Outcome } from '../lib/database.types';
import { BackgroundHeroSection } from '../components/BackgroundHeroSection';
import { ImageUploadModal } from '../components/ImageUploadModal';
import { usePageBackground } from '../hooks/usePageBackground';
import { GOAL_STATUS, OUTCOME_STATUS } from '../constants/status';

type TabType = 'YEARLY' | 'QUARTERLY';

export function GoalsPage() {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const [activeTab, setActiveTab] = useState<TabType>('YEARLY');
  const [showDrafts, setShowDrafts] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [yearlyGoals, setYearlyGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState<Partial<GoalInsert>>({
    title: '',
    description: '',
    goal_type: 'YEARLY',
    area_id: '',
    year: new Date().getFullYear(),
    quarter: null,
    parent_goal_id: null,
  });
  const [showImageModal, setShowImageModal] = useState(false);
  const {
    getBackgroundUrl,
    getBackgroundPosition,
    getOverlayOpacity,
    updateBackground,
    uploadImage,
  } = usePageBackground('goals');

  useEffect(() => {
    if (user && organization) {
      loadAreas();
      loadGoals();
    }
  }, [user, organization, activeTab, showDrafts]);

  const loadAreas = async () => {
    try {
      const { data } = await supabase
        .from('areas')
        .select('*')
        .eq('user_id', user?.id)
        .order('name');
      setAreas(data || []);
    } catch (error) {
      console.error('Error loading areas:', error);
    }
  };

  const loadGoals = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('goals')
        .select('*')
        .eq('user_id', user?.id)
        .eq('goal_type', activeTab);

      if (showDrafts) {
        query = query.eq('is_draft', true);
      } else {
        query = query.eq('is_draft', false);
      }

      const { data } = await query
        .order('year', { ascending: false })
        .order('quarter', { ascending: false });

      setGoals(data || []);

      if (activeTab === 'QUARTERLY') {
        const { data: yearlyData } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', user?.id)
          .eq('goal_type', 'YEARLY')
          .eq('status', GOAL_STATUS.ACTIVE)
          .eq('is_draft', false)
          .order('year', { ascending: false });
        setYearlyGoals(yearlyData || []);
      }
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (isDraft = false) => {
    try {
      const goalData: GoalInsert = {
        user_id: user!.id,
        organization_id: organization!.id,
        title: formData.title!,
        description: formData.description,
        goal_type: activeTab,
        area_id: formData.area_id || null,
        year: formData.year!,
        quarter: activeTab === 'QUARTERLY' ? formData.quarter! : null,
        parent_goal_id: formData.parent_goal_id || null,
        is_draft: isDraft,
      };

      if (editingGoal) {
        await supabase
          .from('goals')
          .update({
            title: formData.title,
            description: formData.description,
            area_id: formData.area_id || null,
            year: formData.year,
            quarter: activeTab === 'QUARTERLY' ? formData.quarter : null,
            parent_goal_id: formData.parent_goal_id || null,
            is_draft: isDraft,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingGoal.id);
      } else {
        await supabase.from('goals').insert(goalData);
      }

      setShowModal(false);
      setEditingGoal(null);
      resetForm();
      loadGoals();
    } catch (error) {
      console.error('Error saving goal:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    try {
      await supabase.from('goals').delete().eq('id', id);
      loadGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await supabase
        .from('goals')
        .update({ status: GOAL_STATUS.ARCHIVED, updated_at: new Date().toISOString() })
        .eq('id', id);
      loadGoals();
    } catch (error) {
      console.error('Error archiving goal:', error);
    }
  };

  const openNewModal = () => {
    setEditingGoal(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || '',
      goal_type: goal.goal_type,
      area_id: goal.area_id || '',
      year: goal.year,
      quarter: goal.quarter,
      parent_goal_id: goal.parent_goal_id || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      goal_type: activeTab,
      area_id: '',
      year: new Date().getFullYear(),
      quarter: activeTab === 'QUARTERLY' ? 1 : null,
      parent_goal_id: null,
    });
  };

  const getAreaById = (areaId: string | null) => {
    if (!areaId) return null;
    return areas.find(a => a.id === areaId);
  };

  const getGoalById = (goalId: string | null) => {
    if (!goalId) return null;
    return yearlyGoals.find(g => g.id === goalId);
  };

  const getQuarterLabel = (quarter: number) => {
    return `Q${quarter}`;
  };

  const getCurrentQuarter = () => {
    return Math.floor((new Date().getMonth() / 3)) + 1;
  };

  const groupGoalsByYear = (goals: Goal[]) => {
    const grouped = goals.reduce((acc, goal) => {
      if (!acc[goal.year]) {
        acc[goal.year] = [];
      }
      acc[goal.year].push(goal);
      return acc;
    }, {} as Record<number, Goal[]>);

    return Object.entries(grouped).sort((a, b) => Number(b[0]) - Number(a[0]));
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
          <h1 className="text-5xl font-bold mb-4">Goals</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Set yearly and quarterly goals that cascade from your life plan
          </p>
        </div>
      </BackgroundHeroSection>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 pb-12 relative z-10">
      <div className="bg-white rounded-2xl shadow-soft border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex">
            <button
              onClick={() => setActiveTab('YEARLY')}
              className={`px-6 py-2 text-center font-semibold transition-colors ${
                activeTab === 'YEARLY'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Calendar className="w-5 h-5 inline mr-2" />
              Yearly Goals
            </button>
            <button
              onClick={() => setActiveTab('QUARTERLY')}
              className={`px-6 py-2 text-center font-semibold transition-colors ${
                activeTab === 'QUARTERLY'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <TrendingUp className="w-5 h-5 inline mr-2" />
              Quarterly Goals
            </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDrafts(!showDrafts)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  showDrafts
                    ? 'bg-amber-100 text-amber-700 border-2 border-amber-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                {showDrafts ? 'Showing Drafts' : 'Show Drafts'}
              </button>
              <button
                onClick={openNewModal}
                className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors shadow-lg"
              >
                <Plus className="w-5 h-5" />
                New {activeTab === 'YEARLY' ? 'Yearly' : 'Quarterly'} Goal
              </button>
            </div>
          </div>
        </div>
        <div className="border-b border-gray-200 hidden">
          <div className="flex">
            <button
              onClick={() => setActiveTab('YEARLY')}
              className={`flex-1 px-6 py-4 text-center font-semibold transition-colors ${
                activeTab === 'YEARLY'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Calendar className="w-5 h-5 inline mr-2" />
              Yearly Goals
            </button>
            <button
              onClick={() => setActiveTab('QUARTERLY')}
              className={`flex-1 px-6 py-4 text-center font-semibold transition-colors ${
                activeTab === 'QUARTERLY'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <TrendingUp className="w-5 h-5 inline mr-2" />
              Quarterly Goals
            </button>
          </div>
        </div>

        <div className="p-6">
          {goals.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No {activeTab.toLowerCase()} goals yet
              </h3>
              <p className="text-gray-600 mb-6">
                {activeTab === 'YEARLY'
                  ? 'Create yearly goals that align with your life vision'
                  : 'Break down your yearly goals into quarterly milestones'}
              </p>
              <button
                onClick={openNewModal}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create {activeTab === 'YEARLY' ? 'Yearly' : 'Quarterly'} Goal
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {groupGoalsByYear(goals).map(([year, yearGoals]) => (
                <div key={year}>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{year}</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {yearGoals.map((goal) => {
                      const area = getAreaById(goal.area_id);
                      const parentGoal = getGoalById(goal.parent_goal_id);
                      return (
                        <div
                          key={goal.id}
                          className="bg-white rounded-xl p-6 shadow-soft border-2 border-gray-200 hover:shadow-soft-lg transition-all group relative"
                        >
                          <div className="absolute top-4 right-4 flex gap-2">
                            <button
                              onClick={() => openEditModal(goal)}
                              className="p-2 bg-blue-500 rounded-lg shadow-md text-white hover:bg-blue-600 transition-colors"
                              title="Edit goal"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            {goal.status === GOAL_STATUS.ACTIVE && (
                              <button
                                onClick={() => handleArchive(goal.id)}
                                className="p-2 bg-gray-100 rounded-lg shadow-md text-gray-600 hover:bg-orange-500 hover:text-white transition-colors"
                                title="Archive goal"
                              >
                                <Archive className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          {goal.status === GOAL_STATUS.COMPLETED && (
                            <div className="absolute top-4 left-4">
                              <CheckCircle2 className="w-6 h-6 text-green-500" />
                            </div>
                          )}

                          {goal.status === GOAL_STATUS.ARCHIVED && (
                            <div className="absolute top-4 left-4">
                              <Archive className="w-6 h-6 text-gray-400" />
                            </div>
                          )}

                          {goal.is_draft && (
                            <div className="absolute top-4 left-4">
                              <FileText className="w-6 h-6 text-amber-500" />
                            </div>
                          )}

                          <div className={goal.status !== GOAL_STATUS.ACTIVE || goal.is_draft ? 'pl-8' : ''}>
                            {goal.is_draft && (
                              <span className="inline-block px-3 py-1 bg-amber-100 text-amber-700 text-sm font-semibold rounded-full mb-3">
                                DRAFT
                              </span>
                            )}
                            {activeTab === 'QUARTERLY' && goal.quarter && (
                              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full mb-3 ml-2">
                                {getQuarterLabel(goal.quarter)} {goal.year}
                              </span>
                            )}

                            <h3 className="text-lg font-bold text-gray-900 mb-2">
                              {goal.title}
                            </h3>

                            {goal.description && (
                              <p className="text-sm text-gray-600 mb-4">
                                {goal.description}
                              </p>
                            )}

                            <div className="space-y-2">
                              {area && (
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-6 h-6 rounded flex items-center justify-center"
                                    style={{ backgroundColor: `${area.color}20` }}
                                  >
                                    <Target className="w-3 h-3" style={{ color: area.color }} />
                                  </div>
                                  <span className="text-sm text-gray-700">{area.name}</span>
                                </div>
                              )}

                              {parentGoal && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <TrendingUp className="w-4 h-4" />
                                  <span>From: {parentGoal.title}</span>
                                </div>
                              )}

                              <div className="mt-4">
                                <div className="flex items-center justify-between text-sm mb-2">
                                  <span className="text-gray-600">Progress</span>
                                  <span className="font-semibold text-gray-900">
                                    {goal.progress_percentage}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-primary-500 h-2 rounded-full transition-all"
                                    style={{ width: `${goal.progress_percentage}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingGoal
                  ? `Edit ${activeTab === 'YEARLY' ? 'Yearly' : 'Quarterly'} Goal`
                  : `New ${activeTab === 'YEARLY' ? 'Yearly' : 'Quarterly'} Goal`}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Goal Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={`What do you want to achieve ${activeTab === 'YEARLY' ? 'this year' : 'this quarter'}?`}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe this goal in more detail..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i).map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                {activeTab === 'QUARTERLY' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quarter
                    </label>
                    <select
                      value={formData.quarter || getCurrentQuarter()}
                      onChange={(e) =>
                        setFormData({ ...formData, quarter: parseInt(e.target.value) })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value={1}>Q1 (Jan-Mar)</option>
                      <option value={2}>Q2 (Apr-Jun)</option>
                      <option value={3}>Q3 (Jul-Sep)</option>
                      <option value={4}>Q4 (Oct-Dec)</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Area of Focus
                </label>
                <select
                  value={formData.area_id}
                  onChange={(e) => setFormData({ ...formData, area_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select an area...</option>
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </div>

              {activeTab === 'QUARTERLY' && yearlyGoals.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cascades from Yearly Goal (Optional)
                  </label>
                  <select
                    value={formData.parent_goal_id || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, parent_goal_id: e.target.value || null })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">None - standalone goal</option>
                    {yearlyGoals.map((goal) => (
                      <option key={goal.id} value={goal.id}>
                        {goal.title} ({goal.year})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSave(true)}
                  disabled={!formData.title?.trim()}
                  className="flex-1 px-6 py-3 border-2 border-primary-500 text-primary-600 rounded-xl font-semibold hover:bg-primary-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  title="Save as draft to continue editing later"
                >
                  <FileText className="w-4 h-4" />
                  Save Draft
                </button>
                <button
                  onClick={() => handleSave(false)}
                  disabled={!formData.title?.trim()}
                  className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
                >
                  {editingGoal?.is_draft ? 'Publish Goal' : editingGoal ? 'Save Changes' : 'Create Goal'}
                </button>
              </div>
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
