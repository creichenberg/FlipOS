// Hand-written to match supabase/migrations/0001_init.sql. If you have the
// Supabase CLI connected to a real project, prefer regenerating this with
// `supabase gen types typescript` and keeping this file as the fallback.

export type ContentGoal = 'educate' | 'sell' | 'entertain' | 'build_trust' | 'engage';
export type VideoCardStatus = 'pending_detail' | 'detail_ready' | 'filming' | 'complete';
export type WeeklyPlanStatus = 'generating' | 'ready' | 'failed';
export type FilmingSessionStatus = 'in_progress' | 'complete';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete';
export type RenderJobStatus = 'queued' | 'rendering' | 'complete' | 'failed';

export type Business = {
  id: string;
  user_id: string;
  name: string;
  owner_name: string;
  industry: string;
  description: string;
  products_services: string;
  target_audience: string;
  location: string;
  brand_personality: string[];
  goals: string[];
  website: string | null;
  logo_url: string | null;
  brand_colors: Record<string, string> | null;
  created_at: string;
  updated_at: string;
}

export type WeeklyPlan = {
  id: string;
  business_id: string;
  week_start_date: string;
  status: WeeklyPlanStatus;
  generated_at: string | null;
  created_at: string;
}

export type VideoCard = {
  id: string;
  weekly_plan_id: string;
  business_id: string;
  day_of_week: number;
  title: string;
  concept: string;
  content_goal: ContentGoal;
  status: VideoCardStatus;
  created_at: string;
}

export type VideoDetail = {
  id: string;
  video_card_id: string;
  hook: string;
  script: string;
  voiceover_script: string;
  on_screen_text: string[];
  editing_suggestions: string;
  caption: string;
  hashtags: string[];
  call_to_action: string;
  generated_at: string;
}

export type Shot = {
  id: string;
  video_card_id: string;
  shot_number: number;
  description: string;
  duration_seconds: number;
  camera_angle: string;
  shot_type: string;
  order_index: number;
}

export type VoiceoverLine = {
  id: string;
  video_card_id: string;
  line_number: number;
  text: string;
  order_index: number;
}

export type FilmingSession = {
  id: string;
  video_card_id: string;
  business_id: string;
  started_at: string;
  completed_at: string | null;
  status: FilmingSessionStatus;
}

export type ShotProgress = {
  id: string;
  filming_session_id: string;
  shot_id: string;
  is_complete: boolean;
  completed_at: string | null;
}

export type VoiceoverProgress = {
  id: string;
  filming_session_id: string;
  voiceover_line_id: string;
  is_complete: boolean;
  completed_at: string | null;
}

export type MediaUpload = {
  id: string;
  video_card_id: string;
  business_id: string;
  shot_id: string | null;
  voiceover_line_id: string | null;
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  uploaded_at: string;
}

export type Subscription = {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: SubscriptionStatus;
  plan_tier: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export type StripeEvent = {
  id: string;
  stripe_event_id: string;
  type: string;
  processed_at: string;
  payload: Record<string, unknown>;
}

export type QrLoginToken = {
  id: string;
  token: string;
  user_id: string;
  next_path: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export type RenderJob = {
  id: string;
  video_card_id: string;
  business_id: string;
  provider: string;
  provider_job_id: string | null;
  status: RenderJobStatus;
  recipe: Record<string, unknown>;
  video_url: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export type RateLimitEvent = {
  id: string;
  user_id: string;
  action: string;
  created_at: string;
}

export type Database = {
  public: {
    Tables: {
      businesses: {
        Row: Business;
        Insert: Partial<Business> & Pick<Business, 'user_id' | 'name'>;
        Update: Partial<Business>;
        Relationships: [];
      };
      weekly_plans: {
        Row: WeeklyPlan;
        Insert: Partial<WeeklyPlan> & Pick<WeeklyPlan, 'business_id' | 'week_start_date'>;
        Update: Partial<WeeklyPlan>;
        Relationships: [];
      };
      video_cards: { Row: VideoCard; Insert: Partial<VideoCard>; Update: Partial<VideoCard>; Relationships: [] };
      video_details: { Row: VideoDetail; Insert: Partial<VideoDetail>; Update: Partial<VideoDetail>; Relationships: [] };
      shots: { Row: Shot; Insert: Partial<Shot>; Update: Partial<Shot>; Relationships: [] };
      voiceover_lines: { Row: VoiceoverLine; Insert: Partial<VoiceoverLine>; Update: Partial<VoiceoverLine>; Relationships: [] };
      filming_sessions: { Row: FilmingSession; Insert: Partial<FilmingSession>; Update: Partial<FilmingSession>; Relationships: [] };
      shot_progress: { Row: ShotProgress; Insert: Partial<ShotProgress>; Update: Partial<ShotProgress>; Relationships: [] };
      voiceover_progress: {
        Row: VoiceoverProgress;
        Insert: Partial<VoiceoverProgress>;
        Update: Partial<VoiceoverProgress>;
        Relationships: [];
      };
      media_uploads: { Row: MediaUpload; Insert: Partial<MediaUpload>; Update: Partial<MediaUpload>; Relationships: [] };
      subscriptions: { Row: Subscription; Insert: Partial<Subscription>; Update: Partial<Subscription>; Relationships: [] };
      stripe_events: { Row: StripeEvent; Insert: Partial<StripeEvent>; Update: Partial<StripeEvent>; Relationships: [] };
      qr_login_tokens: { Row: QrLoginToken; Insert: Partial<QrLoginToken>; Update: Partial<QrLoginToken>; Relationships: [] };
      render_jobs: { Row: RenderJob; Insert: Partial<RenderJob>; Update: Partial<RenderJob>; Relationships: [] };
      rate_limit_events: {
        Row: RateLimitEvent;
        Insert: Partial<RateLimitEvent> & Pick<RateLimitEvent, 'user_id' | 'action'>;
        Update: Partial<RateLimitEvent>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
