import { supabase } from './supabase';
import { aiService } from './ai-service';
import type { Database, Json } from './database.types';
import { requireOrganizationId, requireUserId } from './validation';

export interface KnowledgeNote {
  id: string;
  user_id: string;
  organization_id: string;
  title: string;
  content: string;
  note_type: 'permanent' | 'fleeting' | 'literature' | 'insight' | 'pattern' | 'learning';
  source_type: 'coaching_session' | 'manual' | 'ai_generated' | 'weekly_review' | 'daily_reflection' | 'outcome_completion';
  source_id: string | null;
  metadata: {
    tags?: string[];
    potential_links?: string[];
    [key: string]: unknown;
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
  category: string | null;
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
  strength: number | null;
  created_by: 'user' | 'ai';
  created_at: string;
}

export interface WikiLink {
  text: string;
  noteTitle: string;
  exists: boolean;
  noteId?: string;
}

// Security context required for all operations
export interface KnowledgeContext {
  userId: string;
  organizationId: string;
}

class KnowledgeService {
  // Validate and normalize context
  private validateContext(ctx: Partial<KnowledgeContext>): KnowledgeContext {
    return {
      userId: requireUserId(ctx.userId),
      organizationId: requireOrganizationId(ctx.organizationId),
    };
  }

  private normalizeNote(row: Database['public']['Tables']['knowledge_notes']['Row']): KnowledgeNote {
    const metadata =
      row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
        ? (row.metadata as KnowledgeNote['metadata'])
        : {};

    return {
      ...row,
      source_id: row.source_id,
      metadata,
    };
  }

  async createNote(ctx: Partial<KnowledgeContext>, note: Partial<KnowledgeNote>): Promise<KnowledgeNote> {
    const { userId, organizationId } = this.validateContext(ctx);

    const title = note.title?.trim();
    if (!title) {
      throw new Error('Title is required');
    }

    const insert: Database['public']['Tables']['knowledge_notes']['Insert'] = {
      user_id: userId,
      organization_id: organizationId,
      title,
      content: note.content ?? '',
      note_type: note.note_type ?? 'fleeting',
      source_type: note.source_type ?? 'manual',
      source_id: note.source_id ?? null,
      metadata: (note.metadata ?? {}) as unknown as Json,
    };

    const { data, error } = await supabase
      .from('knowledge_notes')
      .insert(insert)
      .select()
      .single();

    if (error) throw error;
    return this.normalizeNote(data);
  }

  async updateNote(ctx: Partial<KnowledgeContext>, id: string, updates: Partial<KnowledgeNote>): Promise<KnowledgeNote> {
    const { userId, organizationId } = this.validateContext(ctx);

    const { metadata, ...rest } = updates;
    const updatePayload: Database['public']['Tables']['knowledge_notes']['Update'] = {
      ...rest,
      metadata: metadata ? (metadata as unknown as Json) : undefined,
    };

    const { data, error } = await supabase
      .from('knowledge_notes')
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) throw error;
    return this.normalizeNote(data);
  }

