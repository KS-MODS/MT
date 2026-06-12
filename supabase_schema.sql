-- Supabase SQL Schema for Featured Banner Management System
-- Execute this script in your Supabase SQL Editor (Dashboard > SQL Editor > New query).

CREATE TABLE IF NOT EXISTS featured_banner (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    featured_app_id uuid REFERENCES apps(id) ON DELETE CASCADE,
    background_image text,
    mobile_background_image text,
    custom_title text,
    custom_description text,
    button_text text DEFAULT 'View App Details',
    button_url text,
    is_editors_choice boolean DEFAULT false,
    is_trending boolean DEFAULT false,
    is_verified_dev boolean DEFAULT false,
    is_active boolean DEFAULT true,
    scheduled_start timestamp with time zone,
    scheduled_end timestamp with time zone,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
ALTER TABLE featured_banner ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (Read) and admin access (All)
DROP POLICY IF EXISTS "Allow public read access" ON featured_banner;
CREATE POLICY "Allow public read access" ON featured_banner 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin full access" ON featured_banner;
CREATE POLICY "Allow admin full access" ON featured_banner 
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Migration to support External Download Links in the apps table
ALTER TABLE apps ADD COLUMN IF NOT EXISTS download_type VARCHAR(50) DEFAULT 'file';
ALTER TABLE apps ADD COLUMN IF NOT EXISTS download_url TEXT NULL;
ALTER TABLE apps ADD COLUMN IF NOT EXISTS package_name VARCHAR(255) NULL;

