CREATE TABLE activation_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text UNIQUE NOT NULL,
  used boolean DEFAULT false,
  used_by uuid REFERENCES auth.users(id),
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activation_codes ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read codes (to verify a code and check their own activation status)
CREATE POLICY "Authenticated users can read activation codes"
  ON activation_codes FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can claim an unused code (only if it is currently unused, and they set used_by to themselves)
CREATE POLICY "Authenticated users can claim unused codes"
  ON activation_codes FOR UPDATE
  TO authenticated
  USING (used = false)
  WITH CHECK (used_by = auth.uid() AND used = true);
