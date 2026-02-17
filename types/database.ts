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
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          company?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          company?: string | null
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
