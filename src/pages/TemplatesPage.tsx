import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Sparkles, Search, ChevronRight, Check, Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useOrganization } from '../contexts/OrganizationContext';
import type { OutcomeTemplate, Area } from '../lib/database.types';
import { BackgroundHeroSection } from '../components/BackgroundHeroSection';
import { ImageUploadModal } from '../components/ImageUploadModal';
import { usePageBackground } from '../hooks/usePageBackground';

export function TemplatesPage() {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<OutcomeTemplate[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [applying, setApplying] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    category: 'Personal',
    outcome_title: '',
    purpose: '',
    actions: [''],
  });
  const {
    getBackgroundUrl,
    getBackgroundPosition,
    getOverlayOpacity,
    updateBackground,
    uploadImage,
  } = usePageBackground('templates');

  useEffect(() => {
    loadData();
  }, [user, organization]);

  const loadData = async () => {
    if (!user || !organization) return;

    try {
      const [templatesResult, areasResult] = await Promise.all([
        supabase
          .from('outcome_templates')
          .select('*')
          .or(`is_public.eq.true,created_by.eq.${user.id}`)
          .order('name'),
        supabase
          .from('areas')
          .select('*')
          .eq('user_id', user.id)
          .eq('organization_id', organization.id)
          .order('name')
      ]);

      if (templatesResult.error) throw templatesResult.error;
      if (areasResult.error) throw areasResult.error;

      setTemplates(templatesResult.data || []);
      setAreas(areasResult.data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = async (template: OutcomeTemplate) => {
    if (!user || !organization) return;

    setApplying(template.id);

    try {
      const newOutcome = {
        user_id: user.id,
        organization_id: organization.id,
        title: template.outcome_title,
        purpose: template.purpose,
        status: 'ACTIVE' as const,
        is_draft: true,
      };

      const { data: outcome, error: outcomeError } = await supabase
        .from('outcomes')
        .insert(newOutcome)
        .select()
        .single();

      if (outcomeError) throw outcomeError;

      if (template.actions && outcome) {
        const actionsList = template.actions as unknown as string[];
        const actions = actionsList.map((actionTitle: string, index: number) => ({
          user_id: user.id,
          outcome_id: outcome.id,
          title: actionTitle,
          done: false,
          sort_order: index,
        }));

        const { error: actionsError } = await supabase
          .from('actions')
          .insert(actions);

        if (actionsError) throw actionsError;
      }

      await supabase
        .from('outcome_templates')
        .update({ usage_count: (template.usage_count || 0) + 1 })
        .eq('id', template.id);

      navigate(`/outcomes/${outcome.id}`);
    } catch (error) {
      console.error('Error applying template:', error);
      alert('Failed to apply template. Please try again.');
    } finally {
      setApplying(null);
    }
  };

  const handleCreateTemplate = async () => {
    if (!user || !organization) return;
    if (!newTemplate.name.trim() || !newTemplate.outcome_title.trim()) return;

    try {
      const { error } = await supabase.from('outcome_templates').insert({
        name: newTemplate.name,
        description: newTemplate.description,
        category: newTemplate.category,
        outcome_title: newTemplate.outcome_title,
        purpose: newTemplate.purpose,
        actions: newTemplate.actions.filter(a => a.trim()) as any,
        is_public: false,
        created_by: user.id,
      });

      if (error) throw error;

      setShowCreateModal(false);
      setNewTemplate({
        name: '',
        description: '',
        category: 'Personal',
        outcome_title: '',
        purpose: '',
        actions: [''],
      });
      loadData();
    } catch (error) {
      console.error('Error creating template:', error);
    }
  };

  const uniqueCategories = ['all', ...Array.from(new Set(templates.map(t => t.category.toLowerCase())))].sort();
  const categories = uniqueCategories.length > 1 ? uniqueCategories : ['all', 'business', 'health', 'relationships', 'personal', 'finance', 'lifestyle'];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' ||
                           template.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      business: 'bg-blue-100 text-blue-800',
      health: 'bg-green-100 text-green-800',
      relationships: 'bg-pink-100 text-pink-800',
      personal: 'bg-purple-100 text-purple-800',
      'personal development': 'bg-purple-100 text-purple-800',
      finance: 'bg-yellow-100 text-yellow-800',
      financial: 'bg-yellow-100 text-yellow-800',
      lifestyle: 'bg-teal-100 text-teal-800',
      creative: 'bg-orange-100 text-orange-800',
      learning: 'bg-indigo-100 text-indigo-800',
      family: 'bg-pink-100 text-pink-800',
    };
    return colors[category.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading templates...</div>
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
          <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-90" />
          <h1 className="text-5xl font-bold mb-4">Templates Library</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Jumpstart your outcomes with proven templates
          </p>
        </div>
      </BackgroundHeroSection>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pb-12 space-y-6">

      <div className="flex justify-end">
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Create Custom Template
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No templates found</p>
          <p className="text-gray-400 mt-2">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getCategoryColor(template.category)}`}>
                        {template.category}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {template.name}
                    </h3>
                  </div>
                  <FileText className="w-6 h-6 text-gray-400 flex-shrink-0" />
                </div>

                {template.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {template.description}
                  </p>
                )}

                <div className="border-t border-gray-100 pt-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Purpose
                  </div>
                  <p className="text-sm text-gray-700 italic line-clamp-2">
                    {template.purpose}
                  </p>
                </div>

                {template.actions && (template.actions as unknown as string[]).length > 0 && (
                  <div className="border-t border-gray-100 pt-4">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Sample Actions ({(template.actions as unknown as string[]).length})
                    </div>
                    <ul className="space-y-1">
                      {(template.actions as unknown as string[]).slice(0, 3).map((action: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{action}</span>
                        </li>
                      ))}
                      {(template.actions as unknown as string[]).length > 3 && (
                        <li className="text-xs text-gray-400 pl-6">
                          +{(template.actions as unknown as string[]).length - 3} more actions
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                <button
                  onClick={() => applyTemplate(template)}
                  disabled={applying === template.id}
                  className="w-full mt-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  {applying === template.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Applying...
                    </>
                  ) : (
                    <>
                      Use Template
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
        <div className="flex items-start gap-4">
          <Sparkles className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">How to Use Templates</h3>
            <p className="text-sm text-blue-800">
              Click "Use Template" to create a new outcome with pre-filled purpose and actions.
              You can customize everything before publishing. Templates are saved as drafts so you can
              refine them at your own pace.
            </p>
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

      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-8 max-w-2xl w-full my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Create Custom Template</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Template Name *</label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="e.g., My Custom Workflow"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  placeholder="Describe what this template is for..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={newTemplate.category}
                  onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="Personal">Personal</option>
                  <option value="Business">Business</option>
                  <option value="Health">Health</option>
                  <option value="Relationships">Relationships</option>
                  <option value="Finance">Finance</option>
                  <option value="Lifestyle">Lifestyle</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Outcome Title *</label>
                <input
                  type="text"
                  value={newTemplate.outcome_title}
                  onChange={(e) => setNewTemplate({ ...newTemplate, outcome_title: e.target.value })}
                  placeholder="e.g., Launch My Product"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Purpose Statement</label>
                <textarea
                  value={newTemplate.purpose}
                  onChange={(e) => setNewTemplate({ ...newTemplate, purpose: e.target.value })}
                  placeholder="Why is this outcome important?"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Actions</label>
                <div className="space-y-2">
                  {newTemplate.actions.map((action, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={action}
                        onChange={(e) => {
                          const updatedActions = [...newTemplate.actions];
                          updatedActions[index] = e.target.value;
                          setNewTemplate({ ...newTemplate, actions: updatedActions });
                        }}
                        placeholder={`Action ${index + 1}`}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      {newTemplate.actions.length > 1 && (
                        <button
                          onClick={() => {
                            const updatedActions = newTemplate.actions.filter((_, i) => i !== index);
                            setNewTemplate({ ...newTemplate, actions: updatedActions });
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => setNewTemplate({ ...newTemplate, actions: [...newTemplate.actions, ''] })}
                    className="flex items-center gap-2 px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add Action
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTemplate}
                  disabled={!newTemplate.name.trim() || !newTemplate.outcome_title.trim()}
                  className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
