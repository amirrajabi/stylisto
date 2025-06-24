/*
  # Create Saved Outfits Table

  1. New Tables
    - `saved_outfits`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `name` (text, required)
      - `occasions` (text array)
      - `seasons` (text array)
      - `tags` (text array)
      - `is_favorite` (boolean, default false)
      - `times_worn` (integer, default 0)
      - `last_worn` (timestamp, nullable)
      - `notes` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `deleted_at` (timestamp, nullable)

    - `outfit_items` (junction table)
      - `id` (uuid, primary key)
      - `outfit_id` (uuid, foreign key to saved_outfits)
      - `clothing_item_id` (uuid, foreign key to clothing_items)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for users to manage their own outfits
*/

CREATE TABLE IF NOT EXISTS saved_outfits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  occasions occasion_type[] DEFAULT '{}',
  seasons season_type[] DEFAULT '{}',
  tags text[] DEFAULT '{}',
  is_favorite boolean DEFAULT false,
  times_worn integer DEFAULT 0 CHECK (times_worn >= 0),
  last_worn timestamptz,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS outfit_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outfit_id uuid NOT NULL REFERENCES saved_outfits(id) ON DELETE CASCADE,
  clothing_item_id uuid NOT NULL REFERENCES clothing_items(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(outfit_id, clothing_item_id)
);

-- Enable RLS
ALTER TABLE saved_outfits ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfit_items ENABLE ROW LEVEL SECURITY;

-- Policies for saved_outfits
CREATE POLICY "Users can read own saved outfits"
  ON saved_outfits
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert own saved outfits"
  ON saved_outfits
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved outfits"
  ON saved_outfits
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved outfits"
  ON saved_outfits
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for outfit_items
CREATE POLICY "Users can read own outfit items"
  ON outfit_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM saved_outfits so 
      WHERE so.id = outfit_items.outfit_id 
      AND so.user_id = auth.uid()
      AND so.deleted_at IS NULL
    )
  );

CREATE POLICY "Users can insert own outfit items"
  ON outfit_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM saved_outfits so 
      WHERE so.id = outfit_items.outfit_id 
      AND so.user_id = auth.uid()
    )
    AND
    EXISTS (
      SELECT 1 FROM clothing_items ci 
      WHERE ci.id = outfit_items.clothing_item_id 
      AND ci.user_id = auth.uid()
      AND ci.deleted_at IS NULL
    )
  );

CREATE POLICY "Users can delete own outfit items"
  ON outfit_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM saved_outfits so 
      WHERE so.id = outfit_items.outfit_id 
      AND so.user_id = auth.uid()
    )
  );

-- Create updated_at trigger
CREATE TRIGGER update_saved_outfits_updated_at
  BEFORE UPDATE ON saved_outfits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_outfits_user_id ON saved_outfits(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_saved_outfits_is_favorite ON saved_outfits(is_favorite) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_saved_outfits_occasions ON saved_outfits USING GIN(occasions) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_saved_outfits_seasons ON saved_outfits USING GIN(seasons) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_saved_outfits_tags ON saved_outfits USING GIN(tags) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_saved_outfits_deleted_at ON saved_outfits(deleted_at);
CREATE INDEX IF NOT EXISTS idx_saved_outfits_created_at ON saved_outfits(created_at DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_outfit_items_outfit_id ON outfit_items(outfit_id);
CREATE INDEX IF NOT EXISTS idx_outfit_items_clothing_item_id ON outfit_items(clothing_item_id);