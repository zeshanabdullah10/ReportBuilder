-- Migration: template_shares
-- Description: Adds template sharing support
-- Date: 2026-02-20

-- Create template_shares table
CREATE TABLE IF NOT EXISTS template_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  share_type TEXT NOT NULL CHECK (share_type IN ('link', 'user', 'org')),
  share_token TEXT UNIQUE,
  shared_with_email TEXT,
  organization_id UUID,
  permission TEXT NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'edit')),
  password_hash TEXT,
  expires_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_template_shares_template ON template_shares(template_id);
CREATE INDEX IF NOT EXISTS idx_template_shares_token ON template_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_template_shares_email ON template_shares(shared_with_email);

-- Function to generate unique share token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TEXT AS $$
DECLARE
  token TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 12-character token
    token := encode(gen_random_bytes(9), 'base64');
    -- Make it URL-safe
    token := replace(replace(token, '+', '-'), '/', '_');
    token := replace(token, '=', '');
    
    -- Check if it already exists
    SELECT EXISTS(SELECT 1 FROM template_shares WHERE share_token = token) INTO exists;
    
    EXIT WHEN NOT exists;
  END LOOP;
  
  RETURN token;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate share token for link shares
CREATE OR REPLACE FUNCTION set_share_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.share_type = 'link' AND NEW.share_token IS NULL THEN
    NEW.share_token := generate_share_token();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS template_shares_token_trigger ON template_shares;
CREATE TRIGGER template_shares_token_trigger
  BEFORE INSERT ON template_shares
  FOR EACH ROW
  EXECUTE FUNCTION set_share_token();

-- Enable RLS on template_shares
ALTER TABLE template_shares ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view shares for their own templates
CREATE POLICY "Users can view shares for their own templates"
  ON template_shares FOR SELECT
  USING (
    template_id IN (SELECT id FROM templates WHERE user_id = auth.uid())
  );

-- Policy: Users can view shares shared with them
CREATE POLICY "Users can view shares shared with their email"
  ON template_shares FOR SELECT
  USING (
    shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Policy: Users can create shares for their own templates
CREATE POLICY "Users can create shares for their own templates"
  ON template_shares FOR INSERT
  WITH CHECK (
    template_id IN (SELECT id FROM templates WHERE user_id = auth.uid())
  );

-- Policy: Users can delete shares for their own templates
CREATE POLICY "Users can delete shares for their own templates"
  ON template_shares FOR DELETE
  USING (
    template_id IN (SELECT id FROM templates WHERE user_id = auth.uid())
  );

-- Policy: Allow access via share token (for public link sharing)
CREATE POLICY "Public access via share token"
  ON template_shares FOR SELECT
  USING (
    share_token IS NOT NULL 
    AND share_type = 'link'
    AND (expires_at IS NULL OR expires_at > NOW())
  );

-- Add is_shared column to templates if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'is_shared') THEN
    ALTER TABLE templates ADD COLUMN is_shared BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Comments for documentation
COMMENT ON TABLE template_shares IS 'Stores sharing configuration for templates';
COMMENT ON COLUMN template_shares.share_type IS 'Type of sharing: link (public URL), user (specific email), org (organization)';
COMMENT ON COLUMN template_shares.share_token IS 'Unique token for link-based sharing';
COMMENT ON COLUMN template_shares.permission IS 'Permission level: view (read-only) or edit (full access)';
COMMENT ON COLUMN template_shares.password_hash IS 'Optional bcrypt hash for password-protected shares';
COMMENT ON COLUMN template_shares.expires_at IS 'Optional expiration date for the share';
