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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      app_fields: {
        Row: {
          id: string
          name: string
          label: string
          type: string
          placeholder: string | null
          options: Json | null
          required: boolean
          item_order: number
          visible_to: string
          filled_by: string
          phase: string
          show_in: Json | null
          show_in_admin: Json | null
          linked_field_id: string | null
          terbilang_format: string | null
          date_addition_days: number | null
        }
        Insert: {
          id?: string
          name: string
          label: string
          type: string
          placeholder?: string | null
          options?: Json | null
          required?: boolean
          item_order: number
          visible_to: string
          filled_by: string
          phase: string
          show_in?: Json | null
          show_in_admin?: Json | null
          linked_field_id?: string | null
          terbilang_format?: string | null
          date_addition_days?: number | null
        }
        Update: {
          id?: string
          name?: string
          label?: string
          type?: string
          placeholder?: string | null
          options?: Json | null
          required?: boolean
          item_order?: number
          visible_to?: string
          filled_by?: string
          phase?: string
          show_in?: Json | null
          show_in_admin?: Json | null
          linked_field_id?: string | null
          terbilang_format?: string | null
          date_addition_days?: number | null
        }
      }
      document_templates: {
        Row: {
          id: string
          name: string
          type: string
          category: string | null
          phase: string
          format: string
          last_updated: string | null
        }
        Insert: {
          id: string
          name: string
          type: string
          category?: string | null
          phase: string
          format: string
          last_updated?: string | null
        }
        Update: {
          id?: string
          name?: string
          type?: string
          category?: string | null
          phase?: string
          format?: string
          last_updated?: string | null
        }
      }
      submissions: {
        Row: {
          id: string
          respondent_id: string
          respondent_name: string
          submission_phase: string
          status: string
          data: Json
          document_type: string | null
          work_category: string | null
          admin_feedback: string | null
          document_date: string | null
          created_at: string | null
          updated_at: string | null
          kak_type: string | null
          workforce_requirements: Json | null
          schedule_phases: Json | null
          durasi_pelaksanaan: number | null
          lampiran_baphp_items: Json | null
          adendum_documents: Json | null
          error_reports: Json | null
          document_dates: Json | null
          company_profile: string | null
          contract_file: string | null
        }
        Insert: {
          id?: string
          respondent_id: string
          respondent_name: string
          submission_phase: string
          status: string
          data?: Json
          document_type?: string | null
          work_category?: string | null
          admin_feedback?: string | null
          document_date?: string | null
          created_at?: string | null
          updated_at?: string | null
          kak_type?: string | null
          workforce_requirements?: Json | null
          schedule_phases?: Json | null
          durasi_pelaksanaan?: number | null
          lampiran_baphp_items?: Json | null
          adendum_documents?: Json | null
          error_reports?: Json | null
          document_dates?: Json | null
          company_profile?: string | null
          contract_file?: string | null
        }
        Update: {
          id?: string
          respondent_id?: string
          respondent_name?: string
          submission_phase?: string
          status?: string
          data?: Json
          document_type?: string | null
          work_category?: string | null
          admin_feedback?: string | null
          document_date?: string | null
          created_at?: string | null
          updated_at?: string | null
          kak_type?: string | null
          workforce_requirements?: Json | null
          schedule_phases?: Json | null
          durasi_pelaksanaan?: number | null
          lampiran_baphp_items?: Json | null
          adendum_documents?: Json | null
          error_reports?: Json | null
          document_dates?: Json | null
          company_profile?: string | null
          contract_file?: string | null
        }
      }
      access_requests: {
        Row: {
          id: string
          name: string
          email: string
          request_date: string | null
          status: string
          code: string | null
          approved_at: string | null
          approved_by: string | null
        }
        Insert: {
          id?: string
          name: string
          email: string
          request_date?: string | null
          status: string
          code?: string | null
          approved_at?: string | null
          approved_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string
          request_date?: string | null
          status?: string
          code?: string | null
          approved_at?: string | null
          approved_by?: string | null
        }
      }
      contract_drafts: {
        Row: {
          id: string
          type: string
          last_updated: string | null
          data: Json
        }
        Insert: {
          id?: string
          type: string
          last_updated?: string | null
          data?: Json
        }
        Update: {
          id?: string
          type?: string
          last_updated?: string | null
          data?: Json
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
    Enums: {},
  },
} as const
