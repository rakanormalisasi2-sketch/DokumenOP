-- Jalankan script ini di Supabase SQL Editor untuk memperbarui aturan RLS (Row Level Security)
-- Perbaikan ini memungkinkan Responden untuk mengajukan perubahan pada dokumen yang sudah disetujui.

DROP POLICY IF EXISTS "submissions_respondent_update_own" ON submissions;

CREATE POLICY "submissions_respondent_update_own"
ON submissions FOR UPDATE
TO authenticated
USING (
  (auth.jwt() ->> 'role')::text = 'respondent'
  AND respondent_id = auth.uid()::text
);
