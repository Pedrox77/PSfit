export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PostType =
  | "daily_life"
  | "workout"
  | "progress"
  | "meal"
  | "photo"
  | "carousel"
  | "video"
  | "achievement"
  | "text"
  | "verified_workout";

export type PostVisibility =
  | "public"
  | "followers"
  | "private";

export type FollowStatus = "pending" | "accepted";

export type MediaType = "image" | "video";

export type TrainingVisualStyle =
  | "photo_only"
  | "photo_stats"
  | "photo_body_map"
  | "full_carousel"
  | "stats_only";

export interface PostMedia {
  id: string;
  post_id: string;
  user_id: string;
  storage_path: string;
  media_type: MediaType;
  mime_type: string | null;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  position: number;
  alt_text: string | null;
  created_at: string;
  signed_url?: string;
}

export interface WorkoutReceiptExercise {
  name: string;
  sets: number;

  // Padronizado com a coluna public.exercises.repetitions.
  repetitions: string;
  load?: string;
}

export interface WorkoutReceipt {
  session_id?: string;
  workout_id?: string;
  name_key?: string | null;
  title: string;
  duration_minutes: number;
  exercises_completed: number;
  sets_completed: number;
  total_volume_kg: number;
  calories?: number;
  muscles: string[];
  primary_muscles?: string[];
  secondary_muscles?: string[];
  trained_areas?: string[];
  effort: number;
  personal_records: number;
  completed_at: string;
  momentum_score: number;
  average_heart_rate?: number;
  muscle_intensity?: Record<string, number>;
  exercises?: WorkoutReceiptExercise[];
}

export interface CommunityProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  avatar_path: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  primary_goal: string | null;
  experience_level: string | null;
  is_private: boolean;
  show_momentum_score: boolean;
  show_workout_stats: boolean;
  momentum_score: number | null;
  followers_count: number;
  following_count: number;
  posts_count: number;
  plan?: "free" | "pro" | "pro_mensal" | "pro_anual";
  plan_status?: "inactive" | "incomplete" | "incomplete_expired" | "trialing" | "active" | "past_due" | "canceled" | "unpaid" | "paused";
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  stripe_price_id?: string | null;
  stripe_current_period_end?: string | null;
  stripe_cancel_at_period_end?: boolean;
  pronouns?: string | null;
  profile_category?: string | null;
  cover_url?: string | null;
  profile_song_url?: string | null;
  profile_song_title?: string | null;
  profile_song_artist?: string | null;
  profile_song_artwork_url?: string | null;
}

export interface CommunityPost {
  id: string;
  user_id: string;
  workout_session_id: string | null;
  post_type: PostType;
  caption: string | null;
  workout_title: string | null;
  visibility: PostVisibility;
  location: string | null;
  allow_comments: boolean;
  hide_like_count: boolean;
  sensitive_content: boolean;
  is_verified_workout: boolean;
  workout_receipt: WorkoutReceipt | null;
  training_visual_style?: TrainingVisualStyle;
  like_count: number;
  comment_count: number;
  save_count: number;
  created_at: string;
  updated_at: string;
  author?: CommunityProfile;
  media?: PostMedia[];
  liked?: boolean;
  saved?: boolean;
  music?: PostMusic | null;
}

export interface PostMusic {
  post_id: string;
  spotify_url: string;
  title: string | null;
  artist_name: string | null;
  artwork_url: string | null;
  embed_url: string | null;
  content_type?: string | null;
}

