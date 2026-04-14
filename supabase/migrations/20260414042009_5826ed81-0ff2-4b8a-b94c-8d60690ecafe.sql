
-- Add status column to affiliate_referrals
ALTER TABLE public.affiliate_referrals 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

-- Set existing rows to approved
UPDATE public.affiliate_referrals SET status = 'approved' WHERE status = 'pending';

-- Allow any authenticated user to insert an affiliate application (self-service signup)
CREATE POLICY "Authenticated users can apply as affiliate"
ON public.affiliate_referrals
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid() AND status = 'pending');
