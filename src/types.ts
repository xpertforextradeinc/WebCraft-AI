export interface UserProfile {
  plan_tier: string;
  media_credits: number;
  table_missing?: boolean;
}

export interface GeneratedMedia {
  url: string;
  type: 'image' | 'video';
  source: string;
}

export interface GenerationRecord {
  id: string;
  user_id: string;
  type: string;
  prompt: string;
  output_content: string;
  created_at: string;
}

export interface Template {
  name: string;
  prompt: string;
}