export interface PostLike {
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface SavedPost extends PostLike {}

export interface CommentLike {
  comment_id: string;
  user_id: string;
  created_at: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  body: string;
  like_count: number;
  created_at: string;
  updated_at: string;
  author?: CommunityProfile;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  status: FollowStatus;
  created_at: string;
  accepted_at: string | null;
}

export interface Hashtag {
  id: string;
  name: string;
  posts_count: number;
  created_at: string;
}

export interface Notification {
  id: string;
  recipient_id: string;
  actor_id: string | null;
  type:
    | "new_follower"
    | "follow_request"
    | "follow_accepted"
    | "post_liked"
    | "comment_added"
    | "comment_replied"
    | "comment_liked"
    | "mentioned_post"
    | "mentioned_comment"
    | "workout_copied"
    | "challenge_invitation";
  post_id: string | null;
  comment_id: string | null;
  metadata: Record<string, string>;
  read_at: string | null;
  created_at: string;
  actor?: CommunityProfile;
}

export interface PostReport {
  id: string;
  reporter_id: string;
  post_id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
}

export interface UserBlock {
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface FeedCursor {
  created_at: string;
  id: string;
}

export interface Story {
  id: string;
  user_id: string;
  media_path: string | null;
  media_type:
    | "image"
    | "video"
    | "text"
    | "workout"
    | "meal"
    | "progress";
  text_content: string | null;
  background_style: Record<string, string>;
  caption: string | null;
  location: string | null;
  visibility: "public" | "followers" | "close_friends";
  allow_replies: boolean;
  music_url: string | null;
  music_title: string | null;
  music_artist: string | null;
  music_artwork_url: string | null;
  workout_session_id: string | null;
  expires_at: string;
  created_at: string;
  author?: CommunityProfile;
  signed_url?: string;
  viewed?: boolean;
}

export interface StoryHighlight {
  id: string;
  user_id: string;
  name: string;
  cover_path: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  cover_url?: string;
}

/* =========================================================
   DATABASE ROW TYPES
========================================================= */

export interface ProfileRow {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  primary_goal: string | null;
  experience_level: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  target_weight_kg: number | null;
  plan: "free" | "pro" | "pro_mensal" | "pro_anual";
  plan_status: "inactive" | "incomplete" | "incomplete_expired" | "trialing" | "active" | "past_due" | "canceled" | "unpaid" | "paused";
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  stripe_current_period_end: string | null;
  stripe_cancel_at_period_end: boolean;
  payment_provider: string | null;
  cakto_order_id: string | null;
  cakto_offer_id: string | null;
  cakto_subscription_id: string | null;
  cakto_customer_email: string | null;
  pro_ativado_em: string | null;
  personalization_choice:
    | "workout"
    | "nutrition"
    | "both"
    | "later"
    | null;
  onboarding_step:
    | "nickname"
    | "personalization"
    | "training"
    | "nutrition"
    | "review"
    | "generating"
    | "completed";
  onboarding_completed: boolean;
  onboarding_completed_at: string | null;
  is_private: boolean;
  show_momentum_score: boolean;
  show_workout_stats: boolean;
  followers_count: number;
  following_count: number;
  posts_count: number;
  created_at: string;
  updated_at: string;
}

export interface WorkoutPlanRow {
  id: string;
  user_id: string;
  name: string;
  goal: string | null;
  experience_level: string | null;
  days_per_week: number | null;
  session_duration: number | null;
  is_active: boolean;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface WorkoutRow {
  id: string;
  user_id: string;
  plan_id: string | null;
  name: string;
  name_key: string | null;
  description: string | null;
  focus: string | null;
  focus_key: string | null;
  estimated_minutes: number | null;
  difficulty: string | null;
  status: string;
  position: number;
  created_at: string;
  updated_at: string;
  scheduled_weekday: number | null;
  scheduled_time: string | null;
  is_custom: boolean;
}

export interface WorkoutSessionRow {
  id: string; user_id: string; workout_id: string; status: string;
  plan_id: string | null; scheduled_date: string;
  started_at: string | null; completed_at: string | null;
  duration_minutes: number | null; total_volume_kg: number;
  calories: number | null; perceived_effort: number | null; sets_completed: number;
  exercises_completed: number; notes: string | null; created_at: string; updated_at: string;
}
export interface WorkoutSetLogRow {
  id: string; user_id: string; session_id: string; exercise_id: string;
  set_number: number; weight_kg: number | null; repetitions: number | null;
  duration_seconds: number | null; completed: boolean; notes: string | null; created_at: string; updated_at: string;
}
export interface ProgressEntryRow {
  id: string; user_id: string; recorded_at: string; weight_kg: number | null;
  body_fat_percentage: number | null; waist_cm: number | null; chest_cm: number | null;
  arm_cm: number | null; thigh_cm: number | null; hip_cm: number | null;
  notes: string | null; photo_path: string | null; created_at: string; updated_at: string;
}
export interface RecoveryCheckinRow {
  id: string; user_id: string; checkin_date: string; sleep_hours: number;
  sleep_quality: number; energy_level: number; muscle_soreness: number;
  stress_level: number; has_pain: boolean; pain_location: string | null;
  notes: string | null; readiness_score: number; recommendation: string; created_at: string; updated_at: string;
}
export interface TwinScenarioRow {
  id: string; user_id: string; name: string; assumptions: Json;
  projection: Json; created_at: string; updated_at: string;
}
export interface ExerciseCatalogRow {
  id: string; name: string; slug: string; aliases: string[]; primary_muscle: string;
  secondary_muscles: string[]; equipment: string | null; difficulty: string | null;
  exercise_type: string | null; instructions: string | null; safety_notes: string | null;
  thumbnail_url: string | null; video_url: string | null; created_at: string; updated_at: string;
}
export interface WorkoutImportRow {
  id: string; user_id: string; storage_path: string; mime_type: string; size_bytes: number;
  status: string; extracted_data: Json | null; error_message: string | null; created_at: string; updated_at: string;
}
export interface TrainingStreak { current: number; best: number; totalDays: number; trainedToday: boolean }

export interface ExerciseRow {
  id: string;
  workout_id: string;
  catalog_exercise_id: string | null;
  name: string;
  name_key: string | null;
  muscle_group: string | null;
  primary_muscles: string[];
  secondary_muscles: string[];
  equipment: string | null;
  sets: number | null;

