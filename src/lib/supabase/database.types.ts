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
      game_external_ids: {
        Row: {
          game_id: number;
          source: string;
          uid: string;
        };
        Insert: {
          game_id: number;
          source: string;
          uid: string;
        };
        Update: {
          game_id?: number;
          source?: string;
          uid?: string;
        };
        Relationships: [
          {
            foreignKeyName: "game_external_ids_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
      game_genres: {
        Row: {
          game_id: number;
          genre_id: number;
        };
        Insert: {
          game_id: number;
          genre_id: number;
        };
        Update: {
          game_id?: number;
          genre_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "game_genres_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_genres_genre_id_fkey";
            columns: ["genre_id"];
            isOneToOne: false;
            referencedRelation: "genres";
            referencedColumns: ["id"];
          },
        ];
      };
      game_media: {
        Row: {
          game_id: number;
          height: number | null;
          image_id: string;
          kind: string;
          position: number;
          width: number | null;
        };
        Insert: {
          game_id: number;
          height?: number | null;
          image_id: string;
          kind: string;
          position?: number;
          width?: number | null;
        };
        Update: {
          game_id?: number;
          height?: number | null;
          image_id?: string;
          kind?: string;
          position?: number;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "game_media_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
      game_platforms: {
        Row: {
          game_id: number;
          platform_id: number;
        };
        Insert: {
          game_id: number;
          platform_id: number;
        };
        Update: {
          game_id?: number;
          platform_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "game_platforms_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_platforms_platform_id_fkey";
            columns: ["platform_id"];
            isOneToOne: false;
            referencedRelation: "platforms";
            referencedColumns: ["id"];
          },
        ];
      };
      game_price_ids: {
        Row: {
          checked_at: string;
          game_id: number;
          itad_id: string | null;
        };
        Insert: {
          checked_at?: string;
          game_id: number;
          itad_id?: string | null;
        };
        Update: {
          checked_at?: string;
          game_id?: number;
          itad_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "game_price_ids_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: true;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
      game_score_checks: {
        Row: {
          checked_at: string;
          game_id: number;
        };
        Insert: {
          checked_at?: string;
          game_id: number;
        };
        Update: {
          checked_at?: string;
          game_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "game_score_checks_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: true;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
      game_scores: {
        Row: {
          count: number | null;
          game_id: number;
          label: string | null;
          out_of: number;
          score: number;
          source: string;
          url: string | null;
        };
        Insert: {
          count?: number | null;
          game_id: number;
          label?: string | null;
          out_of: number;
          score: number;
          source: string;
          url?: string | null;
        };
        Update: {
          count?: number | null;
          game_id?: number;
          label?: string | null;
          out_of?: number;
          score?: number;
          source?: string;
          url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "game_scores_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
      game_videos: {
        Row: {
          game_id: number;
          name: string | null;
          position: number;
          video_id: string;
        };
        Insert: {
          game_id: number;
          name?: string | null;
          position?: number;
          video_id: string;
        };
        Update: {
          game_id?: number;
          name?: string | null;
          position?: number;
          video_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "game_videos_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
      games: {
        Row: {
          cover_image_id: string | null;
          critic_rating: number | null;
          critic_rating_count: number;
          fetched_at: string;
          first_release_date: string | null;
          game_type: string | null;
          id: number;
          igdb_rating: number | null;
          igdb_rating_count: number;
          igdb_updated_at: string | null;
          name: string;
          parent_game_id: number | null;
          slug: string;
          stale_after: string;
          summary: string | null;
          version_parent_id: number | null;
        };
        Insert: {
          cover_image_id?: string | null;
          critic_rating?: number | null;
          critic_rating_count?: number;
          fetched_at?: string;
          first_release_date?: string | null;
          game_type?: string | null;
          id: number;
          igdb_rating?: number | null;
          igdb_rating_count?: number;
          igdb_updated_at?: string | null;
          name: string;
          parent_game_id?: number | null;
          slug: string;
          stale_after?: string;
          summary?: string | null;
          version_parent_id?: number | null;
        };
        Update: {
          cover_image_id?: string | null;
          critic_rating?: number | null;
          critic_rating_count?: number;
          fetched_at?: string;
          first_release_date?: string | null;
          game_type?: string | null;
          id?: number;
          igdb_rating?: number | null;
          igdb_rating_count?: number;
          igdb_updated_at?: string | null;
          name?: string;
          parent_game_id?: number | null;
          slug?: string;
          stale_after?: string;
          summary?: string | null;
          version_parent_id?: number | null;
        };
        Relationships: [];
      };
      genres: {
        Row: {
          id: number;
          name: string;
          slug: string;
        };
        Insert: {
          id: number;
          name: string;
          slug: string;
        };
        Update: {
          id?: number;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      igdb_search_cache: {
        Row: {
          expires_at: string;
          fetched_at: string;
          game_ids: number[];
          query: string;
        };
        Insert: {
          expires_at: string;
          fetched_at?: string;
          game_ids: number[];
          query: string;
        };
        Update: {
          expires_at?: string;
          fetched_at?: string;
          game_ids?: number[];
          query?: string;
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
          fetched_at: string;
          generation: number | null;
          id: number;
          name: string;
          platform_type: string | null;
          slug: string;
        };
        Insert: {
          abbreviation?: string | null;
          fetched_at?: string;
          generation?: number | null;
          id: number;
          name: string;
          platform_type?: string | null;
          slug: string;
        };
        Update: {
          abbreviation?: string | null;
          fetched_at?: string;
          generation?: number | null;
          id?: number;
          name?: string;
          platform_type?: string | null;
          slug?: string;
        };
        Relationships: [];
      };
      price_cache: {
        Row: {
          country: string;
          fetched_at: string;
          game_id: number;
          kind: string;
          payload: Json;
        };
        Insert: {
          country: string;
          fetched_at?: string;
          game_id: number;
          kind: string;
          payload: Json;
        };
        Update: {
          country?: string;
          fetched_at?: string;
          game_id?: number;
          kind?: string;
          payload?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "price_cache_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
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
      provider_tokens: {
        Row: {
          access_token: string;
          expires_at: string;
          provider: string;
          updated_at: string;
        };
        Insert: {
          access_token: string;
          expires_at: string;
          provider: string;
          updated_at?: string;
        };
        Update: {
          access_token?: string;
          expires_at?: string;
          provider?: string;
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
      release_dates: {
        Row: {
          game_id: number;
          id: number;
          label: string | null;
          platform_id: number | null;
          precision: string;
          region: string | null;
          released_on: string | null;
        };
        Insert: {
          game_id: number;
          id: number;
          label?: string | null;
          platform_id?: number | null;
          precision: string;
          region?: string | null;
          released_on?: string | null;
        };
        Update: {
          game_id?: number;
          id?: number;
          label?: string | null;
          platform_id?: number | null;
          precision?: string;
          region?: string | null;
          released_on?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "release_dates_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "release_dates_platform_id_fkey";
            columns: ["platform_id"];
            isOneToOne: false;
            referencedRelation: "platforms";
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
      store_game_scores: {
        Args: { scores: Json; target_game_id: number };
        Returns: undefined;
      };
      store_igdb_games: { Args: { batch: Json }; Returns: undefined };
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
