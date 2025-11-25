-- World Mapping of Authenticity Database Schema
-- Run this SQL in your Supabase SQL editor

-- Create the submissions table
CREATE TABLE submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  location_name TEXT NOT NULL,
  voice_url TEXT,
  voice_embedding FLOAT8[],  -- Added: Store voice embedding vector for matching
  voice_language TEXT,        -- Added: Store detected language
  image_url TEXT,
  recipe_text TEXT,
  recipe_audio_url TEXT,
  user_name TEXT,
  user_email TEXT
);

-- Create indexes for better performance
CREATE INDEX idx_submissions_location ON submissions(latitude, longitude);
CREATE INDEX idx_submissions_created_at ON submissions(created_at);
CREATE INDEX idx_submissions_location_name ON submissions(location_name);
CREATE INDEX idx_submissions_voice_language ON submissions(voice_language);  -- Added: Index for language filtering

-- Enable Row Level Security (RLS)
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to read submissions
CREATE POLICY "Allow public read access" ON submissions
  FOR SELECT USING (true);

-- Create a policy that allows anyone to insert submissions
CREATE POLICY "Allow public insert access" ON submissions
  FOR INSERT WITH CHECK (true);

-- Optional: Create a policy that allows users to update their own submissions
-- (You'll need to implement user authentication for this to work)
-- CREATE POLICY "Allow users to update own submissions" ON submissions
--   FOR UPDATE USING (auth.uid()::text = user_email);

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('voice-recordings', 'voice-recordings', true),
  ('images', 'images', true),
  ('recipe-audio', 'recipe-audio', true);

-- Set up storage policies to allow public uploads
CREATE POLICY "Allow public uploads to voice-recordings" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'voice-recordings');

CREATE POLICY "Allow public uploads to images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'images');

CREATE POLICY "Allow public uploads to recipe-audio" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'recipe-audio');

-- Allow public access to view uploaded files
CREATE POLICY "Allow public access to voice-recordings" ON storage.objects
  FOR SELECT USING (bucket_id = 'voice-recordings');

CREATE POLICY "Allow public access to images" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Allow public access to recipe-audio" ON storage.objects
  FOR SELECT USING (bucket_id = 'recipe-audio');

