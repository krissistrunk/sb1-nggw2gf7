import { useState, useEffect } from 'react';
import {
  Plus,
  Lightbulb,
  Target,
  Zap,
  Trash2,
  MoveRight,
  Package,
  Edit2,
  Archive,
  X,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useOrganization } from '../contexts/OrganizationContext';
import { useChunks } from '../hooks/useChunks';
import { AIChunkSuggestions } from '../components/AIChunkSuggestions';
import type { InboxItem, ChunkWithItems, Area, Goal } from '../lib/database.types';
import { BackgroundHeroSection } from '../components/BackgroundHeroSection';
import { ImageUploadModal } from '../components/ImageUploadModal';
import { usePageBackground } from '../hooks/usePageBackground';
import { GOAL_STATUS, OUTCOME_STATUS } from '../constants/status';

type ViewMode = 'categorize' | 'chunk';

export function CapturePage() {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('categorize');
  const [draggedItem, setDraggedItem] = useState<InboxItem | null>(null);
  const [expandedChunks, setExpandedChunks] = useState<Set<string>>(new Set());
  const [editingChunk, setEditingChunk] = useState<string | null>(null);
  const [chunkName, setChunkName] = useState('');
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [selectedChunk, setSelectedChunk] = useState<ChunkWithItems | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const {
    getBackgroundUrl,
    getBackgroundPosition,
    getOverlayOpacity,
    updateBackground,
    uploadImage,
  } = usePageBackground('capture');

  const {
    chunks,
    loading: chunksLoading,
    createChunk,
    updateChunk,
    deleteChunk,
    archiveChunk,
    addItemToChunk,
    removeItemFromChunk,
    convertChunkToOutcome,
    refresh: refreshChunks,
  } = useChunks();

  useEffect(() => {
    if (user && organization) {
      loadItems();
      loadAreasAndGoals();
    }
  }, [user, organization]);

  const loadItems = async () => {
    try {
      const { data } = await supabase
        .from('inbox_items')
        .select('*')
        .eq('user_id', user?.id)
        .eq('organization_id', organization?.id)
        .eq('triaged', false)
        .is('chunk_id', null)
        .order('created_at', { ascending: false });

      setItems(data || []);
    } catch (error) {
      console.error('Error loading inbox items:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAreasAndGoals = async () => {
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
        .eq('status', GOAL_STATUS.ACTIVE)
        .order('year', { ascending: false });

      setAreas(areasData || []);
      setGoals(goalsData || []);
    } catch (error) {
      console.error('Error loading areas and goals:', error);
    }
  };

  const handleCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;

    try {
      await supabase.from('inbox_items').insert({
        user_id: user?.id,
        organization_id: organization?.id,
        content: newItem.trim(),
        item_type: 'NOTE',
        triaged: false,
      });

      setNewItem('');
      loadItems();
    } catch (error) {
      console.error('Error capturing item:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await supabase.from('inbox_items').delete().eq('id', id);
      loadItems();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleTypeChange = async (id: string, type: string) => {
    try {
      await supabase.from('inbox_items').update({ item_type: type }).eq('id', id);
      loadItems();
    } catch (error) {
      console.error('Error updating item type:', error);
    }
  };

  const handleDragStart = (item: InboxItem) => {
    setDraggedItem(item);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnCategory = async (targetType: 'OUTCOME_IDEA' | 'ACTION_IDEA' | 'NOTE') => {
    if (!draggedItem) return;

    try {
      await supabase
        .from('inbox_items')
        .update({ item_type: targetType })
        .eq('id', draggedItem.id);

      setDraggedItem(null);
      loadItems();
    } catch (error) {
      console.error('Error updating item type:', error);
    }
  };

  const handleDropOnChunk = async (chunkId: string) => {
    if (!draggedItem) return;

    try {
      await addItemToChunk(chunkId, draggedItem.id);
      setDraggedItem(null);
      loadItems();
    } catch (error) {
      console.error('Error adding item to chunk:', error);
    }
  };

  const handleCreateChunk = async () => {
    if (!chunkName.trim()) return;

    try {
      await createChunk(chunkName.trim());
      setChunkName('');
      setEditingChunk(null);
    } catch (error) {
      console.error('Error creating chunk:', error);
    }
  };

  const handleUpdateChunkName = async (chunkId: string, newName: string) => {
    if (!newName.trim()) return;

    try {
      await updateChunk(chunkId, { name: newName.trim() });
      setEditingChunk(null);
    } catch (error) {
      console.error('Error updating chunk name:', error);
    }
  };

  const handleRemoveFromChunk = async (chunkItemId: string, inboxItemId: string) => {
    try {
      await removeItemFromChunk(chunkItemId, inboxItemId);
      loadItems();
    } catch (error) {
      console.error('Error removing item from chunk:', error);
    }
  };

  const toggleChunkExpanded = (chunkId: string) => {
    setExpandedChunks((prev) => {
      const next = new Set(prev);
      if (next.has(chunkId)) {
        next.delete(chunkId);
      } else {
        next.add(chunkId);
      }
      return next;
    });
  };

  const handleConvertChunk = (chunk: ChunkWithItems) => {
    setSelectedChunk(chunk);
    setShowConversionModal(true);
  };

  const handleCreateOutcomeFromChunk = async (formData: {
    title: string;
    purpose: string;
    description?: string;
    area_id: string;
    goal_id?: string;
    shouldArchive: boolean;
  }) => {
    if (!selectedChunk || !organization) return;

    try {
      const { data: outcome, error: outcomeError } = await supabase
        .from('outcomes')
        .insert({
          user_id: user?.id!,
          organization_id: organization.id,
          title: formData.title,
          description: formData.description || null,
          purpose: formData.purpose,
          area_id: formData.area_id,
          goal_id: formData.goal_id || null,
          status: OUTCOME_STATUS.ACTIVE,
          source_chunk_id: selectedChunk.id,
        })
        .select()
        .single();

      if (outcomeError) throw outcomeError;

      for (const item of selectedChunk.items) {
        await supabase.from('actions').insert({
          outcome_id: outcome.id,
          user_id: user?.id!,
          title: item.inbox_item.content,
          done: false,
          priority: 2,
          duration_minutes: 30,
        });
      }

      await convertChunkToOutcome(selectedChunk.id, outcome.id, formData.shouldArchive);

      setShowConversionModal(false);
      setSelectedChunk(null);
      loadItems();
      refreshChunks();
    } catch (error) {
      console.error('Error creating outcome from chunk:', error);
      alert('Failed to create outcome. Please try again.');
    }
  };

  const outcomeIdeas = items.filter((i) => i.item_type === 'OUTCOME_IDEA');
  const actionIdeas = items.filter((i) => i.item_type === 'ACTION_IDEA');
  const notes = items.filter((i) => i.item_type === 'NOTE');

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
          <Lightbulb className="w-16 h-16 mx-auto mb-4 opacity-90" />
          <h1 className="text-5xl font-bold mb-4">Capture</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Brain dump everything on your mind
          </p>
        </div>
      </BackgroundHeroSection>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pb-12 space-y-4 sm:space-y-6">


      <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-soft-lg">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Quick Capture</h2>
        <form onSubmit={handleCapture} className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="What's on your mind? Just type and press enter..."
            className="flex-1 px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl border-2 border-white/20 bg-white/10 text-white placeholder-white/60 focus:outline-none focus:border-white/40 text-base sm:text-lg"
          />
          <button
            type="submit"
            className="px-6 sm:px-8 py-3 sm:py-4 bg-white text-primary-600 rounded-lg sm:rounded-xl font-semibold hover:bg-primary-50 transition-colors shadow-lg flex items-center justify-center gap-2 text-base min-h-touch-target"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            Capture
          </button>
        </form>
        <p className="text-primary-100 text-xs sm:text-sm mt-2 sm:mt-3">
          Don't filter or organize yet - just get everything out of your head!
        </p>
      </div>

      {items.length === 0 && chunks.length === 0 ? (
        <div className="bg-white rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center shadow-soft">
          <Lightbulb className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
            Your mind is clear!
          </h3>
          <p className="text-sm sm:text-base text-gray-600">
            Start capturing ideas, tasks, and commitments as they come to you.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Captured Items ({items.length})
              </h2>
              <p className="text-xs sm:text-sm text-gray-600">
                {viewMode === 'categorize'
                  ? 'Categorize items by type'
                  : 'Group related items into chunks'}
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setViewMode('categorize')}
                className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-colors shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base min-h-touch-target ${
                  viewMode === 'categorize'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Target className="w-4 h-4 sm:w-5 sm:h-5" />
                Categorize
              </button>
              <button
                onClick={() => setViewMode('chunk')}
                className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-colors shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base min-h-touch-target ${
                  viewMode === 'chunk'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Package className="w-4 h-4 sm:w-5 sm:h-5" />
                Chunk
              </button>
              {viewMode === 'chunk' && items.length >= 2 && (
                <AIChunkSuggestions
                  inboxItems={items}
                  onChunksCreated={(suggestions) => {
                    console.log('AI Chunk Suggestions:', suggestions);
                  }}
                />
              )}
            </div>
          </div>

          {viewMode === 'categorize' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <div
                className="bg-blue-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-blue-200 min-h-[250px] sm:min-h-[300px]"
                onDragOver={handleDragOver}
                onDrop={() => handleDropOnCategory('OUTCOME_IDEA')}
              >
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <Target className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  <h3 className="text-base sm:text-lg font-bold text-blue-900">
                    Outcome Ideas ({outcomeIdeas.length})
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-blue-700 mb-3 sm:mb-4">
                  Results you want to achieve - your goals and desired outcomes
                </p>
                <div className="space-y-2">
                  {outcomeIdeas.map((item) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={() => handleDragStart(item)}
                      className="bg-white rounded-lg p-2 sm:p-3 shadow-sm hover:shadow-md transition-shadow cursor-move"
                    >
                      <p className="text-xs sm:text-sm text-gray-900 mb-2">{item.content}</p>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-[10px] sm:text-xs text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {outcomeIdeas.length === 0 && (
                    <p className="text-xs sm:text-sm text-blue-600 italic">
                      Drag outcome ideas here
                    </p>
                  )}
                </div>
              </div>

              <div
                className="bg-green-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-green-200 min-h-[250px] sm:min-h-[300px]"
                onDragOver={handleDragOver}
                onDrop={() => handleDropOnCategory('ACTION_IDEA')}
              >
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  <h3 className="text-base sm:text-lg font-bold text-green-900">
                    Action Ideas ({actionIdeas.length})
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-green-700 mb-3 sm:mb-4">
                  Specific tasks and actions to take
                </p>
                <div className="space-y-2">
                  {actionIdeas.map((item) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={() => handleDragStart(item)}
                      className="bg-white rounded-lg p-2 sm:p-3 shadow-sm hover:shadow-md transition-shadow cursor-move"
                    >
                      <p className="text-xs sm:text-sm text-gray-900 mb-2">{item.content}</p>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-[10px] sm:text-xs text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {actionIdeas.length === 0 && (
                    <p className="text-xs sm:text-sm text-green-600 italic">
                      Drag action ideas here
                    </p>
                  )}
                </div>
              </div>

              <div
                className="bg-gray-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-gray-200 min-h-[250px] sm:min-h-[300px]"
                onDragOver={handleDragOver}
                onDrop={() => handleDropOnCategory('NOTE')}
              >
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">
                    Notes ({notes.length})
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-gray-700 mb-3 sm:mb-4">
                  General notes and ideas
                </p>
                <div className="space-y-2">
                  {notes.map((item) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={() => handleDragStart(item)}
                      className="bg-white rounded-lg p-2 sm:p-3 shadow-sm hover:shadow-md transition-shadow cursor-move"
                    >
                      <p className="text-xs sm:text-sm text-gray-900 mb-2">{item.content}</p>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-[10px] sm:text-xs text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {notes.length === 0 && (
                    <p className="text-xs sm:text-sm text-gray-600 italic">No notes yet</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-soft">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">
                    Chunks ({chunks.length})
                  </h3>
                  {editingChunk === 'new' ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={chunkName}
                        onChange={(e) => setChunkName(e.target.value)}
                        placeholder="Chunk name..."
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                        autoFocus
                      />
                      <button
                        onClick={handleCreateChunk}
                        className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600"
                      >
                        Create
                      </button>
                      <button
                        onClick={() => {
                          setEditingChunk(null);
                          setChunkName('');
                        }}
                        className="p-1.5 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingChunk('new')}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      New Chunk
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {chunks.map((chunk) => (
                    <div
                      key={chunk.id}
                      className="border-2 rounded-xl p-4"
                      style={{ borderColor: chunk.color }}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDropOnChunk(chunk.id)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          {editingChunk === chunk.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                defaultValue={chunk.name}
                                onBlur={(e) => {
                                  if (e.target.value.trim()) {
                                    handleUpdateChunkName(chunk.id, e.target.value);
                                  } else {
                                    setEditingChunk(null);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.currentTarget.blur();
                                  }
                                }}
                                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-semibold"
                                autoFocus
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 flex-wrap">
                              <Package
                                className="w-5 h-5 flex-shrink-0"
                                style={{ color: chunk.color }}
                              />
                              <h4 className="font-semibold text-gray-900">{chunk.name}</h4>
                              <span className="text-xs text-gray-500">
                                ({chunk.items.length} items)
                              </span>
                              {chunk.converted_at && chunk.converted_to_id && (
                                <a
                                  href={`/outcomes/${chunk.converted_to_id}`}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium hover:bg-green-200 transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  Converted
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingChunk(chunk.id)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleChunkExpanded(chunk.id)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                          >
                            {expandedChunks.has(chunk.id) ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleConvertChunk(chunk)}
                            className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={chunk.items.length === 0 || !!chunk.converted_at}
                            title={chunk.converted_at ? 'Already converted' : 'Convert to outcome'}
                          >
                            Convert
                          </button>
                          <button
                            onClick={() => archiveChunk(chunk.id)}
                            className="p-1.5 text-gray-400 hover:text-orange-600 rounded"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteChunk(chunk.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {expandedChunks.has(chunk.id) && (
                        <div className="space-y-2 mt-3 pt-3 border-t">
                          {chunk.items.map((item) => (
                            <div
                              key={item.id}
                              className="bg-gray-50 rounded-lg p-3 flex items-start justify-between"
                            >
                              <p className="text-sm text-gray-900 flex-1">
                                {item.inbox_item.content}
                              </p>
                              <button
                                onClick={() =>
                                  handleRemoveFromChunk(item.id, item.inbox_item_id)
                                }
                                className="text-xs text-red-600 hover:text-red-700 ml-2"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                          {chunk.items.length === 0 && (
                            <p className="text-sm text-gray-500 italic text-center py-2">
                              Drag items here to add to this chunk
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {chunks.length === 0 && (
                    <p className="text-center text-gray-500 italic py-8">
                      No chunks yet. Create one to group related items together.
                    </p>
                  )}
                </div>
              </div>

              {items.length > 0 && (
                <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-soft">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">
                    Uncategorized Items ({items.length})
                  </h3>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={() => handleDragStart(item)}
                        className="p-3 rounded-lg border-2 border-gray-200 bg-gray-50 hover:shadow-md transition-shadow cursor-move"
                      >
                        <div className="flex items-start justify-between">
                          <p className="text-sm text-gray-900 flex-1">{item.content}</p>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-gray-400 hover:text-red-600 ml-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {(outcomeIdeas.length > 0 || actionIdeas.length > 0 || chunks.length > 0) && (
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-blue-200">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                <MoveRight className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                Next Step: Convert to Outcomes
              </h3>
              <p className="text-xs sm:text-sm text-gray-700 mb-3 sm:mb-4">
                You've organized your ideas! Convert categorized items or chunks into formal RPM
                outcomes with clear results and action plans.
              </p>
              <a
                href="/outcomes"
                className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-500 text-white rounded-lg sm:rounded-xl font-semibold hover:bg-blue-600 transition-colors shadow-lg text-sm sm:text-base min-h-touch-target"
              >
                Go to Outcomes
                <MoveRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
            </div>
          )}
        </>
      )}

      {showConversionModal && selectedChunk && (
        <ConversionModal
          chunk={selectedChunk}
          areas={areas}
          goals={goals}
          onClose={() => {
            setShowConversionModal(false);
            setSelectedChunk(null);
          }}
          onSubmit={handleCreateOutcomeFromChunk}
        />
      )}

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
    </div>
  );
}

interface ConversionModalProps {
  chunk: ChunkWithItems;
  areas: Area[];
  goals: Goal[];
  onClose: () => void;
  onSubmit: (formData: {
    title: string;
    purpose: string;
    description?: string;
    area_id: string;
    goal_id?: string;
    shouldArchive: boolean;
  }) => void;
}

function ConversionModal({ chunk, areas, goals, onClose, onSubmit }: ConversionModalProps) {
  const [formData, setFormData] = useState({
    title: chunk.name,
    purpose: '',
    description: '',
    area_id: areas[0]?.id || '',
    goal_id: '',
    shouldArchive: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Create Outcome from Chunk</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900 font-medium mb-2">
            Chunk: {chunk.name} ({chunk.items.length} items)
          </p>
          <div className="space-y-1">
            {chunk.items.slice(0, 3).map((item) => (
              <p key={item.id} className="text-xs text-blue-700">
                • {item.inbox_item.content}
              </p>
            ))}
            {chunk.items.length > 3 && (
              <p className="text-xs text-blue-600 italic">
                + {chunk.items.length - 3} more items
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Outcome Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., Launch new product"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Purpose
            </label>
            <textarea
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Why is this outcome important?"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (optional)
            </label>
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
                  {goal.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="shouldArchive"
              checked={formData.shouldArchive}
              onChange={(e) => setFormData({ ...formData, shouldArchive: e.target.checked })}
              className="w-4 h-4 text-blue-600"
            />
            <label htmlFor="shouldArchive" className="text-sm text-gray-700">
              Archive chunk after conversion
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors"
              disabled={areas.length === 0}
            >
              Create Outcome
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
