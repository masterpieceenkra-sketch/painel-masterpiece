export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      checklist_items: {
        Row: {
          created_at: string
          id: string
          label: string
          order_index: number
          playbook_id: string
          section: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          order_index?: number
          playbook_id: string
          section?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          order_index?: number
          playbook_id?: string
          section?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_playbook_id_fkey"
            columns: ["playbook_id"]
            isOneToOne: false
            referencedRelation: "playbooks"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_progress: {
        Row: {
          checked_at: string
          item_id: string
          user_id: string
        }
        Insert: {
          checked_at?: string
          item_id: string
          user_id: string
        }
        Update: {
          checked_at?: string
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_progress_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "checklist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      playbook_views: {
        Row: {
          id: string
          playbook_id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          playbook_id: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          playbook_id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "playbook_views_playbook_id_fkey"
            columns: ["playbook_id"]
            isOneToOne: false
            referencedRelation: "playbooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playbook_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      playbooks: {
        Row: {
          category: string | null
          content_mdx: string
          cover_image_url: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          order_index: number
          pdf_url: string | null
          slug: string
          status: string
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          category?: string | null
          content_mdx?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          order_index?: number
          pdf_url?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          category?: string | null
          content_mdx?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          order_index?: number
          pdf_url?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
