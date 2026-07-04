
REVOKE EXECUTE ON FUNCTION public.has_community_role(UUID, public.community_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_community_mod(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.community_bump_points(UUID, INT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_community_thread_insert() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.after_community_thread_insert() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_community_post_insert() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.after_community_post_insert() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.after_community_vote_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_community_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_community_role(UUID, public.community_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_community_mod(UUID) TO authenticated, service_role;
