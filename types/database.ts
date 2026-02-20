export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          company: string | null
          credits: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          company?: string | null
          credits?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          company?: string | null
          credits?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          plan_type: 'free' | 'pro' | 'enterprise'
          status: 'active' | 'canceled' | 'past_due' | 'incomplete'
          templates_downloaded_this_month: number
          current_period_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          plan_type?: 'free' | 'pro' | 'enterprise'
          status?: 'active' | 'canceled' | 'past_due' | 'incomplete'
          templates_downloaded_this_month?: number
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          plan_type?: 'free' | 'pro' | 'enterprise'
          status?: 'active' | 'canceled' | 'past_due' | 'incomplete'
          templates_downloaded_this_month?: number
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      templates: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          canvas_state: Json
          sample_data: Json | null
          settings: Json | null
          is_public: boolean
          is_shared: boolean
          version: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          canvas_state: Json
          sample_data?: Json | null
          settings?: Json | null
          is_public?: boolean
          is_shared?: boolean
          version?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          canvas_state?: Json
          sample_data?: Json | null
          settings?: Json | null
          is_public?: boolean
          is_shared?: boolean
          version?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      template_assets: {
        Row: {
          id: string
          template_id: string
          file_path: string
          file_name: string
          file_size: number | null
          mime_type: string | null
          created_at: string
        }
        Insert: {
          id?: string
          template_id: string
          file_path: string
          file_name: string
          file_size?: number | null
          mime_type?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          template_id?: string
          file_path?: string
          file_name?: string
          file_size?: number | null
          mime_type?: string | null
          created_at?: string
        }
        Relationships: []
      }
      template_versions: {
        Row: {
          id: string
          template_id: string
          version_number: number
          canvas_state: Json
          sample_data: Json | null
          settings: Json | null
          change_description: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          template_id: string
          version_number: number
          canvas_state: Json
          sample_data?: Json | null
          settings?: Json | null
          change_description?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          template_id?: string
          version_number?: number
          canvas_state?: Json
          sample_data?: Json | null
          settings?: Json | null
          change_description?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          { foreignKeyName: 'template_versions_template_id_fkey'; columns: ['template_id']; referencedRelation: 'templates'; referencedColumns: ['id'] }
        ]
      }
      template_shares: {
        Row: {
          id: string
          template_id: string
          share_type: 'link' | 'user' | 'org'
          share_token: string | null
          shared_with_email: string | null
          organization_id: string | null
          permission: 'view' | 'edit'
          password_hash: string | null
          expires_at: string | null
          created_by: string
          created_at: string
          last_accessed_at: string | null
        }
        Insert: {
          id?: string
          template_id: string
          share_type: 'link' | 'user' | 'org'
          share_token?: string | null
          shared_with_email?: string | null
          organization_id?: string | null
          permission?: 'view' | 'edit'
          password_hash?: string | null
          expires_at?: string | null
          created_by: string
          created_at?: string
          last_accessed_at?: string | null
        }
        Update: {
          id?: string
          template_id?: string
          share_type?: 'link' | 'user' | 'org'
          share_token?: string | null
          shared_with_email?: string | null
          organization_id?: string | null
          permission?: 'view' | 'edit'
          password_hash?: string | null
          expires_at?: string | null
          created_by?: string
          created_at?: string
          last_accessed_at?: string | null
        }
        Relationships: [
          { foreignKeyName: 'template_shares_template_id_fkey'; columns: ['template_id']; referencedRelation: 'templates'; referencedColumns: ['id'] },
          { foreignKeyName: 'template_shares_created_by_fkey'; columns: ['created_by']; referencedRelation: 'profiles'; referencedColumns: ['id'] }
        ]
      }
      custom_components: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          category: string
          component_type: string
          config: Json
          thumbnail_url: string | null
          is_public: boolean
          usage_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          category?: string
          component_type: string
          config: Json
          thumbnail_url?: string | null
          is_public?: boolean
          usage_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          category?: string
          component_type?: string
          config?: Json
          thumbnail_url?: string | null
          is_public?: boolean
          usage_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: 'custom_components_user_id_fkey'; columns: ['user_id']; referencedRelation: 'profiles'; referencedColumns: ['id'] }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      plan_type: 'free' | 'pro' | 'enterprise'
      subscription_status: 'active' | 'canceled' | 'past_due' | 'incomplete'
    }
  }
}
