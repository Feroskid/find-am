CREATE TABLE public.community_mod_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_username text NOT NULL,
  actor_display text,
  actor_level text,
  actor_roles text[] NOT NULL DEFAULT '{}',
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  target_username text,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- All reads/writes go through server functions using the service role.
GRANT ALL ON public.community_mod_actions TO service_role;

ALTER TABLE public.community_mod_actions ENABLE ROW LEVEL SECURITY;

CREATE INDEX community_mod_actions_created_at_idx ON public.community_mod_actions (created_at DESC);
CREATE INDEX community_mod_actions_actor_idx ON public.community_mod_actions (actor_username);
