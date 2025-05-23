
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
      allocations: {
        Row: {
          id: string
          user_id: string
          project_id: string
          week_id: string
          week: string
          days: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id: string
          week_id: string
          week: string
          days: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string
          week_id?: string
          week?: string
          days?: number
          created_at?: string
          updated_at?: string
        }
      }
      professions: {
        Row: {
          id: string
          title: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          created_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          color: string
          lead_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          color: string
          lead_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          color?: string
          lead_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_professions: {
        Row: {
          id: string
          user_id: string
          profession_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          profession_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          profession_id?: string
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          name: string
          role: string
          email: string
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          role: string
          email: string
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          role?: string
          email?: string
          image_url?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
