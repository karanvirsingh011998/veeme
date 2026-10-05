/**
 * Supabase database types (public.profiles auth fields).
 * Regenerate when schema changes: supabase gen types typescript
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          first_name: string | null;
          last_name: string | null;
          email: string | null;
          gender: string | null;
          country_code: string | null;
          phone_number: string | null;
          phone_verified_at: string | null;
          display_name: string | null;
          bio: string | null;
          city: string | null;
          avatar_url: string | null;
          account_status: string;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          first_name?: string | null;
          last_name?: string | null;
          email?: string | null;
          gender?: string | null;
          country_code?: string | null;
          phone_number?: string | null;
          phone_verified_at?: string | null;
          display_name?: string | null;
          bio?: string | null;
          city?: string | null;
          avatar_url?: string | null;
          account_status?: string;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string | null;
          last_name?: string | null;
          email?: string | null;
          gender?: string | null;
          country_code?: string | null;
          phone_number?: string | null;
          phone_verified_at?: string | null;
          display_name?: string | null;
          bio?: string | null;
          city?: string | null;
          avatar_url?: string | null;
          account_status?: string;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
  };
};

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];