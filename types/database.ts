export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          display_name: string | null;
          bio: string | null;
          avatar_url: string | null;
          location: string | null;
          website: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          display_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          location?: string | null;
          website?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          display_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          location?: string | null;
          website?: string | null;
          updated_at?: string;
        };
      };
      videos: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          caption: string | null;
          video_url: string;
          thumbnail_url: string | null;
          location: string | null;
          latitude: number | null;
          longitude: number | null;
          view_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          caption?: string | null;
          video_url: string;
          thumbnail_url?: string | null;
          location?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          view_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          caption?: string | null;
          video_url?: string;
          thumbnail_url?: string | null;
          location?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          view_count?: number;
          updated_at?: string;
        };
      };
      likes: {
        Row: {
          id: string;
          user_id: string;
          video_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          video_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          video_id?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          user_id: string;
          video_id: string;
          content: string;
          parent_comment_id: string | null;
          is_pinned: boolean;
          like_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          video_id: string;
          content: string;
          parent_comment_id?: string | null;
          is_pinned?: boolean;
          like_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          video_id?: string;
          content?: string;
          parent_comment_id?: string | null;
          is_pinned?: boolean;
          like_count?: number;
          updated_at?: string;
        };
      };
      comment_likes: {
        Row: {
          id: string;
          user_id: string;
          comment_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          comment_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          comment_id?: string;
        };
      };
      follows: {
        Row: {
          id: string;
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          follower_id?: string;
          following_id?: string;
        };
      };
      saves: {
        Row: {
          id: string;
          user_id: string;
          video_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          video_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          video_id?: string;
        };
      };
      itineraries: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          destination: string;
          start_date: string | null;
          end_date: string | null;
          duration_days: number;
          travel_style: string | null;
          budget_level: string | null;
          generated_by: string;
          generation_time_ms: number | null;
          days: Json;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          destination: string;
          start_date?: string | null;
          end_date?: string | null;
          duration_days: number;
          travel_style?: string | null;
          budget_level?: string | null;
          generated_by?: string;
          generation_time_ms?: number | null;
          days: Json;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          destination?: string;
          start_date?: string | null;
          end_date?: string | null;
          duration_days?: number;
          travel_style?: string | null;
          budget_level?: string | null;
          generated_by?: string;
          generation_time_ms?: number | null;
          days?: Json;
          metadata?: Json | null;
          updated_at?: string;
        };
      };
      itinerary_ratings: {
        Row: {
          id: string;
          itinerary_id: string;
          user_id: string;
          rating: boolean;
          feedback: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          itinerary_id: string;
          user_id: string;
          rating: boolean;
          feedback?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          itinerary_id?: string;
          user_id?: string;
          rating?: boolean;
          feedback?: string | null;
        };
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
  };
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type Video = Database['public']['Tables']['videos']['Row'];
export type VideoInsert = Database['public']['Tables']['videos']['Insert'];
export type VideoUpdate = Database['public']['Tables']['videos']['Update'];

export type Like = Database['public']['Tables']['likes']['Row'];
export type LikeInsert = Database['public']['Tables']['likes']['Insert'];

export type Comment = Database['public']['Tables']['comments']['Row'];
export type CommentInsert = Database['public']['Tables']['comments']['Insert'];
export type CommentUpdate = Database['public']['Tables']['comments']['Update'];

export type CommentLike = Database['public']['Tables']['comment_likes']['Row'];
export type CommentLikeInsert = Database['public']['Tables']['comment_likes']['Insert'];

export type Follow = Database['public']['Tables']['follows']['Row'];
export type FollowInsert = Database['public']['Tables']['follows']['Insert'];

export type Save = Database['public']['Tables']['saves']['Row'];
export type SaveInsert = Database['public']['Tables']['saves']['Insert'];

export type Itinerary = Database['public']['Tables']['itineraries']['Row'];
export type ItineraryInsert = Database['public']['Tables']['itineraries']['Insert'];
export type ItineraryUpdate = Database['public']['Tables']['itineraries']['Update'];

export type ItineraryRating = Database['public']['Tables']['itinerary_ratings']['Row'];
export type ItineraryRatingInsert = Database['public']['Tables']['itinerary_ratings']['Insert'];

// Extended types with relations
export type VideoWithProfile = Video & {
  profiles: Profile;
  like_count: number;
  comment_count: number;
  is_liked?: boolean;
  is_saved?: boolean;
};

export type CommentWithProfile = Comment & {
  profiles: Profile;
  is_liked?: boolean;
  replies?: CommentWithProfile[];
};

// Extended types for itineraries
export type ItineraryDay = {
  day: number;
  date?: string;
  morning?: {
    time: string;
    activity: string;
    location: string;
    description?: string;
    duration: string;
  };
  afternoon?: {
    time: string;
    activity: string;
    location: string;
    description?: string;
    duration: string;
  };
  evening?: {
    time: string;
    activity: string;
    location: string;
    description?: string;
    duration: string;
  };
  activities?: Array<{
    time: string;
    activity: string;
    location: string;
    description?: string;
    duration: string;
  }>;
};

export type ItineraryWithProfile = Itinerary & {
  profiles: Profile;
  user_rating?: ItineraryRating;
  average_rating?: number;
  total_ratings?: number;
};

export type LocationWithCoordinates = {
  id: string;
  title: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  caption: string | null;
  description: string | null;
};

export type ItineraryPreferences = {
  destination: string;
  durationDays: number;
  travelStyle?: 'adventure' | 'relaxation' | 'cultural' | 'foodie' | 'mixed';
  budgetLevel?: 'budget' | 'moderate' | 'luxury';
  interests?: string[];
  startDate?: string;
  endDate?: string;
};

export type LocationCluster = {
  id: string;
  name: string;
  center: {
    latitude: number;
    longitude: number;
  };
  locations: LocationWithCoordinates[];
};

