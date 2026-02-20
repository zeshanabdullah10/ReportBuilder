-- Custom Components Migration
-- Allows users to save and reuse component configurations

-- Create custom_components table
CREATE TABLE IF NOT EXISTS public.custom_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'custom',
  component_type TEXT NOT NULL, -- The base component type (Text, Container, etc.)
  config JSONB NOT NULL, -- The component's props and settings
  thumbnail_url TEXT, -- Optional thumbnail image
  is_public BOOLEAN DEFAULT FALSE, -- Whether visible to other users
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_component_type CHECK (
    component_type IN ('Text', 'Container', 'Image', 'Table', 'Chart', 'Spacer', 
                       'PageBreak', 'Indicator', 'Divider', 'PageNumber', 
                       'DateTime', 'Gauge', 'ProgressBar', 'BulletList')
  )
);

-- Create index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_custom_components_user_id ON public.custom_components(user_id);

-- Create index for public components
CREATE INDEX IF NOT EXISTS idx_custom_components_is_public ON public.custom_components(is_public) WHERE is_public = TRUE;

-- Create index for component type
CREATE INDEX IF NOT EXISTS idx_custom_components_type ON public.custom_components(component_type);

-- Create index for category
CREATE INDEX IF NOT EXISTS idx_custom_components_category ON public.custom_components(category);

-- Enable RLS
ALTER TABLE public.custom_components ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own custom components
CREATE POLICY "Users can view own custom components"
  ON public.custom_components FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can view public custom components from others
CREATE POLICY "Users can view public custom components"
  ON public.custom_components FOR SELECT
  USING (is_public = TRUE);

-- Policy: Users can insert their own custom components
CREATE POLICY "Users can insert own custom components"
  ON public.custom_components FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own custom components
CREATE POLICY "Users can update own custom components"
  ON public.custom_components FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own custom components
CREATE POLICY "Users can delete own custom components"
  ON public.custom_components FOR DELETE
  USING (auth.uid() = user_id);

-- Function to increment usage count
CREATE OR REPLACE FUNCTION increment_component_usage(component_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.custom_components
  SET usage_count = usage_count + 1
  WHERE id = component_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_custom_components_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS trigger_custom_components_updated_at ON public.custom_components;
CREATE TRIGGER trigger_custom_components_updated_at
  BEFORE UPDATE ON public.custom_components
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_components_updated_at();

-- Add comment
COMMENT ON TABLE public.custom_components IS 'Stores user-created reusable component configurations';
COMMENT ON COLUMN public.custom_components.config IS 'JSON object containing component props and nested structure';
COMMENT ON COLUMN public.custom_components.component_type IS 'The base component type this custom component is based on';