  async deleteNote(ctx: Partial<KnowledgeContext>, id: string): Promise<void> {
    const { userId, organizationId } = this.validateContext(ctx);

    const { error } = await supabase
      .from('knowledge_notes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .eq('organization_id', organizationId);

    if (error) throw error;
  }

  async getNote(ctx: Partial<KnowledgeContext>, id: string): Promise<KnowledgeNote | null> {
    const { userId, organizationId } = this.validateContext(ctx);

    const { data, error } = await supabase
      .from('knowledge_notes')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (error) throw error;
    return data ? this.normalizeNote(data) : null;
  }

  async getNotes(ctx: Partial<KnowledgeContext>, filters?: {
    noteType?: KnowledgeNote['note_type'];
    sourceType?: KnowledgeNote['source_type'];
    tags?: string[];
    searchQuery?: string;
    limit?: number;
    offset?: number;
  }): Promise<KnowledgeNote[]> {
    const { userId, organizationId } = this.validateContext(ctx);

    let query = supabase
      .from('knowledge_notes')
      .select('*')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
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
    return (data || []).map((row) => this.normalizeNote(row));
  }

  async createLink(ctx: Partial<KnowledgeContext>, link: Omit<KnowledgeLink, 'id' | 'created_at' | 'user_id'>): Promise<KnowledgeLink> {
    const { userId } = this.validateContext(ctx);

    const { data, error } = await supabase
      .from('knowledge_links')
      .insert({
        ...link,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getLinksForNote(ctx: Partial<KnowledgeContext>, noteId: string): Promise<{ outgoing: KnowledgeLink[]; incoming: KnowledgeLink[] }> {
    const { userId } = this.validateContext(ctx);

    const { data: outgoing, error: outError } = await supabase
      .from('knowledge_links')
      .select('*')
      .eq('from_note_id', noteId)
      .eq('user_id', userId);

    const { data: incoming, error: inError } = await supabase
      .from('knowledge_links')
      .select('*')
      .eq('to_note_id', noteId)
      .eq('user_id', userId);

    if (outError) throw outError;
    if (inError) throw inError;

    return {
      outgoing: outgoing || [],
      incoming: incoming || [],
    };
  }

  async deleteLink(ctx: Partial<KnowledgeContext>, id: string): Promise<void> {
    const { userId } = this.validateContext(ctx);

    const { error } = await supabase
      .from('knowledge_links')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async createTag(
    ctx: Partial<KnowledgeContext>,
    tag: { tag_name: string; category?: string | null; color?: string }
  ): Promise<KnowledgeTag> {
    const { userId, organizationId } = this.validateContext(ctx);

    const { data, error } = await supabase
      .from('knowledge_tags')
      .insert({
        ...tag,
        user_id: userId,
        organization_id: organizationId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getTags(ctx: Partial<KnowledgeContext>): Promise<KnowledgeTag[]> {
    const { userId, organizationId } = this.validateContext(ctx);

    const { data, error } = await supabase
      .from('knowledge_tags')
      .select('*')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .order('note_count', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async addTagToNote(ctx: Partial<KnowledgeContext>, noteId: string, tagId: string): Promise<void> {
    // First verify the note belongs to this user
    const note = await this.getNote(ctx, noteId);
    if (!note) {
      throw new Error('Note not found or access denied');
    }

    const { error } = await supabase
      .from('knowledge_note_tags')
      .insert({ note_id: noteId, tag_id: tagId });

    if (error) throw error;
  }

  async removeTagFromNote(ctx: Partial<KnowledgeContext>, noteId: string, tagId: string): Promise<void> {
    // First verify the note belongs to this user
    const note = await this.getNote(ctx, noteId);
    if (!note) {
      throw new Error('Note not found or access denied');
    }

    const { error } = await supabase
      .from('knowledge_note_tags')
      .delete()
      .eq('note_id', noteId)
      .eq('tag_id', tagId);

    if (error) throw error;
  }

  async getTagsForNote(ctx: Partial<KnowledgeContext>, noteId: string): Promise<KnowledgeTag[]> {
    // First verify the note belongs to this user
    const note = await this.getNote(ctx, noteId);
    if (!note) {
      throw new Error('Note not found or access denied');
    }

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

  async resolveWikiLinks(ctx: Partial<KnowledgeContext>, content: string): Promise<WikiLink[]> {
    const { userId, organizationId } = this.validateContext(ctx);
    const links = this.parseWikiLinks(content);

    for (const link of links) {
      const { data } = await supabase
        .from('knowledge_notes')
        .select('id')
        .eq('title', link.noteTitle)
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (data) {
        link.exists = true;
        link.noteId = data.id;
      }
    }

    return links;
  }

  async createNoteFromWikiLink(ctx: Partial<KnowledgeContext>, title: string): Promise<KnowledgeNote> {
    return this.createNote(ctx, {
      title,
      content: '',
      note_type: 'fleeting',
      source_type: 'manual',
      metadata: {},
    });
  }

  async semanticSearch(ctx: Partial<KnowledgeContext>, query: string, limit = 5): Promise<any[]> {
    const { organizationId } = this.validateContext(ctx);
    return await aiService.callEdgeFunction('semantic-search', {
      query,
      limit,
      organization_id: organizationId,
    });
  }

  async generateEmbedding(ctx: Partial<KnowledgeContext>, noteId: string, content: string): Promise<void> {
    const { organizationId } = this.validateContext(ctx);

    // Verify note ownership
    const note = await this.getNote(ctx, noteId);
    if (!note) {
      throw new Error('Note not found or access denied');
    }

    const result = await aiService.callEdgeFunction('generate-embedding', {
      text: content,
      organization_id: organizationId,
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
    ctx: Partial<KnowledgeContext>,
    sessionId: string,
    conversationHistory: any[],
    sessionType: string
  ): Promise<any> {
    const { organizationId } = this.validateContext(ctx);
    return await aiService.callEdgeFunction('extract-knowledge', {
      sessionId,
      conversationHistory,
      sessionType,
      organizationId,
    });
  }

  async getGraphData(ctx: Partial<KnowledgeContext>): Promise<{ nodes: any[]; edges: any[] }> {
    const { userId, organizationId } = this.validateContext(ctx);

    const { data: notes } = await supabase
      .from('knowledge_notes')
      .select('id, title, note_type, reference_count')
      .eq('user_id', userId)
      .eq('organization_id', organizationId);

    const { data: links } = await supabase
      .from('knowledge_links')
      .select('*')
      .eq('user_id', userId);

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

  async exportAsMarkdown(ctx: Partial<KnowledgeContext>): Promise<{ filename: string; content: string }[]> {
    const notes = await this.getNotes(ctx);

    return notes.map((note) => ({
      filename: `${note.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`,
      content: `# ${note.title}\n\n${note.content}\n\n---\n\nCreated: ${new Date(note.created_at).toLocaleDateString()}\nType: ${note.note_type}\nTags: ${note.metadata.tags?.join(', ') || 'none'}`,
    }));
  }
}

export const knowledgeService = new KnowledgeService();
