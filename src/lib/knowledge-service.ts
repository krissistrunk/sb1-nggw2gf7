import { supabase } from './supabase';
import { aiService } from './ai-service';

export interface KnowledgeNote {
  id: string;
  user_id: string;
  organization_id: string;
  title: string;
  content: string;
  note_type: 'permanent' | 'fleeting' | 'literature' | 'insight' | 'pattern' | 'learning';
  source_type: 'coaching_session' | 'manual' | 'ai_generated' | 'weekly_review' | 'daily_reflection' | 'outcome_completion';
  source_id?: string;
  metadata: {
    tags?: string[];
    potential_links?: string[];
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
  last_referenced_at: string;
  reference_count: number;
}

export interface KnowledgeTag {
  id: string;
  user_id: string;
  organization_id: string;
  tag_name: string;
  category?: string;
  color: string;
  note_count: number;
  created_at: string;
}

export interface KnowledgeLink {
  id: string;
  user_id: string;
  from_note_id: string;
  to_note_id: string;
  link_type: 'relates_to' | 'contradicts' | 'supports' | 'example_of' | 'caused_by' | 'leads_to';
  strength: number;
  created_by: 'user' | 'ai';
  created_at: string;
}

export interface WikiLink {
  text: string;
  noteTitle: string;
  exists: boolean;
  noteId?: string;
}

class KnowledgeService {
  async createNote(note: Partial<KnowledgeNote>): Promise<KnowledgeNote> {
    const { data, error } = await supabase
      .from('knowledge_notes')
      .insert(note)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateNote(id: string, updates: Partial<KnowledgeNote>): Promise<KnowledgeNote> {
    const { data, error } = await supabase
      .from('knowledge_notes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteNote(id: string): Promise<void> {
    const { error } = await supabase
      .from('knowledge_notes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getNote(id: string): Promise<KnowledgeNote | null> {
    const { data, error } = await supabase
      .from('knowledge_notes')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async getNotes(filters?: {
    noteType?: string;
    sourceType?: string;
    tags?: string[];
    searchQuery?: string;
    limit?: number;
    offset?: number;
  }): Promise<KnowledgeNote[]> {
    let query = supabase
      .from('knowledge_notes')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.noteType) {
      query = query.eq('note_type', filters.noteType);
    }

    if (filters?.sourceType) {
      query = query.eq('source_type', filters.sourceType);
    }

    if (filters?.searchQuery) {
      query = query.or(`title.ilike.%${filters.searchQuery}%,content.ilike.%${filters.searchQuery}%`);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  async createLink(link: Omit<KnowledgeLink, 'id' | 'created_at'>): Promise<KnowledgeLink> {
    const { data, error } = await supabase
      .from('knowledge_links')
      .insert(link)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getLinksForNote(noteId: string): Promise<{ outgoing: KnowledgeLink[]; incoming: KnowledgeLink[] }> {
    const { data: outgoing, error: outError } = await supabase
      .from('knowledge_links')
      .select('*')
      .eq('from_note_id', noteId);

    const { data: incoming, error: inError } = await supabase
      .from('knowledge_links')
      .select('*')
      .eq('to_note_id', noteId);

    if (outError) throw outError;
    if (inError) throw inError;

    return {
      outgoing: outgoing || [],
      incoming: incoming || [],
    };
  }

  async deleteLink(id: string): Promise<void> {
    const { error } = await supabase
      .from('knowledge_links')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async createTag(tag: Omit<KnowledgeTag, 'id' | 'note_count' | 'created_at'>): Promise<KnowledgeTag> {
    const { data, error } = await supabase
      .from('knowledge_tags')
      .insert(tag)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getTags(): Promise<KnowledgeTag[]> {
    const { data, error } = await supabase
      .from('knowledge_tags')
      .select('*')
      .order('note_count', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async addTagToNote(noteId: string, tagId: string): Promise<void> {
    const { error } = await supabase
      .from('knowledge_note_tags')
      .insert({ note_id: noteId, tag_id: tagId });

    if (error) throw error;
  }

  async removeTagFromNote(noteId: string, tagId: string): Promise<void> {
    const { error } = await supabase
      .from('knowledge_note_tags')
      .delete()
      .eq('note_id', noteId)
      .eq('tag_id', tagId);

    if (error) throw error;
  }

  async getTagsForNote(noteId: string): Promise<KnowledgeTag[]> {
    const { data, error } = await supabase
      .from('knowledge_note_tags')
      .select('tag_id, knowledge_tags(*)')
      .eq('note_id', noteId);

    if (error) throw error;
    return data?.map((item: any) => item.knowledge_tags) || [];
  }

  parseWikiLinks(content: string): WikiLink[] {
    const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
    const links: WikiLink[] = [];
    let match;

    while ((match = wikiLinkRegex.exec(content)) !== null) {
      links.push({
        text: match[0],
        noteTitle: match[1],
        exists: false,
      });
    }

    return links;
  }

  async resolveWikiLinks(content: string): Promise<WikiLink[]> {
    const links = this.parseWikiLinks(content);

    for (const link of links) {
      const { data } = await supabase
        .from('knowledge_notes')
        .select('id')
        .eq('title', link.noteTitle)
        .maybeSingle();

      if (data) {
        link.exists = true;
        link.noteId = data.id;
      }
    }

    return links;
  }

  async createNoteFromWikiLink(title: string, organizationId: string): Promise<KnowledgeNote> {
    return this.createNote({
      title,
      content: '',
      note_type: 'fleeting',
      source_type: 'manual',
      organization_id: organizationId,
      metadata: {},
    });
  }

  async semanticSearch(query: string, limit = 5): Promise<any[]> {
    return await aiService.callEdgeFunction('semantic-search', {
      query,
      limit,
    });
  }

  async generateEmbedding(noteId: string, content: string): Promise<void> {
    const result = await aiService.callEdgeFunction('generate-embedding', {
      text: content,
    });

    await supabase
      .from('knowledge_embeddings')
      .upsert({
        note_id: noteId,
        embedding: result.embedding,
        embedding_model: 'text-embedding-3-small',
      });
  }

  async extractKnowledgeFromSession(
    sessionId: string,
    conversationHistory: any[],
    sessionType: string,
    organizationId: string
  ): Promise<any> {
    return await aiService.callEdgeFunction('extract-knowledge', {
      sessionId,
      conversationHistory,
      sessionType,
      organizationId,
    });
  }

  async getGraphData(): Promise<{ nodes: any[]; edges: any[] }> {
    const { data: notes } = await supabase
      .from('knowledge_notes')
      .select('id, title, note_type, reference_count');

    const { data: links } = await supabase
      .from('knowledge_links')
      .select('*');

    const nodes = (notes || []).map((note: any) => ({
      id: note.id,
      label: note.title,
      type: note.note_type,
      size: Math.max(10, note.reference_count * 2),
    }));

    const edges = (links || []).map((link: any) => ({
      id: link.id,
      source: link.from_note_id,
      target: link.to_note_id,
      type: link.link_type,
      strength: link.strength,
    }));

    return { nodes, edges };
  }

  async exportAsMarkdown(): Promise<{ filename: string; content: string }[]> {
    const notes = await this.getNotes();

    return notes.map((note) => ({
      filename: `${note.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`,
      content: `# ${note.title}\n\n${note.content}\n\n---\n\nCreated: ${new Date(note.created_at).toLocaleDateString()}\nType: ${note.note_type}\nTags: ${note.metadata.tags?.join(', ') || 'none'}`,
    }));
  }
}

export const knowledgeService = new KnowledgeService();
