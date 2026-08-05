-- 1. Storage: owner-scoped avatar policies
DROP POLICY IF EXISTS "Avatar reads allowed" ON storage.objects;
DROP POLICY IF EXISTS "Avatar uploads allowed" ON storage.objects;

CREATE POLICY "Avatar owner read"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Avatar owner insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Avatar owner update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Avatar owner delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 2. Revoke direct EXECUTE on privileged SECURITY DEFINER helpers
REVOKE ALL ON FUNCTION public.community_bump_points(uuid, integer) FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.after_community_post_insert() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.after_community_thread_insert() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.after_community_vote_change() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.on_community_post_insert() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.on_community_thread_insert() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.handle_new_community_user() FROM anon, authenticated, public;