  // A coluna correta do banco é repetitions, não reps.
  repetitions: string | null;

  suggested_weight_kg: number | null;
  rest_seconds: number | null;
  position: number;
  load_guidance: string | null;
  notes: string | null;
  video_url: string | null;
  video_thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrainingPreferenceRow {
  id: string;
  user_id: string;
  primary_goal: string | null;
  experience_level: string | null;
  training_location: string | null;
  equipment: string[];
  days_per_week: number | null;
  session_duration_minutes: number | null;
  preferred_days: string[];
  preferred_time: string | null;
  focus_areas: string[];
  limitations: string[];
  limitation_notes: string | null;
  coaching_style: string | null;
  load_progression_mode: "automatic" | "confirm" | "manual";
  created_at: string;
  updated_at: string;
}
export interface LoadProgressionEventRow {
  id:string; user_id:string; exercise_id:string; previous_weight:number;
  suggested_weight:number; applied_weight:number|null;
  progression_mode:"automatic"|"confirm"|"manual";
  reason:string; status:"suggested"|"applied"|"rejected"|"reverted";
  created_at:string; applied_at:string|null;
}

/* =========================================================
   DATABASE INSERT TYPES
========================================================= */

export type ProfileInsert = {
  id: string;
} & Partial<Omit<ProfileRow, "id">>;

export type WorkoutPlanInsert = Omit<
  WorkoutPlanRow,
  "id" | "is_active" | "source" | "created_at" | "updated_at"
> & {
  id?: string;
  is_active?: boolean;
  source?: string;
  created_at?: string;
  updated_at?: string;
};

export type WorkoutInsert = Omit<
  WorkoutRow,
  "id" | "name_key" | "focus_key" | "status" | "position" | "created_at" | "updated_at"
> & {
  id?: string;
  name_key?: string | null;
  focus_key?: string | null;
  status?: string;
  position?: number;
  created_at?: string;
  updated_at?: string;
};

export type ExerciseInsert = Omit<
  ExerciseRow,
  | "id"
  | "name_key"
  | "primary_muscles"
  | "secondary_muscles"
  | "position"
  | "created_at"
  | "updated_at"
> & {
  id?: string;
  name_key?: string | null;
  primary_muscles?: string[];
  secondary_muscles?: string[];
  position?: number;
  created_at?: string;
  updated_at?: string;
};

export type TrainingPreferenceInsert = Omit<
  TrainingPreferenceRow,
  | "id"
  | "equipment"
  | "preferred_days"
  | "focus_areas"
  | "limitations"
  | "created_at"
  | "updated_at"
> & {
  id?: string;
  equipment?: string[];
  preferred_days?: string[];
  focus_areas?: string[];
  limitations?: string[];
  created_at?: string;
  updated_at?: string;
};

/* =========================================================
   DATABASE UPDATE TYPES
========================================================= */

export type ProfileUpdate = Partial<ProfileInsert>;
export type WorkoutPlanUpdate = Partial<WorkoutPlanInsert>;
export type WorkoutUpdate = Partial<WorkoutInsert>;
export type ExerciseUpdate = Partial<ExerciseInsert>;
export type TrainingPreferenceUpdate =
  Partial<TrainingPreferenceInsert>;

type GenericTable = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: [];
};

export interface PaymentWebhookEventRow {
  id: string;
  provider: string;
  provider_event_id: string;
  event_type: string;
  order_id: string | null;
  payload_hash: string | null;
  processed_at: string | null;
  created_at: string;
}

type GenericFunction = {
  Args: Record<string, unknown>;
  Returns: unknown;
};

/* =========================================================
   SUPABASE DATABASE TYPE
========================================================= */

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: [];
      };
      payment_webhook_events: {
        Row: PaymentWebhookEventRow;
        Insert: Omit<PaymentWebhookEventRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<PaymentWebhookEventRow>;
        Relationships: [];
      };

