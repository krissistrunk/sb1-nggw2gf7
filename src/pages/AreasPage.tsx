import { useState, useEffect } from 'react';
import { Plus, Heart, Briefcase, DollarSign, Users, BookOpen, Sparkles, Smile, X, CreditCard as Edit2, Trash2, Target } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { BackgroundHeroSection } from '../components/BackgroundHeroSection';
import { ImageUploadModal } from '../components/ImageUploadModal';
import { usePageBackground } from '../hooks/usePageBackground';

const ICON_OPTIONS = [
  { name: 'Heart', icon: Heart },
  { name: 'Briefcase', icon: Briefcase },
  { name: 'DollarSign', icon: DollarSign },
  { name: 'Users', icon: Users },
  { name: 'BookOpen', icon: BookOpen },
  { name: 'Sparkles', icon: Sparkles },
  { name: 'Smile', icon: Smile },
  { name: 'Target', icon: Target },
];

const COLOR_OPTIONS = [
  '#EF4444',
  '#F97316',
  '#F59E0B',
  '#10B981',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#6B7280',
];

interface Area {
  id: string;
  name: string;
  icon: string;
  color: string;
  outcome_count?: number;
  background_image_url?: string;
  description?: string;
  identity_statement?: string;
  color_hex?: string;
  sort_order?: number;
}

