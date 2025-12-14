import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useOrganization } from '../contexts/OrganizationContext';
import type { Chunk, ChunkItem, ChunkWithItems, InboxItem } from '../lib/database.types';

export function useChunks(includeArchived = false) {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const [chunks, setChunks] = useState<ChunkWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && organization) {
      loadChunks();
    }
  }, [user, organization, includeArchived]);

  const loadChunks = async () => {
    const userId = user?.id;
    const organizationId = organization?.id;
    if (!userId || !organizationId) return;

    try {
      setLoading(true);
      let query = supabase
        .from('chunks')
        .select('*')
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .order('updated_at', { ascending: false });

      if (!includeArchived) {
        query = query.eq('status', 'ACTIVE');
      }

      const { data: chunkRows, error: chunkError } = await query;

      if (chunkError) throw chunkError;

      const chunksList = chunkRows || [];
      if (chunksList.length === 0) {
        setChunks([]);
        return;
      }

      const chunkIds = chunksList.map((c) => c.id);

      const { data: chunkItemRows, error: chunkItemError } = await supabase
        .from('chunk_items')
        .select('*')
        .in('chunk_id', chunkIds)
        .order('sort_order', { ascending: true });

      if (chunkItemError) throw chunkItemError;

      const chunkItems = chunkItemRows || [];
      const inboxItemIds = Array.from(new Set(chunkItems.map((ci) => ci.inbox_item_id)));

      const { data: inboxRows, error: inboxError } = inboxItemIds.length
        ? await supabase.from('inbox_items').select('*').in('id', inboxItemIds)
        : { data: [] as InboxItem[], error: null };

      if (inboxError) throw inboxError;

      const inboxById = new Map<string, InboxItem>(inboxRows.map((i) => [i.id, i]));
      const itemsByChunkId = new Map<string, Array<ChunkItem & { inbox_item: InboxItem }>>();

      for (const chunkItem of chunkItems) {
        const inboxItem = inboxById.get(chunkItem.inbox_item_id);
        if (!inboxItem) continue;
        const list = itemsByChunkId.get(chunkItem.chunk_id) || [];
        list.push({ ...chunkItem, inbox_item: inboxItem });
        itemsByChunkId.set(chunkItem.chunk_id, list);
      }

      const chunksWithItems: ChunkWithItems[] = chunksList.map((chunk) => ({
        ...chunk,
        items: (itemsByChunkId.get(chunk.id) || []).sort((a, b) => a.sort_order - b.sort_order),
      }));

      setChunks(chunksWithItems);
    } catch (error) {
      console.error('Error loading chunks:', error);
    } finally {
      setLoading(false);
    }
  };

  const createChunk = async (name: string, color?: string) => {
    const userId = user?.id;
    const organizationId = organization?.id;
    if (!userId || !organizationId) throw new Error('Not authenticated');

    try {
      const { data, error } = await supabase
        .from('chunks')
        .insert({
          user_id: userId,
          organization_id: organizationId,
          name,
          color: color || '#6366F1',
          status: 'ACTIVE',
        })
        .select()
        .single();

      if (error) throw error;

      await loadChunks();
      return data;
    } catch (error) {
      console.error('Error creating chunk:', error);
      throw error;
    }
  };

  const updateChunk = async (chunkId: string, updates: Partial<Chunk>) => {
    try {
      const { error } = await supabase
        .from('chunks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', chunkId);

      if (error) throw error;

      await loadChunks();
    } catch (error) {
      console.error('Error updating chunk:', error);
      throw error;
    }
  };

  const deleteChunk = async (chunkId: string) => {
    try {
      const { error } = await supabase.from('chunks').delete().eq('id', chunkId);

      if (error) throw error;

      await loadChunks();
    } catch (error) {
      console.error('Error deleting chunk:', error);
      throw error;
    }
  };

  const archiveChunk = async (chunkId: string) => {
    await updateChunk(chunkId, { status: 'ARCHIVED' });
  };

  const addItemToChunk = async (chunkId: string, inboxItemId: string) => {
    try {
      const chunk = chunks.find((c) => c.id === chunkId);
      const maxSortOrder = chunk?.items.reduce(
        (max, item) => Math.max(max, item.sort_order),
        -1
      ) ?? -1;

      const { error: chunkItemError } = await supabase.from('chunk_items').insert({
        chunk_id: chunkId,
        inbox_item_id: inboxItemId,
        sort_order: maxSortOrder + 1,
      });

      if (chunkItemError) throw chunkItemError;

      const { error: inboxError } = await supabase
        .from('inbox_items')
        .update({ chunk_id: chunkId })
        .eq('id', inboxItemId);

      if (inboxError) throw inboxError;

      await loadChunks();
    } catch (error) {
      console.error('Error adding item to chunk:', error);
      throw error;
    }
  };

  const removeItemFromChunk = async (chunkItemId: string, inboxItemId: string) => {
    try {
      const { error: chunkItemError } = await supabase
        .from('chunk_items')
        .delete()
        .eq('id', chunkItemId);

      if (chunkItemError) throw chunkItemError;

      const { error: inboxError } = await supabase
        .from('inbox_items')
        .update({ chunk_id: null })
        .eq('id', inboxItemId);

      if (inboxError) throw inboxError;

      await loadChunks();
    } catch (error) {
      console.error('Error removing item from chunk:', error);
      throw error;
    }
  };

  const reorderItemsInChunk = async (itemIds: string[]) => {
    try {
      const updates = itemIds.map((itemId, index) => ({
        id: itemId,
        sort_order: index,
      }));

      for (const update of updates) {
        await supabase
          .from('chunk_items')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
      }

      await loadChunks();
    } catch (error) {
      console.error('Error reordering items:', error);
      throw error;
    }
  };

  const convertChunkToOutcome = async (
    chunkId: string,
    outcomeId: string,
    shouldArchive: boolean
  ) => {
    try {
      await supabase
        .from('chunks')
        .update({
          status: shouldArchive ? 'ARCHIVED' : 'ACTIVE',
          converted_to_type: 'OUTCOME',
          converted_to_id: outcomeId,
          converted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', chunkId);

      await supabase
        .from('outcomes')
        .update({ source_chunk_id: chunkId })
        .eq('id', outcomeId);

      const chunk = chunks.find((c) => c.id === chunkId);
      if (chunk) {
        for (const item of chunk.items) {
          await supabase
            .from('inbox_items')
            .update({ triaged: true, triaged_to_id: outcomeId })
            .eq('id', item.inbox_item_id);
        }
      }

      await loadChunks();
    } catch (error) {
      console.error('Error converting chunk to outcome:', error);
      throw error;
    }
  };

  return {
    chunks,
    loading,
    createChunk,
    updateChunk,
    deleteChunk,
    archiveChunk,
    addItemToChunk,
    removeItemFromChunk,
    reorderItemsInChunk,
    convertChunkToOutcome,
    refresh: loadChunks,
  };
}
