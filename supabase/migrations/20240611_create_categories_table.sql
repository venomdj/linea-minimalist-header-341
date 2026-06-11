-- Create categories table for dynamic category management
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_name TEXT,
  color_hex TEXT DEFAULT '#000000',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add category_id column to products table if it doesn't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- Create index on products for efficient category filtering
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- Create index on categories for efficient slug-based lookups
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- Create index for active categories display order
CREATE INDEX IF NOT EXISTS idx_categories_active_order ON categories(is_active, display_order);

-- Enable Row Level Security (RLS) on categories table
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active categories
CREATE POLICY "Allow public read access to active categories"
  ON categories FOR SELECT
  USING (is_active = true);

-- Allow authenticated admins to manage all categories (adjust based on your auth setup)
CREATE POLICY "Allow authenticated users to manage categories"
  ON categories
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Insert initial categories
INSERT INTO categories (name, slug, description, icon_name, color_hex, display_order, is_active)
VALUES 
  ('Accessories', 'accessories', 'Collectible accessories and merchandise', 'Package', '#8B5CF6', 1, true),
  ('Pokémon', 'pokemon', 'Pokémon cards, figurines, and collectibles', 'Zap', '#FBBF24', 2, true),
  ('One Piece', 'one-piece', 'One Piece anime and manga collectibles', 'Heart', '#EF4444', 3, true)
ON CONFLICT (name) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_categories_timestamp ON categories;
CREATE TRIGGER update_categories_timestamp BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_categories_updated_at();
