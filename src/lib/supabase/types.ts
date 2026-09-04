// Hand-written to mirror supabase/schema.sql. If you change the schema,
// update this file too (or regenerate with `supabase gen types typescript`
// once you have the Supabase CLI linked to your project).

export type MealSource = "ai" | "manual";
export type Confidence = "low" | "medium" | "high";
export type LogAccessStatus = "pending" | "accepted" | "declined" | "revoked";

export interface MealItem {
  name: string;
  estimated_grams: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          daily_calorie_goal: number;
          is_admin: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          daily_calorie_goal?: number;
          is_admin?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          daily_calorie_goal?: number;
          is_admin?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      meals: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          image_url: string | null;
          items: MealItem[];
          total_calories: number;
          total_protein_g: number;
          total_carbs_g: number;
          total_fat_g: number;
          notes: string | null;
          source: MealSource;
          confidence: Confidence | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          image_url?: string | null;
          items?: MealItem[];
          total_calories?: number;
          total_protein_g?: number;
          total_carbs_g?: number;
          total_fat_g?: number;
          notes?: string | null;
          source?: MealSource;
          confidence?: Confidence | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          image_url?: string | null;
          items?: MealItem[];
          total_calories?: number;
          total_protein_g?: number;
          total_carbs_g?: number;
          total_fat_g?: number;
          notes?: string | null;
          source?: MealSource;
          confidence?: Confidence | null;
        };
        Relationships: [];
      };
      log_access: {
        Row: {
          id: string;
          owner_id: string;
          viewer_id: string;
          status: LogAccessStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          viewer_id: string;
          status?: LogAccessStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          viewer_id?: string;
          status?: LogAccessStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      find_user_id_by_email: {
        Args: { lookup_email: string };
        Returns: string | null;
      };
    };
  };
}
