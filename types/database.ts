export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_pinned: boolean
          like_count: number
          parent_comment_id: string | null
          updated_at: string
          user_id: string
          video_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          like_count?: number
          parent_comment_id?: string | null
          updated_at?: string
          user_id: string
          video_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          like_count?: number
          parent_comment_id?: string | null
          updated_at?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      itineraries: {
        Row: {
          budget_level: string | null
          created_at: string
          days: Json
          destination: string
          duration_days: number
          end_date: string | null
          estimated_flight_price: number | null
          generated_by: string
          generation_time_ms: number | null
          id: string
          metadata: Json | null
          start_date: string | null
          title: string
          travel_style: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_level?: string | null
          created_at?: string
          days: Json
          destination: string
          duration_days: number
          end_date?: string | null
          estimated_flight_price?: number | null
          generated_by?: string
          generation_time_ms?: number | null
          id?: string
          metadata?: Json | null
          start_date?: string | null
          title: string
          travel_style?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_level?: string | null
          created_at?: string
          days?: Json
          destination?: string
          duration_days?: number
          end_date?: string | null
          generated_by?: string
          generation_time_ms?: number | null
          id?: string
          metadata?: Json | null
          start_date?: string | null
          title?: string
          travel_style?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itineraries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      itinerary_collaborators: {
        Row: {
          created_at: string
          id: string
          itinerary_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          itinerary_id: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          itinerary_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_collaborators_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itineraries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itinerary_collaborators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      itinerary_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          itinerary_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          itinerary_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          itinerary_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_comments_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itineraries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itinerary_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      itinerary_ratings: {
        Row: {
          created_at: string
          feedback: string | null
          id: string
          itinerary_id: string
          rating: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          id?: string
          itinerary_id: string
          rating: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          feedback?: string | null
          id?: string
          itinerary_id?: string
          rating?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_ratings_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itineraries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itinerary_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          created_at: string
          id: string
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_delivery_history: {
        Row: {
          attempt_count: number
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          error_message: string | null
          id: string
          notification_id: string
          status: string
        }
        Insert: {
          attempt_count?: number
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          error_message?: string | null
          id?: string
          notification_id: string
          status: string
        }
        Update: {
          attempt_count?: number
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          error_message?: string | null
          id?: string
          notification_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_delivery_history_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          category: Database["public"]["Enums"]["notification_category"]
          created_at: string
          email_enabled: boolean
          id: string
          in_app_enabled: boolean
          push_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["notification_category"]
          created_at?: string
          email_enabled?: boolean
          id?: string
          in_app_enabled?: boolean
          push_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["notification_category"]
          created_at?: string
          email_enabled?: boolean
          id?: string
          in_app_enabled?: boolean
          push_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          body_template: string
          category: Database["public"]["Enums"]["notification_category"]
          created_at: string
          data_template: Json | null
          default_channels: Database["public"]["Enums"]["notification_channel"][]
          id: string
          is_active: boolean
          is_essential: boolean
          priority: Database["public"]["Enums"]["notification_priority"]
          title_template: string
          trigger_event: string
          updated_at: string
        }
        Insert: {
          body_template: string
          category: Database["public"]["Enums"]["notification_category"]
          created_at?: string
          data_template?: Json | null
          default_channels?: Database["public"]["Enums"]["notification_channel"][]
          id?: string
          is_active?: boolean
          is_essential?: boolean
          priority: Database["public"]["Enums"]["notification_priority"]
          title_template: string
          trigger_event: string
          updated_at?: string
        }
        Update: {
          body_template?: string
          category?: Database["public"]["Enums"]["notification_category"]
          created_at?: string
          data_template?: Json | null
          default_channels?: Database["public"]["Enums"]["notification_channel"][]
          id?: string
          is_active?: boolean
          is_essential?: boolean
          priority?: Database["public"]["Enums"]["notification_priority"]
          title_template?: string
          trigger_event?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          category: Database["public"]["Enums"]["notification_category"]
          channels: Database["public"]["Enums"]["notification_channel"][]
          created_at: string
          data: Json | null
          delivered_at: string | null
          email_sent: boolean
          id: string
          in_app_shown: boolean
          priority: Database["public"]["Enums"]["notification_priority"]
          push_sent: boolean
          read_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          template_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          body: string
          category: Database["public"]["Enums"]["notification_category"]
          channels: Database["public"]["Enums"]["notification_channel"][]
          created_at?: string
          data?: Json | null
          delivered_at?: string | null
          email_sent?: boolean
          id?: string
          in_app_shown?: boolean
          priority: Database["public"]["Enums"]["notification_priority"]
          push_sent?: boolean
          read_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          template_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          category?: Database["public"]["Enums"]["notification_category"]
          channels?: Database["public"]["Enums"]["notification_channel"][]
          created_at?: string
          data?: Json | null
          delivered_at?: string | null
          email_sent?: boolean
          id?: string
          in_app_shown?: boolean
          priority?: Database["public"]["Enums"]["notification_priority"]
          push_sent?: boolean
          read_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          template_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "notification_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          email_notifications_enabled: boolean
          id: string
          location: string | null
          marketing_notifications_enabled: boolean
          notification_mute_until: string | null
          notification_muted: boolean
          push_notifications_enabled: boolean
          updated_at: string
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          email_notifications_enabled?: boolean
          id: string
          location?: string | null
          marketing_notifications_enabled?: boolean
          notification_mute_until?: string | null
          notification_muted?: boolean
          push_notifications_enabled?: boolean
          updated_at?: string
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          email_notifications_enabled?: boolean
          id?: string
          location?: string | null
          marketing_notifications_enabled?: boolean
          notification_mute_until?: string | null
          notification_muted?: boolean
          push_notifications_enabled?: boolean
          updated_at?: string
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      ratings: {
        Row: {
          created_at: string
          id: string
          rating: number
          updated_at: string
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rating: number
          updated_at?: string
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rating?: number
          updated_at?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      review_helpfulness: {
        Row: {
          created_at: string
          id: string
          is_helpful: boolean
          review_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_helpful: boolean
          review_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_helpful?: boolean
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_helpfulness_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_helpfulness_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      review_photos: {
        Row: {
          created_at: string
          display_order: number
          id: string
          photo_url: string
          review_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          photo_url: string
          review_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          photo_url?: string
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_photos_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          content: string
          created_at: string
          helpful_count: number
          id: string
          rating: number
          title: string | null
          unhelpful_count: number
          updated_at: string
          user_id: string
          video_id: string
        }
        Insert: {
          content: string
          created_at?: string
          helpful_count?: number
          id?: string
          rating: number
          title?: string | null
          unhelpful_count?: number
          updated_at?: string
          user_id: string
          video_id: string
        }
        Update: {
          content?: string
          created_at?: string
          helpful_count?: number
          id?: string
          rating?: number
          title?: string | null
          unhelpful_count?: number
          updated_at?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      saves: {
        Row: {
          created_at: string | null
          id: string
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saves_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          caption: string | null
          created_at: string
          description: string | null
          id: string
          latitude: number | null
          location: string | null
          longitude: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
          video_url: string
          view_count: number
        }
        Insert: {
          caption?: string | null
          created_at?: string
          description?: string | null
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          user_id: string
          video_url: string
          view_count?: number
        }
        Update: {
          caption?: string | null
          created_at?: string
          description?: string | null
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          video_url?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "videos_user_id_fkey"
            columns: ["user_id"]
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
      create_notification: {
        Args: {
          body_data?: Json
          custom_data?: Json
          title_data?: Json
          trigger_event_param: string
          user_id_param: string
        }
        Returns: string
      }
      get_unread_notification_count: {
        Args: { user_id_param: string }
        Returns: number
      }
      initialize_notification_preferences: {
        Args: { user_id_param: string }
        Returns: undefined
      }
      mark_all_notifications_read: {
        Args: { user_id_param: string }
        Returns: number
      }
      mark_notification_read: {
        Args: { notification_id: string; user_id_param: string }
        Returns: boolean
      }
      should_send_notification: {
        Args: {
          category_param: Database["public"]["Enums"]["notification_category"]
          channel_param: Database["public"]["Enums"]["notification_channel"]
          user_id_param: string
        }
        Returns: boolean
      }
    }
    Enums: {
      notification_category:
        | "trip_updates"
        | "price_alerts"
        | "promotions"
        | "social"
        | "system"
        | "booking"
        | "reminder"
      notification_channel: "push" | "email" | "in_app"
      notification_priority: "high" | "medium" | "low"
      notification_status: "pending" | "sent" | "delivered" | "failed" | "read"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
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

export type Rating = Database['public']['Tables']['ratings']['Row'];
export type RatingInsert = Database['public']['Tables']['ratings']['Insert'];
export type RatingUpdate = Database['public']['Tables']['ratings']['Update'];

export type Review = Database['public']['Tables']['reviews']['Row'];
export type ReviewInsert = Database['public']['Tables']['reviews']['Insert'];
export type ReviewUpdate = Database['public']['Tables']['reviews']['Update'];

export type ReviewPhoto = Database['public']['Tables']['review_photos']['Row'];
export type ReviewPhotoInsert = Database['public']['Tables']['review_photos']['Insert'];

export type ReviewHelpfulness = Database['public']['Tables']['review_helpfulness']['Row'];
export type ReviewHelpfulnessInsert = Database['public']['Tables']['review_helpfulness']['Insert'];
export type ReviewHelpfulnessUpdate = Database['public']['Tables']['review_helpfulness']['Update'];

// Itineraries
export type Itinerary = Database['public']['Tables']['itineraries']['Row'];
export type ItineraryInsert = Database['public']['Tables']['itineraries']['Insert'];
export type ItineraryUpdate = Database['public']['Tables']['itineraries']['Update'];

// Itinerary Ratings
export type ItineraryRating = Database['public']['Tables']['itinerary_ratings']['Row'];
export type ItineraryRatingInsert = Database['public']['Tables']['itinerary_ratings']['Insert'];
export type ItineraryRatingUpdate = Database['public']['Tables']['itinerary_ratings']['Update'];

// Itinerary Collaborators
export type ItineraryCollaborator = Database['public']['Tables']['itinerary_collaborators']['Row'];
export type ItineraryCollaboratorInsert = Database['public']['Tables']['itinerary_collaborators']['Insert'];
export type ItineraryCollaboratorUpdate = Database['public']['Tables']['itinerary_collaborators']['Update'];

// Itinerary Comments
export type ItineraryComment = Database['public']['Tables']['itinerary_comments']['Row'];
export type ItineraryCommentInsert = Database['public']['Tables']['itinerary_comments']['Insert'];
export type ItineraryCommentUpdate = Database['public']['Tables']['itinerary_comments']['Update'];

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

export type CollaborationRole = 'editor' | 'viewer';

export type ItineraryWithProfile = Itinerary & {
  profiles: Profile;
  user_rating?: ItineraryRating;
  average_rating?: number;
  total_ratings?: number;
  collaborator_count?: number;
  current_user_role?: CollaborationRole;
};

export type ItineraryCollaboratorWithProfile = ItineraryCollaborator & {
  profiles: Profile;
};

export type ItineraryCommentWithProfile = ItineraryComment & {
  profiles: Profile;
};

// Extended types with relations
export type VideoWithProfile = Video & {
  profiles: Profile;
  like_count: number;
  comment_count: number;
  is_liked?: boolean;
  is_saved?: boolean;
  user_rating?: number;
  average_rating?: number;
  review_count?: number;
};

export type ReviewWithProfile = Review & {
  profiles: Profile;
  review_photos?: ReviewPhoto[];
  user_helpfulness?: boolean | null;
};

export type CommentWithProfile = Comment & {
  profiles: Profile;
  is_liked?: boolean;
  replies?: CommentWithProfile[];
};

// Extended types for itineraries
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

export type ItinerarySuggestion = {
  id: string;
  destinationName: string;
  locationCount: number;
  locations: LocationWithCoordinates[];
  center: { latitude: number; longitude: number };
  inferredTravelStyle: 'adventure' | 'relaxation' | 'cultural' | 'foodie' | 'mixed';
  inferredBudgetLevel: 'budget' | 'moderate' | 'luxury';
  recommendedDuration: number;
  inferredInterests: string[];
};
