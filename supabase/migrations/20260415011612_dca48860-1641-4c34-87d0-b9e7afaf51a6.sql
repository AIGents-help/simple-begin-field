
CREATE TABLE IF NOT EXISTS trusted_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  packet_id UUID NOT NULL REFERENCES packets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  relationship TEXT,
  access_level TEXT DEFAULT 'full' CHECK (access_level IN ('full', 'limited')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  notify_on TEXT DEFAULT 'manual' CHECK (notify_on IN ('manual', 'immediate')),
  access_granted BOOLEAN DEFAULT false,
  access_granted_at TIMESTAMPTZ,
  invite_token TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  invite_sent_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE trusted_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trusted contacts"
ON trusted_contacts FOR SELECT
USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Users can insert own trusted contacts"
ON trusted_contacts FOR INSERT
WITH CHECK (user_id = auth.uid() OR is_admin());

CREATE POLICY "Users can update own trusted contacts"
ON trusted_contacts FOR UPDATE
USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Users can delete own trusted contacts"
ON trusted_contacts FOR DELETE
USING (user_id = auth.uid() OR is_admin());

CREATE INDEX idx_trusted_contacts_user ON trusted_contacts(user_id);
CREATE INDEX idx_trusted_contacts_packet ON trusted_contacts(packet_id);
