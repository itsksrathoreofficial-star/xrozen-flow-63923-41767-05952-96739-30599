export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_activity_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          resource_id: string
          resource_type: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          resource_id: string
          resource_type: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          resource_id?: string
          resource_type?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          api_key: string
          created_at: string
          current_usage: number
          environment: string
          id: string
          is_active: boolean
          last_used: string | null
          name: string
          provider: string
          updated_at: string
          usage_limit: number | null
        }
        Insert: {
          api_key: string
          created_at?: string
          current_usage?: number
          environment?: string
          id?: string
          is_active?: boolean
          last_used?: string | null
          name: string
          provider: string
          updated_at?: string
          usage_limit?: number | null
        }
        Update: {
          api_key?: string
          created_at?: string
          current_usage?: number
          environment?: string
          id?: string
          is_active?: boolean
          last_used?: string | null
          name?: string
          provider?: string
          updated_at?: string
          usage_limit?: number | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          company: string | null
          created_at: string | null
          email: string
          employment_type: Database["public"]["Enums"]["employment_type"]
          full_name: string
          id: string
          monthly_rate: number | null
          project_rate: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          email: string
          employment_type?: Database["public"]["Enums"]["employment_type"]
          full_name: string
          id?: string
          monthly_rate?: number | null
          project_rate?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          email?: string
          employment_type?: Database["public"]["Enums"]["employment_type"]
          full_name?: string
          id?: string
          monthly_rate?: number | null
          project_rate?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      database_config: {
        Row: {
          config: Json
          created_at: string
          id: string
          is_active: boolean
          provider: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          provider?: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          provider?: string
          updated_at?: string
        }
        Relationships: []
      }
      editors: {
        Row: {
          created_at: string | null
          email: string
          employment_type: Database["public"]["Enums"]["employment_type"]
          full_name: string
          hourly_rate: number | null
          id: string
          monthly_salary: number | null
          specialty: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          employment_type?: Database["public"]["Enums"]["employment_type"]
          full_name: string
          hourly_rate?: number | null
          id?: string
          monthly_salary?: number | null
          specialty?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          employment_type?: Database["public"]["Enums"]["employment_type"]
          full_name?: string
          hourly_rate?: number | null
          id?: string
          monthly_salary?: number | null
          specialty?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          project_id: string | null
          recipient_id: string | null
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          project_id?: string | null
          recipient_id?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          project_id?: string | null
          recipient_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          due_date: string | null
          id: string
          invoice_url: string | null
          paid_date: string | null
          payer_id: string
          payment_type: Database["public"]["Enums"]["payment_type"]
          project_id: string | null
          recipient_id: string
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_url?: string | null
          paid_date?: string | null
          payer_id: string
          payment_type: Database["public"]["Enums"]["payment_type"]
          project_id?: string | null
          recipient_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_url?: string | null
          paid_date?: string | null
          payer_id?: string
          payment_type?: Database["public"]["Enums"]["payment_type"]
          project_id?: string | null
          recipient_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          subscription_active: boolean
          subscription_start_date: string | null
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          trial_end_date: string | null
          updated_at: string
          user_category: Database["public"]["Enums"]["user_category"]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          subscription_active?: boolean
          subscription_start_date?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          trial_end_date?: string | null
          updated_at?: string
          user_category?: Database["public"]["Enums"]["user_category"]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          subscription_active?: boolean
          subscription_start_date?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          trial_end_date?: string | null
          updated_at?: string
          user_category?: Database["public"]["Enums"]["user_category"]
        }
        Relationships: []
      }
      project_clients: {
        Row: {
          client_id: string
          created_at: string
          id: string
          project_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          project_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_clients_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_types: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          assigned_date: string | null
          client_id: string | null
          created_at: string | null
          creator_id: string
          deadline: string | null
          description: string | null
          editor_id: string | null
          fee: number | null
          id: string
          is_subproject: boolean | null
          name: string
          parent_project_id: string | null
          project_type: string | null
          raw_footage_link: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_date?: string | null
          client_id?: string | null
          created_at?: string | null
          creator_id: string
          deadline?: string | null
          description?: string | null
          editor_id?: string | null
          fee?: number | null
          id?: string
          is_subproject?: boolean | null
          name: string
          parent_project_id?: string | null
          project_type?: string | null
          raw_footage_link?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_date?: string | null
          client_id?: string | null
          created_at?: string | null
          creator_id?: string
          deadline?: string | null
          description?: string | null
          editor_id?: string | null
          fee?: number | null
          id?: string
          is_subproject?: boolean | null
          name?: string
          parent_project_id?: string | null
          project_type?: string | null
          raw_footage_link?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_editor_id_fkey"
            columns: ["editor_id"]
            isOneToOne: false
            referencedRelation: "editors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_parent_project_id_fkey"
            columns: ["parent_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          billing_period: string
          category: string
          created_at: string
          features: string[]
          id: string
          is_active: boolean
          name: string
          price: number
          project_limit: number | null
          storage_limit: number | null
          tier: string
          trial_days: number
          updated_at: string
        }
        Insert: {
          billing_period?: string
          category: string
          created_at?: string
          features?: string[]
          id?: string
          is_active?: boolean
          name: string
          price: number
          project_limit?: number | null
          storage_limit?: number | null
          tier: string
          trial_days?: number
          updated_at?: string
        }
        Update: {
          billing_period?: string
          category?: string
          created_at?: string
          features?: string[]
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          project_limit?: number | null
          storage_limit?: number | null
          tier?: string
          trial_days?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      video_versions: {
        Row: {
          correction_notes: string | null
          created_at: string
          final_url: string | null
          id: string
          is_approved: boolean
          preview_url: string | null
          project_id: string
          updated_at: string
          uploaded_by: string
          version_number: number
        }
        Insert: {
          correction_notes?: string | null
          created_at?: string
          final_url?: string | null
          id?: string
          is_approved?: boolean
          preview_url?: string | null
          project_id: string
          updated_at?: string
          uploaded_by: string
          version_number: number
        }
        Update: {
          correction_notes?: string | null
          created_at?: string
          final_url?: string | null
          id?: string
          is_approved?: boolean
          preview_url?: string | null
          project_id?: string
          updated_at?: string
          uploaded_by?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "video_versions_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "editor" | "client" | "agency" | "admin"
      employment_type: "fulltime" | "freelance"
      payment_status: "pending" | "paid" | "overdue"
      payment_type: "freelance" | "fulltime"
      project_status: "draft" | "in_review" | "approved" | "completed"
      subscription_tier: "basic" | "pro" | "premium"
      user_category: "editor" | "client" | "agency"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["editor", "client", "agency", "admin"],
      employment_type: ["fulltime", "freelance"],
      payment_status: ["pending", "paid", "overdue"],
      payment_type: ["freelance", "fulltime"],
      project_status: ["draft", "in_review", "approved", "completed"],
      subscription_tier: ["basic", "pro", "premium"],
      user_category: ["editor", "client", "agency"],
    },
  },
} as const
