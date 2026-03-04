-- Allow insert/update so the seed script (using anon or service_role key) can upsert records.
-- Run this in Supabase SQL Editor if you get "new row violates row-level security" when seeding.

CREATE POLICY "Allow insert for records" ON records
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update for records" ON records
  FOR UPDATE USING (true);
