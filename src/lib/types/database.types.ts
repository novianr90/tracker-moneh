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
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          icon: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          icon?: string
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          icon?: string
          color?: string
          created_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          user_id: string
          category_id: string
          amount: number
          description: string
          expense_date: string
          is_upload: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id: string
          amount: number
          description?: string
          expense_date?: string
          is_upload?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string
          amount?: number
          description?: string
          expense_date?: string
          is_upload?: string
          created_at?: string
          updated_at?: string
        }
      }
      sync_logs: {
        Row: {
          id: string
          user_id: string
          started_at: string
          finished_at: string | null
          status: 'in_progress' | 'success' | 'failed'
          synced_count: number
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          started_at?: string
          finished_at?: string | null
          status: 'in_progress' | 'success' | 'failed'
          synced_count?: number
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          started_at?: string
          finished_at?: string | null
          status?: 'in_progress' | 'success' | 'failed'
          synced_count?: number
          error_message?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      recent_expenses: {
        Row: {
          id: string
          user_id: string
          amount: number
          description: string
          expense_date: string
          is_upload: string
          category_name: string
          category_color: string
          category_icon: string
        }
      }
    }
    Functions: {
      get_monthly_summary: {
        Args: {
          p_month?: string
        }
        Returns: {
          total_amount: number
          transaction_count: number
          prev_month_total: number
        }[]
      }
      get_monthly_category_breakdown: {
        Args: {
          p_month?: string
        }
        Returns: {
          category_id: string
          category_name: string
          color: string
          icon: string
          total_amount: number
        }[]
      }
      get_recent_transactions: {
        Args: {
          p_limit?: number
        }
        Returns: Database['public']['Views']['recent_expenses']['Row'][]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