export function AreasPage() {
  const { user } = useAuth();
  const [areas, setAreas] = useState<Area[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    icon: 'Target',
    color: '#3B82F6',
    background_image_url: '',
    description: '',
    identity_statement: '',
  });
  const [showImageModal, setShowImageModal] = useState(false);
  const {
    getBackgroundUrl,
    getBackgroundPosition,
    getOverlayOpacity,
    updateBackground,
    uploadImage,
  } = usePageBackground('areas');

  useEffect(() => {
    if (user) {
      loadAreas();
    }
  }, [user]);

  const loadAreas = async () => {
    try {
      const { data: areasData } = await supabase
        .from('areas')
        .select('*')
        .eq('user_id', user?.id)
        .order('sort_order', { ascending: true })
        .order('name');

      const areasWithCounts = await Promise.all(
        (areasData || []).map(async (area) => {
          const { count } = await supabase
            .from('outcomes')
            .select('*', { count: 'exact', head: true })
            .eq('area_id', area.id)
            .eq('status', 'ACTIVE');

          return { ...area, outcome_count: count || 0 };
        })
      );

      setAreas(areasWithCounts);
    } catch (error) {
      console.error('Error loading areas:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingArea) {
        await supabase
          .from('areas')
          .update({
            name: formData.name,
            icon: formData.icon,
            color: formData.color,
            background_image_url: formData.background_image_url || null,
            description: formData.description || null,
            identity_statement: formData.identity_statement || null,
            color_hex: formData.color,
          })
          .eq('id', editingArea.id);
      } else {
        await supabase.from('areas').insert({
          user_id: user?.id,
          name: formData.name,
          icon: formData.icon,
          color: formData.color,
          background_image_url: formData.background_image_url || null,
          description: formData.description || null,
          identity_statement: formData.identity_statement || null,
          color_hex: formData.color,
          sort_order: areas.length,
        });
      }

      setShowModal(false);
      setEditingArea(null);
      setFormData({ name: '', icon: 'Target', color: '#3B82F6', background_image_url: '', description: '', identity_statement: '' });
      loadAreas();
    } catch (error) {
      console.error('Error saving area:', error);
    }
  };

  const handleEdit = (area: Area) => {
    setEditingArea(area);
    setFormData({
      name: area.name,
      icon: area.icon,
      color: area.color,
      background_image_url: area.background_image_url || '',
      description: area.description || '',
      identity_statement: area.identity_statement || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this area? This will not delete associated outcomes.')) return;

    try {
      await supabase.from('areas').delete().eq('id', id);
      loadAreas();
    } catch (error) {
      console.error('Error deleting area:', error);
    }
  };

  const openNewModal = () => {
    setEditingArea(null);
    setFormData({ name: '', icon: 'Target', color: '#3B82F6', background_image_url: '', description: '', identity_statement: '' });
    setShowModal(true);
  };

  const getIconComponent = (iconName: string) => {
    const iconOption = ICON_OPTIONS.find(opt => opt.name === iconName);
    return iconOption ? iconOption.icon : Target;
  };

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
          <h1 className="text-5xl font-bold mb-4">Areas of Focus</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Organize your life into meaningful categories
          </p>
        </div>
      </BackgroundHeroSection>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 pb-12 space-y-6">
        <div className="flex justify-end">
          <button
            onClick={openNewModal}
            className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors shadow-lg"
          >
            <Plus className="w-5 h-5" />
            New Area
          </button>
        </div>

      {areas.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-soft">
          <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No areas yet</h3>
          <p className="text-gray-600 mb-6">Create areas to organize your outcomes and goals</p>
          <button
            onClick={openNewModal}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Area
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {areas.map((area) => {
            const Icon = getIconComponent(area.icon);
            const hasBackgroundImage = area.background_image_url;

            return (
              <div
                key={area.id}
                className="group relative overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                style={{ minHeight: '320px' }}
              >
                {hasBackgroundImage ? (
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${area.background_image_url})` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
                  </div>
                ) : (
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(135deg, ${area.color}15 0%, ${area.color}05 100%)`
                    }}
                  />
                )}

                <div className="relative h-full flex flex-col justify-between p-6">
                  <div className="flex items-start justify-between">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-sm"
                      style={{
                        backgroundColor: hasBackgroundImage ? 'rgba(255, 255, 255, 0.2)' : `${area.color}30`,
                        border: hasBackgroundImage ? '1px solid rgba(255, 255, 255, 0.3)' : 'none'
                      }}
                    >
                      <Icon
                        className="w-8 h-8"
                        style={{ color: hasBackgroundImage ? '#ffffff' : area.color }}
                      />
                    </div>

                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(area)}
                        className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-md text-gray-700 hover:text-blue-600 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(area.id)}
                        className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-md text-gray-700 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3
                      className={`text-2xl font-bold mb-2 ${hasBackgroundImage ? 'text-white' : 'text-gray-900'}`}
                    >
                      {area.name}
                    </h3>

                    {area.identity_statement && (
                      <p
                        className={`text-sm mb-3 italic ${hasBackgroundImage ? 'text-white/90' : 'text-gray-700'}`}
                      >
                        "{area.identity_statement}"
                      </p>
                    )}

                    {area.description && (
                      <p
                        className={`text-sm mb-3 line-clamp-2 ${hasBackgroundImage ? 'text-white/80' : 'text-gray-600'}`}
                      >
                        {area.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2">
                      <div
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          hasBackgroundImage
                            ? 'bg-white/20 backdrop-blur-sm text-white border border-white/30'
                            : 'text-gray-700'
                        }`}
                        style={!hasBackgroundImage ? { backgroundColor: `${area.color}20`, color: area.color } : {}}
                      >
                        {area.outcome_count} active outcome{area.outcome_count !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full my-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingArea ? 'Edit Area' : 'New Area'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Health, Business, Family"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                <div className="grid grid-cols-4 gap-3">
                  {ICON_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isSelected = formData.icon === option.name;
                    return (
                      <button
                        key={option.name}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: option.name })}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="w-6 h-6 mx-auto" style={{ color: formData.color }} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <div className="grid grid-cols-8 gap-3">
                  {COLOR_OPTIONS.map((color) => {
                    const isSelected = formData.color === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-10 h-10 rounded-lg transition-all ${
                          isSelected ? 'ring-2 ring-offset-2 ring-primary-500' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Background Image URL (optional)
                </label>
                <input
                  type="url"
                  value={formData.background_image_url}
                  onChange={(e) => setFormData({ ...formData, background_image_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="https://images.pexels.com/..."
                />
                <p className="text-xs text-gray-500 mt-1">Add a background image from Pexels or other sources</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Identity Statement (optional)
                </label>
                <input
                  type="text"
                  value={formData.identity_statement}
                  onChange={(e) => setFormData({ ...formData, identity_statement: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder='e.g., "I am a leader who inspires others"'
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Describe what this area means to you..."
                />
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
                  type="submit"
                  className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors"
                >
                  {editingArea ? 'Save Changes' : 'Create Area'}
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