      workout_plans: {
        Row: WorkoutPlanRow;
        Insert: WorkoutPlanInsert;
        Update: WorkoutPlanUpdate;
        Relationships: [];
      };

      workouts: {
        Row: WorkoutRow;
        Insert: WorkoutInsert;
        Update: WorkoutUpdate;
        Relationships: [];
      };

      exercises: {
        Row: ExerciseRow;
        Insert: ExerciseInsert;
        Update: ExerciseUpdate;
        Relationships: [];
      };

      training_preferences: {
        Row: TrainingPreferenceRow;
        Insert: TrainingPreferenceInsert;
        Update: TrainingPreferenceUpdate;
        Relationships: [];
      };
      load_progression_events: {
        Row: LoadProgressionEventRow;
        Insert: Omit<LoadProgressionEventRow,"id"|"created_at"|"applied_at"> & {id?:string;created_at?:string;applied_at?:string|null};
        Update: Partial<LoadProgressionEventRow>;
        Relationships: [];
      };
      exercise_catalog: { Row: ExerciseCatalogRow; Insert: Omit<ExerciseCatalogRow, "id" | "created_at" | "updated_at"> & { id?: string }; Update: Partial<ExerciseCatalogRow>; Relationships: [] };
      workout_sessions: { Row: WorkoutSessionRow; Insert: Omit<WorkoutSessionRow, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string }; Update: Partial<WorkoutSessionRow>; Relationships: [] };
      workout_set_logs: { Row: WorkoutSetLogRow; Insert: Omit<WorkoutSetLogRow, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string }; Update: Partial<WorkoutSetLogRow>; Relationships: [] };
      progress_entries: { Row: ProgressEntryRow; Insert: Omit<ProgressEntryRow, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string }; Update: Partial<ProgressEntryRow>; Relationships: [] };
      recovery_checkins: { Row: RecoveryCheckinRow; Insert: Omit<RecoveryCheckinRow, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string }; Update: Partial<RecoveryCheckinRow>; Relationships: [] };
      twin_scenarios: { Row: TwinScenarioRow; Insert: Omit<TwinScenarioRow, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string }; Update: Partial<TwinScenarioRow>; Relationships: [] };
      workout_imports: { Row: WorkoutImportRow; Insert: Omit<WorkoutImportRow, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string }; Update: Partial<WorkoutImportRow>; Relationships: [] };
    } & Record<string, GenericTable>;

    Views: Record<string, never>;

    Functions: {
      check_username_availability: {
        Args: {
          candidate: string;
        };
        Returns: boolean;
      };

      set_my_username: {
        Args: {
          candidate: string;
        };
        Returns: string;
      };
    } & Record<string, GenericFunction>;

    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
