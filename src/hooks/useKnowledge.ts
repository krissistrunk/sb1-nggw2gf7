import { useState, useEffect } from 'react';
import { knowledgeService, type KnowledgeNote, type KnowledgeTag } from '../lib/knowledge-service';
import { useAuth } from './useAuth';
import { useOrganization } from '../contexts/OrganizationContext';

export function useKnowledge() {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const [notes, setNotes] = useState<KnowledgeNote[]>([]);
  const [tags, setTags] = useState<KnowledgeTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadNotes();
      loadTags();
    }
  }, [user]);

  const loadNotes = async (filters?: any) => {
    try {
      setLoading(true);
      setError(null);
      const data = await knowledgeService.getNotes(filters);
      setNotes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const data = await knowledgeService.getTags();
      setTags(data);
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  };

  const createNote = async (note: Partial<KnowledgeNote>) => {
    try {
      setError(null);
      const newNote = await knowledgeService.createNote({
        ...note,
        organization_id: organization?.id,
      });
      setNotes((prev) => [newNote, ...prev]);
      return newNote;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create note';
      setError(message);
      throw new Error(message);
    }
  };

  const updateNote = async (id: string, updates: Partial<KnowledgeNote>) => {
    try {
      setError(null);
      const updatedNote = await knowledgeService.updateNote(id, updates);
      setNotes((prev) => prev.map((n) => (n.id === id ? updatedNote : n)));
      return updatedNote;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update note';
      setError(message);
      throw new Error(message);
    }
  };

  const deleteNote = async (id: string) => {
    try {
      setError(null);
      await knowledgeService.deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete note';
      setError(message);
      throw new Error(message);
    }
  };

  const searchNotes = async (query: string) => {
    return loadNotes({ searchQuery: query });
  };

  const semanticSearch = async (query: string, limit = 5) => {
    try {
      setLoading(true);
      setError(null);
      const results = await knowledgeService.semanticSearch(query, limit);
      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createTag = async (tagName: string, category?: string, color?: string) => {
    try {
      const newTag = await knowledgeService.createTag({
        user_id: user!.id,
        organization_id: organization!.id,
        tag_name: tagName,
        category,
        color: color || '#6366f1',
      });
      setTags((prev) => [...prev, newTag]);
      return newTag;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create tag');
    }
  };

  const addTagToNote = async (noteId: string, tagId: string) => {
    try {
      await knowledgeService.addTagToNote(noteId, tagId);
      await loadNotes();
      await loadTags();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to add tag');
    }
  };

  const removeTagFromNote = async (noteId: string, tagId: string) => {
    try {
      await knowledgeService.removeTagFromNote(noteId, tagId);
      await loadNotes();
      await loadTags();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to remove tag');
    }
  };

  const getGraphData = async () => {
    try {
      return await knowledgeService.getGraphData();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to load graph');
    }
  };

  const extractKnowledgeFromSession = async (
    sessionId: string,
    conversationHistory: any[],
    sessionType: string
  ) => {
    try {
      const result = await knowledgeService.extractKnowledgeFromSession(
        sessionId,
        conversationHistory,
        sessionType,
        organization!.id
      );
      await loadNotes();
      return result;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to extract knowledge');
    }
  };

  return {
    notes,
    tags,
    loading,
    error,
    createNote,
    updateNote,
    deleteNote,
    searchNotes,
    semanticSearch,
    loadNotes,
    createTag,
    addTagToNote,
    removeTagFromNote,
    getGraphData,
    extractKnowledgeFromSession,
  };
}
