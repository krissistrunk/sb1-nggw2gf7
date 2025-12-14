import { supabase } from './supabase';

export interface AIActionSuggestion {
  title: string;
  notes?: string;
  priority: 1 | 2 | 3;
  duration_minutes: number;
  reasoning: string;
}

export interface AIPurposeRefinement {
  refined: string;
  alternatives: Array<{
    tone: string;
    text: string;
    rationale: string;
  }>;
  feedback: string;
}

export interface AIDailyPlanRecommendation {
  outcome_id: string;
  outcome_title: string;
  priority: number;
  reasoning: string;
  suggested_actions: string[];
}

export interface AIDailyPlan {
  recommendations: AIDailyPlanRecommendation[];
  overall_strategy: string;
}

export interface AIInsightPattern {
  type: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface AIRecommendation {
  priority: 'high' | 'medium' | 'low';
  action: string;
  rationale: string;
}

export interface AIInsights {
  summary: string;
  patterns: AIInsightPattern[];
  achievements: string[];
  challenges: string[];
  recommendations: AIRecommendation[];
  metrics: {
    completion_rate: number;
    focus_areas: string[];
    avg_task_duration: string;
  };
}

export interface AIVoiceAnalysis {
  transcript: string;
  items: Array<{
    type: 'ACTION' | 'OUTCOME' | 'NOTE';
    content: string;
    priority: 1 | 2 | 3;
  }>;
  themes: string[];
  suggested_area: string;
  summary: string;
  ai_response?: string;
}

export interface AIChunkSuggestion {
  name: string;
  description: string;
  item_indices: number[];
  should_convert: boolean;
  reasoning: string;
  suggested_outcome_title?: string;
  suggested_purpose?: string;
}

export interface AIChunkSuggestions {
  suggested_chunks: AIChunkSuggestion[];
  ungrouped_items: number[];
  overall_advice: string;
}

class AIService {
  async callEdgeFunction(feature: string, data: Record<string, any>) {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Not authenticated');
    }

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ feature, data }),
    });

    if (!response.ok) {
      let errorMessage = 'AI request failed';
      try {
        const error = await response.json();
        errorMessage = error.error || errorMessage;
      } catch {
        // Response wasn't JSON, try to get text
        try {
          const text = await response.text();
          errorMessage = text || `HTTP ${response.status}: ${response.statusText}`;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
      }
      throw new Error(errorMessage);
    }

    let result;
    try {
      result = await response.json();
    } catch {
      throw new Error('Invalid JSON response from AI service');
    }
    
    return result.data;
  }

  async suggestActions(
    outcome: { title: string; purpose: string; description?: string },
    existingActions: Array<{ title: string }> = []
  ): Promise<{ actions: AIActionSuggestion[] }> {
    return await this.callEdgeFunction('suggest-actions', {
      outcome,
      existingActions,
    });
  }

  async refinePurpose(
    title: string,
    purpose: string,
    context?: string
  ): Promise<AIPurposeRefinement> {
    return await this.callEdgeFunction('refine-purpose', {
      title,
      purpose,
      context,
    });
  }

  async generateDailyPlan(
    outcomes: any[],
    actions: any[],
    completionHistory?: { rate: number },
    date?: string
  ): Promise<AIDailyPlan> {
    return await this.callEdgeFunction('daily-plan', {
      outcomes,
      actions,
      completionHistory,
      date: date || new Date().toISOString().split('T')[0],
    });
  }

  async generateInsights(
    period: { type: string; start: string; end: string },
    completedActions: any[],
    outcomes: any[],
    timeBlocks?: any[]
  ): Promise<AIInsights> {
    return await this.callEdgeFunction('generate-insights', {
      period,
      completedActions,
      outcomes,
      timeBlocks,
    });
  }

  async transcribeVoice(
    audioData: string,
    sessionType: 'PLANNING' | 'COACHING' | 'REFLECTION'
  ): Promise<AIVoiceAnalysis> {
    return await this.callEdgeFunction('transcribe-voice', {
      audioData,
      sessionType,
    });
  }

  async suggestChunks(inboxItems: any[]): Promise<AIChunkSuggestions> {
    return await this.callEdgeFunction('suggest-chunks', {
      inboxItems,
    });
  }

  async coachingResponse(
    sessionType: 'PLANNING' | 'REFLECTION' | 'COACHING' | 'MOTIVATION' | 'CLARIFICATION',
    userMessage: string,
    conversationHistory?: Array<{ role: string; content: string }>,
    contextData?: any
  ): Promise<{ response: string; suggestions?: string[]; relevantKnowledge?: any[] }> {
    return await this.callEdgeFunction('coaching-response', {
      sessionType,
      userMessage,
      conversationHistory: conversationHistory || [],
      contextData,
    });
  }

  async retrieveRelevantKnowledge(query: string, limit = 5): Promise<any[]> {
    return await this.callEdgeFunction('semantic-search', {
      query,
      limit,
    });
  }

  async saveVoiceSession(
    sessionType: string,
    contextType: string | null,
    contextId: string | null,
    audioUrl: string | null,
    transcript: string,
    durationSeconds: number,
    aiInsights: any,
    aiResponse: string | null
  ): Promise<any> {
    return await this.callEdgeFunction('save-voice-session', {
      sessionType,
      contextType,
      contextId,
      audioUrl,
      transcript,
      durationSeconds,
      aiInsights,
      aiResponse,
    });
  }
}

export const aiService = new AIService();
