/*
  # Add Page Background Images Feature

  ## Overview
  This migration adds support for customizable background images on various pages throughout the application.
  Users can upload their own images or select from a default gallery to personalize their experience.

  ## New Tables

  ### `page_backgrounds`
  Stores user-specific background image configurations for different pages.

  - `id` (uuid, primary key) - Unique identifier for each background configuration
  - `user_id` (uuid, foreign key) - References the user who owns this background
  - `organization_id` (uuid, foreign key) - References the user's organization
  - `page_identifier` (text) - Unique identifier for the page (e.g., 'weekly-reflection', 'life-plan', 'goals')
  - `image_url` (text) - URL of the background image (either external URL or Supabase storage URL)
  - `image_position` (text) - CSS background-position value (default: 'center')
  - `overlay_opacity` (numeric) - Opacity of the dark overlay for text readability (0.0 to 1.0, default: 0.5)
  - `is_active` (boolean) - Whether this background is currently active for the page
  - `created_at` (timestamptz) - When the background was created
  - `updated_at` (timestamptz) - When the background was last updated

  ## Storage

  Creates a storage bucket named `page-backgrounds` for storing user-uploaded background images.

  ## Security

  - Enable RLS on `page_backgrounds` table
  - Users can only view, create, update, and delete their own backgrounds
  - Storage bucket policies allow authenticated users to upload and manage their own images

  ## Indexes

  - Index on `user_id` and `page_identifier` for efficient querying
  - Index on `is_active` for filtering active backgrounds
*/

-- Create the page_backgrounds table
CREATE TABLE IF NOT EXISTS page_backgrounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  page_identifier text NOT NULL,
  image_url text NOT NULL,
  image_position text DEFAULT 'center',
  overlay_opacity numeric DEFAULT 0.5 CHECK (overlay_opacity >= 0 AND overlay_opacity <= 1),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_page_backgrounds_user_page ON page_backgrounds(user_id, page_identifier);
CREATE INDEX IF NOT EXISTS idx_page_backgrounds_active ON page_backgrounds(is_active);

-- Enable RLS
ALTER TABLE page_backgrounds ENABLE ROW LEVEL SECURITY;

-- RLS Policies for page_backgrounds
CREATE POLICY "Users can view own page backgrounds"
  ON page_backgrounds
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own page backgrounds"
  ON page_backgrounds
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own page backgrounds"
  ON page_backgrounds
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own page backgrounds"
  ON page_backgrounds
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create storage bucket for page backgrounds
INSERT INTO storage.buckets (id, name, public)
VALUES ('page-backgrounds', 'page-backgrounds', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for page-backgrounds bucket
CREATE POLICY "Users can upload their own background images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'page-backgrounds' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view all background images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'page-backgrounds');

CREATE POLICY "Users can update their own background images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'page-backgrounds' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own background images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'page-backgrounds' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Add unique constraint to ensure only one active background per user per page
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_background
  ON page_backgrounds(user_id, page_identifier)
  WHERE is_active = true;
