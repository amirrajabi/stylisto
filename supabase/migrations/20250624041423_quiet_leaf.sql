/*
  # Create Clothing Items Table

  1. New Tables
    - `clothing_items`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `name` (text, required)
      - `category` (text, required)
      - `subcategory` (text, optional)
      - `color` (text, required)
      - `brand` (text, optional)
      - `size` (text, optional)
      - `seasons` (text array)
      - `occasions` (text array)
      - `image_url` (text, required)
      - `tags` (text array)
      - `is_favorite` (boolean, default false)
      - `last_worn` (timestamp, nullable)
      - `times_worn` (integer, default 0)
      - `purchase_date` (date, nullable)
      - `price` (decimal, nullable)
      - `notes` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `deleted_at` (timestamp, nullable)

  2. Security
    - Enable RLS on `clothing_items` table
    - Add policies for users to manage their own items
*/

-- Create enum types for better data integrity
CREATE TYPE clothing_category AS ENUM (
  'tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 
  'accessories', 'underwear', 'activewear', 'sleepwear', 'swimwear'
);

CREATE TYPE season_type AS ENUM ('spring', 'summer', 'fall', 'winter');
CREATE TYPE occasion_type AS ENUM (
  'casual', 'work', 'formal', 'party', 'sport', 'travel', 'date', 'special'
);

CREATE TABLE IF NOT EXISTS clothing_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  category clothing_category NOT NULL,
  subcategory text,
  color text NOT NULL,
  brand text,
  size text,
  seasons season_type[] DEFAULT '{}',
  occasions occasion_type[] DEFAULT '{}',
  image_url text NOT NULL,
  tags text[] DEFAULT '{}',
  is_favorite boolean DEFAULT false,
  last_worn timestamptz,
  times_worn integer DEFAULT 0 CHECK (times_worn >= 0),
  purchase_date date,
  price decimal(10,2) CHECK (price >= 0),
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz
);

-- Enable RLS
ALTER TABLE clothing_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own clothing items"
  ON clothing_items
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert own clothing items"
  ON clothing_items
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clothing items"
  ON clothing_items
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own clothing items"
  ON clothing_items
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_clothing_items_updated_at
  BEFORE UPDATE ON clothing_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_clothing_items_user_id ON clothing_items(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_clothing_items_category ON clothing_items(category) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_clothing_items_is_favorite ON clothing_items(is_favorite) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_clothing_items_seasons ON clothing_items USING GIN(seasons) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_clothing_items_occasions ON clothing_items USING GIN(occasions) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_clothing_items_tags ON clothing_items USING GIN(tags) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_clothing_items_deleted_at ON clothing_items(deleted_at);
CREATE INDEX IF NOT EXISTS idx_clothing_items_created_at ON clothing_items(created_at DESC) WHERE deleted_at IS NULL;