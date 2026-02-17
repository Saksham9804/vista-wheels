
-- Allow anyone to view approved partners (limited fields via query, but policy allows SELECT)
-- This is needed so unauthenticated users can search for partners by city on the vehicles page
CREATE POLICY "Anyone can view approved partners"
  ON public.partners
  FOR SELECT
  USING (status = 'approved');
