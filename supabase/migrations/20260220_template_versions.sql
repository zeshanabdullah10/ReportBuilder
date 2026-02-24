-- Migration: template_versions
-- Description: Adds version history support for templates
-- Date: 2026-02-20

-- Create template_versions table
CREATE TABLE IF NOT EXISTS template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  canvas_state JSONB NOT NULL,
  sample_data JSONB,
  settings JSONB,
  change_description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(template_id, version_number)
);

-- Index for fast version lookups
CREATE INDEX IF NOT EXISTS idx_template_versions_template ON template_versions(template_id);
CREATE INDEX IF NOT EXISTS idx_template_versions_created ON template_versions(created_at DESC);

-- Function to auto-create version on template update
CREATE OR REPLACE FUNCTION create_template_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create version if canvas_state actually changed
  IF OLD.canvas_state IS DISTINCT FROM NEW.canvas_state THEN
    INSERT INTO template_versions (template_id, version_number, canvas_state, sample_data, settings, created_by)
    VALUES (
      NEW.id,
      COALESCE((SELECT MAX(version_number) FROM template_versions WHERE template_id = NEW.id), 0) + 1,
      NEW.canvas_state,
      NEW.sample_data,
      NEW.settings,
      NEW.user_id
    );
    
    -- Update the version number on the template
    NEW.version := COALESCE((SELECT MAX(version_number) FROM template_versions WHERE template_id = NEW.id), NEW.version);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create version on template update
DROP TRIGGER IF EXISTS template_version_trigger ON templates;
CREATE TRIGGER template_version_trigger
  BEFORE UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION create_template_version();

-- Enable RLS on template_versions
ALTER TABLE template_versions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view versions of their own templates
CREATE POLICY "Users can view versions of their own templates"
  ON template_versions FOR SELECT
  USING (
    template_id IN (SELECT id FROM templates WHERE user_id = auth.uid())
  );

-- Policy: Users can insert versions for their own templates (handled by trigger, but allow explicit)
CREATE POLICY "Users can insert versions for their own templates"
  ON template_versions FOR INSERT
  WITH CHECK (
    template_id IN (SELECT id FROM templates WHERE user_id = auth.uid())
  );

-- Policy: Users can delete versions of their own templates
CREATE POLICY "Users can delete versions of their own templates"
  ON template_versions FOR DELETE
  USING (
    template_id IN (SELECT id FROM templates WHERE user_id = auth.uid())
  );

-- Add comments for documentation
COMMENT ON TABLE template_versions IS 'Stores version history for templates, allowing rollback to previous states';
COMMENT ON COLUMN template_versions.version_number IS 'Sequential version number, unique per template';
COMMENT ON COLUMN template_versions.change_description IS 'Optional description of what changed in this version';
COMMENT ON COLUMN template_versions.created_by IS 'User who created this version (usually the template owner)';
