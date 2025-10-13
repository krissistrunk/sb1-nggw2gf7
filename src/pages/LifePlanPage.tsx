import { useState, useEffect } from 'react';
import { Compass, Heart, User, Sparkles, Save, CreditCard as Edit2, Plus, X, Trash2, Target, Zap, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useOrganization } from '../contexts/OrganizationContext';
import type { LifePlan, Area } from '../lib/database.types';
import { BackgroundHeroSection } from '../components/BackgroundHeroSection';
import { ImageUploadModal } from '../components/ImageUploadModal';
import { usePageBackground } from '../hooks/usePageBackground';

interface Role {
  name: string;
  description: string;
}

interface Value {
  name: string;
  description: string;
}

interface Resources {
  people: string[];
  skills: string[];
  tools: string[];
  financial: string;
}

export function LifePlanPage() {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const [lifePlan, setLifePlan] = useState<LifePlan | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [vision, setVision] = useState('');
  const [purpose, setPurpose] = useState('');
  const [values, setValues] = useState<Value[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [threeToThrive, setThreeToThrive] = useState<string[]>([]);
  const [resources, setResources] = useState<Resources>({ people: [], skills: [], tools: [], financial: '' });
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showValueModal, setShowValueModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [newValue, setNewValue] = useState({ name: '', description: '' });
  const [newRole, setNewRole] = useState({ name: '', description: '' });
  const [newResourceItem, setNewResourceItem] = useState('');
  const [resourceType, setResourceType] = useState<'people' | 'skills' | 'tools'>('people');
  const [showImageModal, setShowImageModal] = useState(false);
  const {
    getBackgroundUrl,
    getBackgroundPosition,
    getOverlayOpacity,
    updateBackground,
    uploadImage,
  } = usePageBackground('life-plan');

  useEffect(() => {
    if (user && organization) {
      loadLifePlan();
      loadAreas();
    }
  }, [user, organization]);

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

  const loadLifePlan = async () => {
    try {
      const { data } = await supabase
        .from('life_plans')
        .select('*')
        .eq('user_id', user?.id)
        .eq('organization_id', organization?.id)
        .maybeSingle();

      if (data) {
        setLifePlan(data);
        setVision(data.vision);
        setPurpose(data.purpose || '');
        setValues((data.values as Value[]) || []);
        setRoles((data.roles as Role[]) || []);
        setThreeToThrive((data.three_to_thrive as string[]) || []);
        setResources((data.resources as Resources) || { people: [], skills: [], tools: [], financial: '' });
      } else {
        setIsEditing(true);
      }
    } catch (error) {
      console.error('Error loading life plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const planData = {
        user_id: user?.id,
        organization_id: organization?.id,
        vision,
        purpose,
        values: values as any,
        roles: roles as any,
        three_to_thrive: threeToThrive as any,
        resources: resources as any,
      };

      if (lifePlan) {
        await supabase
          .from('life_plans')
          .update({
            vision,
            purpose,
            values: values as any,
            roles: roles as any,
            three_to_thrive: threeToThrive as any,
            resources: resources as any,
            updated_at: new Date().toISOString(),
          })
          .eq('id', lifePlan.id);
      } else {
        const { data } = await supabase
          .from('life_plans')
          .insert(planData)
          .select()
          .single();
        setLifePlan(data);
      }

      setIsEditing(false);
      loadLifePlan();
    } catch (error) {
      console.error('Error saving life plan:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddValue = async () => {
    if (newValue.name.trim()) {
      const updatedValues = [...values, newValue];
      setValues(updatedValues);
      setNewValue({ name: '', description: '' });
      setShowValueModal(false);

      // Auto-save to database
      try {
        if (lifePlan) {
          await supabase
            .from('life_plans')
            .update({
              values: updatedValues as any,
              updated_at: new Date().toISOString(),
            })
            .eq('id', lifePlan.id);
        }
      } catch (error) {
        console.error('Error saving value:', error);
      }
    }
  };

  const handleRemoveValue = async (index: number) => {
    const updatedValues = values.filter((_, i) => i !== index);
    setValues(updatedValues);

    // Auto-save to database
    try {
      if (lifePlan) {
        await supabase
          .from('life_plans')
          .update({
            values: updatedValues as any,
            updated_at: new Date().toISOString(),
          })
          .eq('id', lifePlan.id);
      }
    } catch (error) {
      console.error('Error removing value:', error);
    }
  };

  const handleAddRole = async () => {
    if (newRole.name.trim()) {
      const updatedRoles = [...roles, newRole];
      setRoles(updatedRoles);
      setNewRole({ name: '', description: '' });
      setShowRoleModal(false);

      // Auto-save to database
      try {
        if (lifePlan) {
          await supabase
            .from('life_plans')
            .update({
              roles: updatedRoles as any,
              updated_at: new Date().toISOString(),
            })
            .eq('id', lifePlan.id);
        }
      } catch (error) {
        console.error('Error saving role:', error);
      }
    }
  };

  const handleRemoveRole = async (index: number) => {
    const updatedRoles = roles.filter((_, i) => i !== index);
    setRoles(updatedRoles);

    // Auto-save to database
    try {
      if (lifePlan) {
        await supabase
          .from('life_plans')
          .update({
            roles: updatedRoles as any,
            updated_at: new Date().toISOString(),
          })
          .eq('id', lifePlan.id);
      }
    } catch (error) {
      console.error('Error removing role:', error);
    }
  };

  const handleToggleThreeToThrive = (areaId: string) => {
    if (threeToThrive.includes(areaId)) {
      setThreeToThrive(threeToThrive.filter(id => id !== areaId));
    } else if (threeToThrive.length < 3) {
      setThreeToThrive([...threeToThrive, areaId]);
    }
  };

  const handleAddResource = async () => {
    if (newResourceItem.trim()) {
      const updatedResources = {
        ...resources,
        [resourceType]: [...resources[resourceType], newResourceItem.trim()]
      };
      setResources(updatedResources);
      setNewResourceItem('');
      setShowResourceModal(false);

      // Auto-save to database
      try {
        if (lifePlan) {
          await supabase
            .from('life_plans')
            .update({
              resources: updatedResources as any,
              updated_at: new Date().toISOString(),
            })
            .eq('id', lifePlan.id);
        }
      } catch (error) {
        console.error('Error saving resource:', error);
      }
    }
  };

  const handleRemoveResource = async (type: 'people' | 'skills' | 'tools', index: number) => {
    const updatedResources = {
      ...resources,
      [type]: resources[type].filter((_, i) => i !== index)
    };
    setResources(updatedResources);

    // Auto-save to database
    try {
      if (lifePlan) {
        await supabase
          .from('life_plans')
          .update({
            resources: updatedResources as any,
            updated_at: new Date().toISOString(),
          })
          .eq('id', lifePlan.id);
      }
    } catch (error) {
      console.error('Error removing resource:', error);
    }
  };

  const getAreaById = (areaId: string) => {
    return areas.find(a => a.id === areaId);
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
          <Compass className="w-16 h-16 mx-auto mb-4 opacity-90" />
          <h1 className="text-5xl font-bold mb-4">Life Plan</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Define your vision, purpose, values, roles, and resources - the foundation of your RPM system
          </p>
        </div>
      </BackgroundHeroSection>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 pb-12">
        {!isEditing && lifePlan && (
          <div className="flex justify-end mb-6">
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors shadow-lg"
            >
              <Edit2 className="w-5 h-5" />
              Edit Life Plan
            </button>
          </div>
        )}

      {!lifePlan && !isEditing ? (
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-12 text-white text-center shadow-soft-lg">
          <Compass className="w-20 h-20 mx-auto mb-6 opacity-90" />
          <h2 className="text-3xl font-bold mb-4">Create Your Life Plan</h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Your Life Plan is the compass that guides everything in RPM. Define your ultimate vision,
            core values, and key roles to create clarity and purpose in everything you do.
          </p>
          <button
            onClick={() => setIsEditing(true)}
            className="px-8 py-4 bg-white text-primary-600 rounded-xl font-semibold hover:bg-primary-50 transition-colors shadow-lg"
          >
            Start Creating Your Life Plan
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-8 shadow-soft border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Compass className="w-8 h-8 text-blue-500" />
                <h2 className="text-2xl font-bold text-gray-900">Your Ultimate Vision</h2>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              If your life were exactly how you wanted it to be in all areas, what would it look like?
              Write freely about your ideal future.
            </p>
            {isEditing ? (
              <textarea
                value={vision}
                onChange={(e) => setVision(e.target.value)}
                placeholder="Describe your ultimate vision... Be specific and dream big! What does your ideal life look like 5, 10, 20 years from now?"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                rows={8}
              />
            ) : (
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{vision}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-soft border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Target className="w-8 h-8 text-purple-500" />
                <h2 className="text-2xl font-bold text-gray-900">Your Purpose</h2>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Why do you exist? What is the core reason behind your vision? This is your north star.
            </p>
            {isEditing ? (
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Describe your core purpose... Why does this vision matter to you? What impact do you want to have?"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                rows={4}
              />
            ) : (
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{purpose || 'No purpose defined yet'}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-soft border-l-4 border-red-500">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Heart className="w-8 h-8 text-red-500" />
                <h2 className="text-2xl font-bold text-gray-900">Core Values</h2>
              </div>
              <button
                onClick={() => setShowValueModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Value
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              What are the 5-10 core values that define who you are and guide your decisions?
            </p>

            {values.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl">
                <Heart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">
                  {isEditing ? 'Add your first core value' : 'No values defined yet'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {values.map((value, index) => (
                  <div
                    key={index}
                    className="p-4 bg-red-50 rounded-xl border-2 border-red-200 relative group"
                  >
                    <button
                      onClick={() => handleRemoveValue(index)}
                      className="absolute top-2 right-2 p-1 text-red-600 hover:bg-red-200 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <h3 className="font-bold text-red-900 mb-1">{value.name}</h3>
                    <p className="text-sm text-red-700">{value.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-soft border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <User className="w-8 h-8 text-green-500" />
                <h2 className="text-2xl font-bold text-gray-900">Life Roles</h2>
              </div>
              <button
                onClick={() => setShowRoleModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Role
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              What are the key roles you play in life? (e.g., Leader, Parent, Partner, Friend, Creator)
            </p>

            {roles.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl">
                <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">
                  {isEditing ? 'Add your first life role' : 'No roles defined yet'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roles.map((role, index) => (
                  <div
                    key={index}
                    className="p-4 bg-green-50 rounded-xl border-2 border-green-200 relative group"
                  >
                    <button
                      onClick={() => handleRemoveRole(index)}
                      className="absolute top-2 right-2 p-1 text-green-600 hover:bg-green-200 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <h3 className="font-bold text-green-900 mb-1">{role.name}</h3>
                    <p className="text-sm text-green-700">{role.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-soft border-l-4 border-orange-500">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Zap className="w-8 h-8 text-orange-500" />
                <h2 className="text-2xl font-bold text-gray-900">Three to Thrive</h2>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Select your top 3 areas of focus for maximum impact. These are your critical priorities right now.
            </p>

            {areas.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">
                  Create areas first to select your Three to Thrive
                </p>
                <a
                  href="/areas"
                  className="inline-block mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Go to Areas
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {areas.map((area) => {
                  const isSelected = threeToThrive.includes(area.id);
                  const IconComponent = area.icon ? Heart : Target;
                  return (
                    <button
                      key={area.id}
                      onClick={() => isEditing && handleToggleThreeToThrive(area.id)}
                      disabled={!isEditing && !isSelected}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? 'bg-orange-50 border-orange-500'
                          : isEditing
                          ? 'bg-gray-50 border-gray-200 hover:border-orange-300 cursor-pointer'
                          : 'bg-gray-50 border-gray-200 opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${area.color}20` }}
                        >
                          <IconComponent className="w-5 h-5" style={{ color: area.color }} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">{area.name}</h3>
                          {isSelected && (
                            <span className="text-xs text-orange-600 font-medium">Top Priority</span>
                          )}
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {threeToThrive.indexOf(area.id) + 1}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            {isEditing && threeToThrive.length < 3 && areas.length > 0 && (
              <p className="text-sm text-orange-600 mt-4 font-medium">
                Select {3 - threeToThrive.length} more area{3 - threeToThrive.length !== 1 ? 's' : ''} to complete Three to Thrive
              </p>
            )}
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-soft border-l-4 border-teal-500">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Package className="w-8 h-8 text-teal-500" />
                <h2 className="text-2xl font-bold text-gray-900">Resources</h2>
              </div>
              <button
                onClick={() => setShowResourceModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Resource
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              What resources do you have available to achieve your goals? People, skills, tools, and finances.
            </p>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-teal-600" />
                  People
                </h3>
                {resources.people.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No people resources added yet</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {resources.people.map((person, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-teal-50 text-teal-700 rounded-lg text-sm flex items-center gap-2"
                      >
                        {person}
                        <button
                          onClick={() => handleRemoveResource('people', index)}
                          className="text-teal-600 hover:text-teal-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  Skills
                </h3>
                {resources.skills.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No skills added yet</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {resources.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-teal-50 text-teal-700 rounded-lg text-sm flex items-center gap-2"
                      >
                        {skill}
                        <button
                          onClick={() => handleRemoveResource('skills', index)}
                          className="text-teal-600 hover:text-teal-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-teal-600" />
                  Tools & Assets
                </h3>
                {resources.tools.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No tools added yet</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {resources.tools.map((tool, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-teal-50 text-teal-700 rounded-lg text-sm flex items-center gap-2"
                      >
                        {tool}
                        <button
                          onClick={() => handleRemoveResource('tools', index)}
                          className="text-teal-600 hover:text-teal-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Financial Resources</h3>
                {isEditing ? (
                  <textarea
                    value={resources.financial}
                    onChange={(e) => setResources({ ...resources, financial: e.target.value })}
                    placeholder="Describe your financial situation, budget available, or financial goals..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                ) : (
                  <p className="text-gray-700">
                    {resources.financial || 'No financial information provided'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="flex gap-4">
              <button
                onClick={() => {
                  if (lifePlan) {
                    setVision(lifePlan.vision);
                    setPurpose(lifePlan.purpose || '');
                    setValues((lifePlan.values as Value[]) || []);
                    setRoles((lifePlan.roles as Role[]) || []);
                    setThreeToThrive((lifePlan.three_to_thrive as string[]) || []);
                    setResources((lifePlan.resources as Resources) || { people: [], skills: [], tools: [], financial: '' });
                  }
                  setIsEditing(false);
                }}
                className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !vision.trim()}
                className="flex-1 px-6 py-4 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Saving...' : 'Save Life Plan'}
              </button>
            </div>
          )}

          {!isEditing && (
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-6 border-2 border-blue-200">
              <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Your Life Plan is Your Foundation
              </h3>
              <p className="text-sm text-blue-800 mb-4">
                Everything in your RPM system flows from this Life Plan. Your vision and purpose guide your yearly and quarterly goals,
                which break down into outcomes and actions. Review and refine this regularly to stay aligned with what matters most.
              </p>
              <div className="flex gap-3">
                <a
                  href="/goals"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg"
                >
                  <Target className="w-5 h-5" />
                  Set Your Goals
                </a>
                <a
                  href="/areas"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
                >
                  Manage Areas
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {showValueModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowValueModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Add Core Value</h2>
              <button
                onClick={() => setShowValueModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Value Name</label>
                <input
                  type="text"
                  value={newValue.name}
                  onChange={(e) => setNewValue({ ...newValue, name: e.target.value })}
                  placeholder="e.g., Integrity, Growth, Family"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What does this mean to you?
                </label>
                <textarea
                  value={newValue.description}
                  onChange={(e) => setNewValue({ ...newValue, description: e.target.value })}
                  placeholder="Describe what this value means and why it matters..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowValueModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddValue}
                  disabled={!newValue.name.trim()}
                  className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  Add Value
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRoleModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowRoleModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Add Life Role</h2>
              <button
                onClick={() => setShowRoleModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role Name</label>
                <input
                  type="text"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  placeholder="e.g., Leader, Parent, Partner"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What does this role mean to you?
                </label>
                <textarea
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  placeholder="Describe this role and what success looks like..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddRole}
                  disabled={!newRole.name.trim()}
                  className="flex-1 px-6 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  Add Role
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showResourceModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowResourceModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Add Resource</h2>
              <button
                onClick={() => setShowResourceModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Resource Type</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setResourceType('people')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      resourceType === 'people'
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <User className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-xs font-medium">People</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setResourceType('skills')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      resourceType === 'skills'
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Sparkles className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-xs font-medium">Skills</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setResourceType('tools')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      resourceType === 'tools'
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Package className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-xs font-medium">Tools</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {resourceType === 'people' && 'Person Name'}
                  {resourceType === 'skills' && 'Skill Name'}
                  {resourceType === 'tools' && 'Tool or Asset Name'}
                </label>
                <input
                  type="text"
                  value={newResourceItem}
                  onChange={(e) => setNewResourceItem(e.target.value)}
                  placeholder={
                    resourceType === 'people'
                      ? 'e.g., John Smith, Mentor, Coach'
                      : resourceType === 'skills'
                      ? 'e.g., Programming, Public Speaking'
                      : 'e.g., MacBook, Office Space, Car'
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddResource();
                    }
                  }}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowResourceModal(false);
                    setNewResourceItem('');
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddResource}
                  disabled={!newResourceItem.trim()}
                  className="flex-1 px-6 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors disabled:opacity-50"
                >
                  Add Resource
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
