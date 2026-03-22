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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      accommodation_items: {
        Row: {
          address: string | null
          check_in: string | null
          check_in_time: string | null
          check_out: string | null
          check_out_time: string | null
          confirmation: string | null
          cost: number | null
          created_at: string
          id: string
          lat: number | null
          lng: number | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          check_in?: string | null
          check_in_time?: string | null
          check_out?: string | null
          check_out_time?: string | null
          confirmation?: string | null
          cost?: number | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          check_in?: string | null
          check_in_time?: string | null
          check_out?: string | null
          check_out_time?: string | null
          confirmation?: string | null
          cost?: number | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      activity_items: {
        Row: {
          confirmation: string | null
          cost: number | null
          created_at: string
          id: string
          lat: number | null
          lng: number | null
          location: string | null
          name: string
          notes: string | null
          time: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          confirmation?: string | null
          cost?: number | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          location?: string | null
          name?: string
          notes?: string | null
          time?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          confirmation?: string | null
          cost?: number | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          location?: string | null
          name?: string
          notes?: string | null
          time?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          clock_format: string | null
          cover_image: string | null
          created_at: string
          days: number | null
          destination: string | null
          display_name: string | null
          id: string
          names: string | null
          quote: string | null
          trip_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          clock_format?: string | null
          cover_image?: string | null
          created_at?: string
          days?: number | null
          destination?: string | null
          display_name?: string | null
          id?: string
          names?: string | null
          quote?: string | null
          trip_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          clock_format?: string | null
          cover_image?: string | null
          created_at?: string
          days?: number | null
          destination?: string | null
          display_name?: string | null
          id?: string
          names?: string | null
          quote?: string | null
          trip_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reservation_items: {
        Row: {
          confirmation: string | null
          cost: number | null
          created_at: string
          date: string | null
          id: string
          lat: number | null
          lng: number | null
          location: string | null
          name: string
          notes: string | null
          time: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          confirmation?: string | null
          cost?: number | null
          created_at?: string
          date?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          location?: string | null
          name?: string
          notes?: string | null
          time?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          confirmation?: string | null
          cost?: number | null
          created_at?: string
          date?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          location?: string | null
          name?: string
          notes?: string | null
          time?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transport_items: {
        Row: {
          arrival_lat: number | null
          arrival_lng: number | null
          arrival_location: string | null
          confirmation: string | null
          cost: number | null
          created_at: string
          departure_lat: number | null
          departure_lng: number | null
          departure_location: string | null
          details: string | null
          id: string
          lat: number | null
          lng: number | null
          location: string | null
          time: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          arrival_lat?: number | null
          arrival_lng?: number | null
          arrival_location?: string | null
          confirmation?: string | null
          cost?: number | null
          created_at?: string
          departure_lat?: number | null
          departure_lng?: number | null
          departure_location?: string | null
          details?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          location?: string | null
          time?: string | null
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          arrival_lat?: number | null
          arrival_lng?: number | null
          arrival_location?: string | null
          confirmation?: string | null
          cost?: number | null
          created_at?: string
          departure_lat?: number | null
          departure_lng?: number | null
          departure_location?: string | null
          details?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          location?: string | null
          time?: string | null
          type?: string
          updated_at?: string
          user_id?: string
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
