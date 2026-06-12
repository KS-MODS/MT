export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  role: 'admin' | 'developer' | 'user';
  is_verified: boolean;
  website_url: string | null;
  github_url: string | null;
  twitter_url: string | null;
  created_at: string;
  updated_at: string;
  // Computed fields
  total_downloads?: number;
  total_likes?: number;
  apps_count?: number;
  followers_count?: number;
  following_count?: number;
}

export interface App {
  id: string;
  developer_id: string;
  name: string;
  slug: string;
  description: string | null;
  version: string;
  category: string;
  apk_url: string | null;
  icon_url: string | null;
  banner_url: string | null;
  changelog: string | null;
  website_url: string | null;
  social_links: Record<string, string> | null;
  download_count: number;
  likes_count: number;
  status: 'pending' | 'approved' | 'rejected';
  is_editor_choice: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  download_type?: 'file' | 'link';
  download_url?: string | null;
  package_name?: string | null;
  // Relations
  developer?: Profile;
  screenshots?: Screenshot[];
  reviews?: Review[];
}

export interface Screenshot {
  id: string;
  app_id: string;
  image_url: string;
  created_at: string;
}

export interface Review {
  id: string;
  app_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user?: Profile;
}

export interface Comment {
  id: string;
  app_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  user?: Profile;
  replies?: Comment[];
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Like {
  id: string;
  user_id: string;
  app_id: string;
  created_at: string;
}

export interface Download {
  id: string;
  user_id: string | null;
  app_id: string;
  created_at: string;
  app?: App;
}

export interface Favorite {
  id: string;
  user_id: string;
  app_id: string;
  created_at: string;
  app?: App;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  data: Record<string, any>;
  created_at: string;
}

export interface Report {
  id: string;
  user_id: string | null;
  app_id: string;
  reason: string;
  details: string | null;
  status: 'pending' | 'resolved';
  created_at: string;
  app?: App;
  user?: Profile;
}

export interface Badge {
  id: string;
  user_id: string;
  badge_type: string;
  awarded_at: string;
}

export interface FeaturedBanner {
  id: string;
  featured_app_id: string | null;
  background_image: string | null;
  mobile_background_image: string | null;
  custom_title: string | null;
  custom_description: string | null;
  button_text: string;
  button_url: string | null;
  is_editors_choice: boolean;
  is_trending: boolean;
  is_verified_dev: boolean;
  is_active: boolean;
  scheduled_start: string | null;
  scheduled_end: string | null;
  updated_at: string;
  // Relations
  featured_app?: App;
}

