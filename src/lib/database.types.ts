export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          subdomain: string
          custom_domain: string | null
          logo_url: string | null
          favicon_url: string | null
          primary_color: string
          subscription_tier: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'
          feature_flags: Json
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          subdomain: string
          custom_domain?: string | null
          logo_url?: string | null
          favicon_url?: string | null
          primary_color?: string
          subscription_tier?: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'
          feature_flags?: Json
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          subdomain?: string
          custom_domain?: string | null
          logo_url?: string | null
          favicon_url?: string | null
          primary_color?: string
          subscription_tier?: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'
          feature_flags?: Json
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      organization_members: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          role: 'ADMIN' | 'MANAGER' | 'MEMBER'
          invited_at: string
          joined_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          role?: 'ADMIN' | 'MANAGER' | 'MEMBER'
          invited_at?: string
          joined_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          role?: 'ADMIN' | 'MANAGER' | 'MEMBER'
          invited_at?: string
          joined_at?: string | null
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          organization_id: string | null
          settings: Json
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          organization_id?: string | null
          settings?: Json
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          organization_id?: string | null
          settings?: Json
          created_at?: string
        }
      }
      life_plans: {
        Row: {
          id: string
          user_id: string
          organization_id: string
          vision: string
          purpose: string | null
          values: Json
          roles: Json
          three_to_thrive: Json
          resources: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id: string
          vision: string
          purpose?: string | null
          values?: Json
          roles?: Json
          three_to_thrive?: Json
          resources?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string
          vision?: string
          purpose?: string | null
          values?: Json
          roles?: Json
          three_to_thrive?: Json
          resources?: Json
          created_at?: string
          updated_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
          organization_id: string
          title: string
          description: string | null
          goal_type: 'YEARLY' | 'QUARTERLY'
          area_id: string | null
          year: number
          quarter: number | null
          parent_goal_id: string | null
          status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
          target_date: string | null
          progress_percentage: number
          is_draft: boolean
          created_at: string
          updated_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          organization_id: string
          title: string
          description?: string | null
          goal_type: 'YEARLY' | 'QUARTERLY'
          area_id?: string | null
          year: number
          quarter?: number | null
          parent_goal_id?: string | null
          status?: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
          target_date?: string | null
          progress_percentage?: number
          is_draft?: boolean
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string
          title?: string
          description?: string | null
          goal_type?: 'YEARLY' | 'QUARTERLY'
          area_id?: string | null
          year?: number
          quarter?: number | null
          parent_goal_id?: string | null
          status?: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
          target_date?: string | null
          progress_percentage?: number
          is_draft?: boolean
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
      }
      areas: {
        Row: {
          id: string
          name: string
          description: string | null
          purpose_statement: string | null
          success_metric: string | null
          quarterly_focus: boolean
          color: string
          icon: string
          user_id: string
          organization_id: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          purpose_statement?: string | null
          success_metric?: string | null
          quarterly_focus?: boolean
          color?: string
          icon?: string
          user_id: string
          organization_id?: string | null
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          purpose_statement?: string | null
          success_metric?: string | null
          quarterly_focus?: boolean
          color?: string
          icon?: string
          user_id?: string
          organization_id?: string | null
          sort_order?: number
          created_at?: string
        }
      }
      outcomes: {
        Row: {
          id: string
          title: string
          description: string | null
          purpose: string
          power_statement: string | null
          metric: string | null
          target_date: string | null
          status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
          area_id: string | null
          goal_id: string | null
          user_id: string
          organization_id: string | null
          is_draft: boolean
          created_at: string
          updated_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          purpose: string
          power_statement?: string | null
          metric?: string | null
          target_date?: string | null
          status?: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
          area_id?: string | null
          goal_id?: string | null
          user_id: string
          organization_id?: string | null
          is_draft?: boolean
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          purpose?: string
          power_statement?: string | null
          metric?: string | null
          target_date?: string | null
          status?: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
          area_id?: string | null
          goal_id?: string | null
          user_id?: string
          organization_id?: string | null
          is_draft?: boolean
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
      }
      actions: {
        Row: {
          id: string
          outcome_id: string
          user_id: string | null
          title: string
          notes: string | null
          done: boolean
          priority: 1 | 2 | 3
          scheduled_date: string | null
          scheduled_time: string | null
          duration_minutes: number
          is_must: boolean
          delegated_to: string | null
          delegated_date: string | null
          sort_order: number
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          outcome_id: string
          user_id?: string | null
          title: string
          notes?: string | null
          done?: boolean
          priority?: 1 | 2 | 3
          scheduled_date?: string | null
          scheduled_time?: string | null
          duration_minutes?: number
          is_must?: boolean
          delegated_to?: string | null
          delegated_date?: string | null
          sort_order?: number
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          outcome_id?: string
          user_id?: string | null
          title?: string
          notes?: string | null
          done?: boolean
          priority?: 1 | 2 | 3
          scheduled_date?: string | null
          scheduled_time?: string | null
          duration_minutes?: number
          is_must?: boolean
          delegated_to?: string | null
          delegated_date?: string | null
          sort_order?: number
          created_at?: string
          completed_at?: string | null
        }
      }
      inbox_items: {
        Row: {
          id: string
          user_id: string
          organization_id: string
          content: string
          item_type: 'NOTE' | 'ACTION_IDEA' | 'OUTCOME_IDEA'
          triaged: boolean
          triaged_to_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id: string
          content: string
          item_type?: 'NOTE' | 'ACTION_IDEA' | 'OUTCOME_IDEA'
          triaged?: boolean
          triaged_to_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string
          content?: string
          item_type?: 'NOTE' | 'ACTION_IDEA' | 'OUTCOME_IDEA'
          triaged?: boolean
          triaged_to_id?: string | null
          created_at?: string
        }
      }
      review_sessions: {
        Row: {
          id: string
          user_id: string
          organization_id: string
          ritual_type: 'MORNING' | 'EVENING' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY'
          date: string
          responses: Json
          insights: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id: string
          ritual_type: 'MORNING' | 'EVENING' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY'
          date: string
          responses?: Json
          insights?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string
          ritual_type?: 'MORNING' | 'EVENING' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY'
          date?: string
          responses?: Json
          insights?: string | null
          created_at?: string
        }
      }
      weekly_plans: {
        Row: {
          id: string
          user_id: string
          organization_id: string | null
          week_start_date: string
          focus_outcomes: Json
          reflection: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id?: string | null
          week_start_date: string
          focus_outcomes?: Json
          reflection?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string | null
          week_start_date?: string
          focus_outcomes?: Json
          reflection?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      daily_notes: {
        Row: {
          id: string
          user_id: string
          organization_id: string | null
          date: string
          morning_intention: string | null
          evening_reflection: string | null
          energy_level: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id?: string | null
          date: string
          morning_intention?: string | null
          evening_reflection?: string | null
          energy_level?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string | null
          date?: string
          morning_intention?: string | null
          evening_reflection?: string | null
          energy_level?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      voice_sessions: {
        Row: {
          id: string
          user_id: string
          organization_id: string | null
          session_type: 'PLANNING' | 'COACHING' | 'REFLECTION'
          transcript: string | null
          ai_insights: Json
          duration_seconds: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id?: string | null
          session_type?: 'PLANNING' | 'COACHING' | 'REFLECTION'
          transcript?: string | null
          ai_insights?: Json
          duration_seconds?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string | null
          session_type?: 'PLANNING' | 'COACHING' | 'REFLECTION'
          transcript?: string | null
          ai_insights?: Json
          duration_seconds?: number
          created_at?: string
        }
      }
      outcome_templates: {
        Row: {
          id: string
          name: string
          description: string
          category: string
          outcome_title: string
          purpose: string
          actions: Json
          estimated_duration_days: number | null
          is_public: boolean
          created_by: string | null
          usage_count: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          category: string
          outcome_title: string
          purpose: string
          actions?: Json
          estimated_duration_days?: number | null
          is_public?: boolean
          created_by?: string | null
          usage_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          category?: string
          outcome_title?: string
          purpose?: string
          actions?: Json
          estimated_duration_days?: number | null
          is_public?: boolean
          created_by?: string | null
          usage_count?: number
          created_at?: string
        }
      }
      time_blocks: {
        Row: {
          id: string
          user_id: string
          organization_id: string
          outcome_id: string | null
          action_id: string | null
          title: string
          scheduled_start: string
          scheduled_end: string
          actual_start: string | null
          actual_end: string | null
          duration_minutes: number
          actual_minutes: number | null
          mode: 'SOFT' | 'STRICT'
          completed: boolean
          notes: string | null
          distractions: Json
          energy_before: number | null
          energy_after: number | null
          counted_as_must: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id: string
          outcome_id?: string | null
          action_id?: string | null
          title: string
          scheduled_start: string
          scheduled_end: string
          actual_start?: string | null
          actual_end?: string | null
          duration_minutes: number
          actual_minutes?: number | null
          mode?: 'SOFT' | 'STRICT'
          completed?: boolean
          notes?: string | null
          distractions?: Json
          energy_before?: number | null
          energy_after?: number | null
          counted_as_must?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string
          outcome_id?: string | null
          action_id?: string | null
          title?: string
          scheduled_start?: string
          scheduled_end?: string
          actual_start?: string | null
          actual_end?: string | null
          duration_minutes?: number
          actual_minutes?: number | null
          mode?: 'SOFT' | 'STRICT'
          completed?: boolean
          notes?: string | null
          distractions?: Json
          energy_before?: number | null
          energy_after?: number | null
          counted_as_must?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      chunks: {
        Row: {
          id: string
          user_id: string
          organization_id: string
          name: string
          description: string | null
          color: string
          status: 'ACTIVE' | 'ARCHIVED'
          converted_to_type: 'OUTCOME' | 'GOAL' | null
          converted_to_id: string | null
          created_at: string
          updated_at: string
          converted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          organization_id: string
          name: string
          description?: string | null
          color?: string
          status?: 'ACTIVE' | 'ARCHIVED'
          converted_to_type?: 'OUTCOME' | 'GOAL' | null
          converted_to_id?: string | null
          created_at?: string
          updated_at?: string
          converted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string
          name?: string
          description?: string | null
          color?: string
          status?: 'ACTIVE' | 'ARCHIVED'
          converted_to_type?: 'OUTCOME' | 'GOAL' | null
          converted_to_id?: string | null
          created_at?: string
          updated_at?: string
          converted_at?: string | null
        }
      }
      chunk_items: {
        Row: {
          id: string
          chunk_id: string
          inbox_item_id: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          chunk_id: string
          inbox_item_id: string
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          chunk_id?: string
          inbox_item_id?: string
          sort_order?: number
          created_at?: string
        }
      }
    }
  }
}

export type Organization = Database['public']['Tables']['organizations']['Row']
export type OrganizationMember = Database['public']['Tables']['organization_members']['Row']
export type LifePlan = Database['public']['Tables']['life_plans']['Row']
export type Goal = Database['public']['Tables']['goals']['Row']
export type InboxItem = Database['public']['Tables']['inbox_items']['Row']
export type ReviewSession = Database['public']['Tables']['review_sessions']['Row']
export type Area = Database['public']['Tables']['areas']['Row']
export type Outcome = Database['public']['Tables']['outcomes']['Row']
export type Action = Database['public']['Tables']['actions']['Row']
export type WeeklyPlan = Database['public']['Tables']['weekly_plans']['Row']
export type DailyNote = Database['public']['Tables']['daily_notes']['Row']
export type VoiceSession = Database['public']['Tables']['voice_sessions']['Row']
export type OutcomeTemplate = Database['public']['Tables']['outcome_templates']['Row']
export type TimeBlock = Database['public']['Tables']['time_blocks']['Row']
export type Chunk = Database['public']['Tables']['chunks']['Row']
export type ChunkItem = Database['public']['Tables']['chunk_items']['Row']

export type OutcomeWithRelations = Outcome & {
  area: Area | null
  goal: Goal | null
  actions: Action[]
}

export type GoalWithRelations = Goal & {
  area: Area | null
  parent_goal: Goal | null
  outcomes: Outcome[]
}

export type OrganizationInsert = Database['public']['Tables']['organizations']['Insert']
export type LifePlanInsert = Database['public']['Tables']['life_plans']['Insert']
export type GoalInsert = Database['public']['Tables']['goals']['Insert']
export type OutcomeInsert = Database['public']['Tables']['outcomes']['Insert']
export type ActionInsert = Database['public']['Tables']['actions']['Insert']
export type AreaInsert = Database['public']['Tables']['areas']['Insert']
export type InboxItemInsert = Database['public']['Tables']['inbox_items']['Insert']
export type ReviewSessionInsert = Database['public']['Tables']['review_sessions']['Insert']
export type OutcomeTemplateInsert = Database['public']['Tables']['outcome_templates']['Insert']
export type TimeBlockInsert = Database['public']['Tables']['time_blocks']['Insert']
export type ChunkInsert = Database['public']['Tables']['chunks']['Insert']
export type ChunkItemInsert = Database['public']['Tables']['chunk_items']['Insert']

export type ChunkWithItems = Chunk & {
  items: (ChunkItem & { inbox_item: InboxItem })[]
}

export interface AISuggestion {
  id: string;
  user_id: string;
  organization_id: string;
  suggestion_type: 'ACTION' | 'PURPOSE' | 'CHUNK' | 'DAILY_PLAN' | 'INSIGHT';
  entity_type?: 'OUTCOME' | 'ACTION' | 'CHUNK' | 'INBOX_ITEM' | 'LIFE_PLAN';
  entity_id?: string;
  content: Record<string, any>;
  reasoning?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  accepted_at?: string;
  created_at: string;
}

export interface AIInsight {
  id: string;
  user_id: string;
  organization_id: string;
  insight_type: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'PATTERN' | 'ALERT';
  period_start: string;
  period_end: string;
  insights: Record<string, any>;
  patterns?: Record<string, any>;
  recommendations?: Record<string, any>;
  metrics?: Record<string, any>;
  created_at: string;
}

export interface AIInteractionLog {
  id: string;
  user_id?: string;
  organization_id?: string;
  feature_type: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  model?: string;
  response_time_ms?: number;
  success: boolean;
  error_message?: string;
  created_at: string;
}
