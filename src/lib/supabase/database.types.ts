// Generated from the live schema by the Supabase type generator; regenerate
// after every migration (see README, "Database"). The enum and composite-type
// helpers it also emits are dropped because this schema defines neither.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      entry_events: {
        Row: {
          created_at: string;
          entry_id: string;
          field: string;
          id: number;
          new_value: string | null;
          old_value: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          entry_id: string;
          field: string;
          id?: never;
          new_value?: string | null;
          old_value?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          entry_id?: string;
          field?: string;
          id?: never;
          new_value?: string | null;
          old_value?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "entry_events_entry_id_fkey";
            columns: ["entry_id"];
            isOneToOne: false;
            referencedRelation: "library_entries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "entry_events_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      entry_tags: {
        Row: {
          entry_id: string;
          tag_id: string;
        };
        Insert: {
          entry_id: string;
          tag_id: string;
        };
        Update: {
          entry_id?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "entry_tags_entry_id_fkey";
            columns: ["entry_id"];
            isOneToOne: false;
            referencedRelation: "library_entries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "entry_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
        ];
      };
      games: {
        Row: {
          cover_image_id: string | null;
          fetched_at: string;
          first_release_date: string | null;
          id: number;
          name: string;
          slug: string;
        };
        Insert: {
          cover_image_id?: string | null;
          fetched_at?: string;
          first_release_date?: string | null;
          id: number;
          name: string;
          slug: string;
        };
        Update: {
          cover_image_id?: string | null;
          fetched_at?: string;
          first_release_date?: string | null;
          id?: number;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      library_entries: {
        Row: {
          created_at: string;
          finished_on: string | null;
          game_id: number;
          id: string;
          notes: string;
          ownership: string;
          platform_id: number;
          progress: string;
          rating: number | null;
          started_on: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          finished_on?: string | null;
          game_id: number;
          id?: string;
          notes?: string;
          ownership: string;
          platform_id: number;
          progress?: string;
          rating?: number | null;
          started_on?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          finished_on?: string | null;
          game_id?: number;
          id?: string;
          notes?: string;
          ownership?: string;
          platform_id?: number;
          progress?: string;
          rating?: number | null;
          started_on?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "library_entries_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "library_entries_platform_id_fkey";
            columns: ["platform_id"];
            isOneToOne: false;
            referencedRelation: "platforms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "library_entries_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      platforms: {
        Row: {
          abbreviation: string | null;
          id: number;
          name: string;
          slug: string;
        };
        Insert: {
          abbreviation?: string | null;
          id: number;
          name: string;
          slug: string;
        };
        Update: {
          abbreviation?: string | null;
          id?: number;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          country: string | null;
          created_at: string;
          display_name: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          country?: string | null;
          created_at?: string;
          display_name?: string | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          country?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      queue_items: {
        Row: {
          created_at: string;
          entry_id: string;
          id: string;
          sort_key: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          entry_id: string;
          id?: string;
          sort_key: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          entry_id?: string;
          id?: string;
          sort_key?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "queue_items_entry_id_fkey";
            columns: ["entry_id"];
            isOneToOne: true;
            referencedRelation: "library_entries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "queue_items_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      tags: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tags_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;
