
-- ============ ENUMS ============
CREATE TYPE public.community_role AS ENUM ('member', 'moderator', 'admin');
CREATE TYPE public.community_vote_target AS ENUM ('thread', 'post');
CREATE TYPE public.community_report_target AS ENUM ('thread', 'post', 'user');

-- ============ PROFILES ============
CREATE TABLE public.community_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  signature TEXT,
  points INT NOT NULL DEFAULT 0,
  rank TEXT NOT NULL DEFAULT 'Newbie',
  thread_count INT NOT NULL DEFAULT 0,
  post_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_profiles TO authenticated;
GRANT SELECT ON public.community_profiles TO anon;
GRANT ALL ON public.community_profiles TO service_role;
ALTER TABLE public.community_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are publicly readable" ON public.community_profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.community_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.community_profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============ USER ROLES ============
CREATE TABLE public.community_user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.community_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.community_user_roles TO authenticated;
GRANT ALL ON public.community_user_roles TO service_role;
ALTER TABLE public.community_user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own roles" ON public.community_user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_community_role(_user_id UUID, _role public.community_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.community_user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_community_mod(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.community_user_roles WHERE user_id = _user_id AND role IN ('moderator','admin'));
$$;

-- ============ CATEGORIES ============
CREATE TABLE public.community_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  thread_count INT NOT NULL DEFAULT 0,
  post_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.community_categories TO anon, authenticated;
GRANT ALL ON public.community_categories TO service_role;
ALTER TABLE public.community_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are public" ON public.community_categories FOR SELECT USING (true);
CREATE POLICY "Admins manage categories" ON public.community_categories FOR ALL TO authenticated
  USING (public.has_community_role(auth.uid(),'admin'))
  WITH CHECK (public.has_community_role(auth.uid(),'admin'));

-- ============ THREADS ============
CREATE TABLE public.community_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.community_categories(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  body_md TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  view_count INT NOT NULL DEFAULT 0,
  reply_count INT NOT NULL DEFAULT 0,
  score INT NOT NULL DEFAULT 0,
  last_reply_at TIMESTAMPTZ,
  last_reply_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  search_tsv TSVECTOR
);
CREATE INDEX idx_threads_category ON public.community_threads(category_id, is_pinned DESC, last_reply_at DESC NULLS LAST, created_at DESC);
CREATE INDEX idx_threads_author ON public.community_threads(author_id);
CREATE INDEX idx_threads_search ON public.community_threads USING GIN(search_tsv);
GRANT SELECT ON public.community_threads TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.community_threads TO authenticated;
GRANT ALL ON public.community_threads TO service_role;
ALTER TABLE public.community_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Threads public read" ON public.community_threads FOR SELECT USING (true);
CREATE POLICY "Members create threads" ON public.community_threads FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Author or mod update thread" ON public.community_threads FOR UPDATE TO authenticated
  USING (auth.uid() = author_id OR public.is_community_mod(auth.uid()))
  WITH CHECK (auth.uid() = author_id OR public.is_community_mod(auth.uid()));
CREATE POLICY "Author or mod delete thread" ON public.community_threads FOR DELETE TO authenticated
  USING (auth.uid() = author_id OR public.is_community_mod(auth.uid()));

-- ============ POSTS ============
CREATE TABLE public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.community_threads(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.community_posts(id) ON DELETE SET NULL,
  body_md TEXT NOT NULL,
  score INT NOT NULL DEFAULT 0,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  edited_at TIMESTAMPTZ,
  search_tsv TSVECTOR
);
CREATE INDEX idx_posts_thread ON public.community_posts(thread_id, created_at);
CREATE INDEX idx_posts_author ON public.community_posts(author_id);
CREATE INDEX idx_posts_search ON public.community_posts USING GIN(search_tsv);
GRANT SELECT ON public.community_posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.community_posts TO authenticated;
GRANT ALL ON public.community_posts TO service_role;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Posts public read" ON public.community_posts FOR SELECT USING (true);
CREATE POLICY "Members create posts" ON public.community_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Author or mod update post" ON public.community_posts FOR UPDATE TO authenticated
  USING (auth.uid() = author_id OR public.is_community_mod(auth.uid()))
  WITH CHECK (auth.uid() = author_id OR public.is_community_mod(auth.uid()));
CREATE POLICY "Author or mod delete post" ON public.community_posts FOR DELETE TO authenticated
  USING (auth.uid() = author_id OR public.is_community_mod(auth.uid()));

-- ============ VOTES ============
CREATE TABLE public.community_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type public.community_vote_target NOT NULL,
  target_id UUID NOT NULL,
  value SMALLINT NOT NULL CHECK (value IN (-1, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_type, target_id)
);
CREATE INDEX idx_votes_target ON public.community_votes(target_type, target_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_votes TO authenticated;
GRANT ALL ON public.community_votes TO service_role;
ALTER TABLE public.community_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own votes" ON public.community_votes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users manage own votes" ON public.community_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own votes" ON public.community_votes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own votes" ON public.community_votes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ NOTIFICATIONS ============
CREATE TABLE public.community_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notif_user ON public.community_notifications(user_id, is_read, created_at DESC);
GRANT SELECT, UPDATE ON public.community_notifications TO authenticated;
GRANT ALL ON public.community_notifications TO service_role;
ALTER TABLE public.community_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own notifications" ON public.community_notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.community_notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ REPORTS ============
CREATE TABLE public.community_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type public.community_report_target NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.community_reports TO authenticated;
GRANT ALL ON public.community_reports TO service_role;
ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reporter or mod read reports" ON public.community_reports FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id OR public.is_community_mod(auth.uid()));
CREATE POLICY "Members create reports" ON public.community_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Mods update reports" ON public.community_reports FOR UPDATE TO authenticated
  USING (public.is_community_mod(auth.uid())) WITH CHECK (public.is_community_mod(auth.uid()));

-- ============ RANK FUNCTION ============
CREATE OR REPLACE FUNCTION public.compute_community_rank(_pts INT)
RETURNS TEXT LANGUAGE SQL IMMUTABLE AS $$
  SELECT CASE
    WHEN _pts >= 3000 THEN 'Legend'
    WHEN _pts >= 1000 THEN 'Expert'
    WHEN _pts >= 300 THEN 'Veteran'
    WHEN _pts >= 100 THEN 'Regular'
    WHEN _pts >= 25 THEN 'Contributor'
    ELSE 'Newbie'
  END
$$;

-- ============ POINTS + COUNTERS ============
CREATE OR REPLACE FUNCTION public.community_bump_points(_user UUID, _delta INT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.community_profiles
  SET points = GREATEST(points + _delta, 0),
      rank = public.compute_community_rank(GREATEST(points + _delta, 0)),
      updated_at = now()
  WHERE id = _user;
END;
$$;

-- Thread insert trigger: bump author points + category counter
CREATE OR REPLACE FUNCTION public.on_community_thread_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.search_tsv := to_tsvector('simple', coalesce(NEW.title,'') || ' ' || coalesce(NEW.body_md,''));
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_thread_tsv BEFORE INSERT OR UPDATE ON public.community_threads
FOR EACH ROW EXECUTE FUNCTION public.on_community_thread_insert();

CREATE OR REPLACE FUNCTION public.after_community_thread_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.community_categories SET thread_count = thread_count + 1 WHERE id = NEW.category_id;
  UPDATE public.community_profiles SET thread_count = thread_count + 1 WHERE id = NEW.author_id;
  PERFORM public.community_bump_points(NEW.author_id, 2);
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_thread_after_insert AFTER INSERT ON public.community_threads
FOR EACH ROW EXECUTE FUNCTION public.after_community_thread_insert();

-- Post insert trigger
CREATE OR REPLACE FUNCTION public.on_community_post_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.search_tsv := to_tsvector('simple', coalesce(NEW.body_md,''));
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_post_tsv BEFORE INSERT OR UPDATE ON public.community_posts
FOR EACH ROW EXECUTE FUNCTION public.on_community_post_insert();

CREATE OR REPLACE FUNCTION public.after_community_post_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _thread public.community_threads%ROWTYPE;
BEGIN
  SELECT * INTO _thread FROM public.community_threads WHERE id = NEW.thread_id;
  UPDATE public.community_threads
    SET reply_count = reply_count + 1,
        last_reply_at = NEW.created_at,
        last_reply_by = NEW.author_id,
        updated_at = now()
    WHERE id = NEW.thread_id;
  UPDATE public.community_categories SET post_count = post_count + 1 WHERE id = _thread.category_id;
  UPDATE public.community_profiles SET post_count = post_count + 1 WHERE id = NEW.author_id;
  PERFORM public.community_bump_points(NEW.author_id, 1);
  -- Notify thread author on reply (not for self-reply)
  IF _thread.author_id IS NOT NULL AND _thread.author_id <> NEW.author_id THEN
    INSERT INTO public.community_notifications(user_id, type, payload)
    VALUES (
      _thread.author_id,
      'reply',
      jsonb_build_object('thread_id', _thread.id, 'thread_title', _thread.title, 'post_id', NEW.id, 'author_id', NEW.author_id)
    );
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_post_after_insert AFTER INSERT ON public.community_posts
FOR EACH ROW EXECUTE FUNCTION public.after_community_post_insert();

-- Vote triggers: adjust target score + author points
CREATE OR REPLACE FUNCTION public.after_community_vote_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _delta INT;
  _author UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    _delta := NEW.value;
    IF NEW.target_type = 'thread' THEN
      UPDATE public.community_threads SET score = score + _delta WHERE id = NEW.target_id RETURNING author_id INTO _author;
    ELSE
      UPDATE public.community_posts SET score = score + _delta WHERE id = NEW.target_id RETURNING author_id INTO _author;
    END IF;
    IF _author IS NOT NULL AND _author <> NEW.user_id THEN
      PERFORM public.community_bump_points(_author, CASE WHEN _delta = 1 THEN 2 ELSE -1 END);
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    _delta := NEW.value - OLD.value;
    IF _delta <> 0 THEN
      IF NEW.target_type = 'thread' THEN
        UPDATE public.community_threads SET score = score + _delta WHERE id = NEW.target_id RETURNING author_id INTO _author;
      ELSE
        UPDATE public.community_posts SET score = score + _delta WHERE id = NEW.target_id RETURNING author_id INTO _author;
      END IF;
      IF _author IS NOT NULL AND _author <> NEW.user_id THEN
        PERFORM public.community_bump_points(_author, _delta * (CASE WHEN _delta > 0 THEN 2 ELSE 1 END));
      END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    _delta := -OLD.value;
    IF OLD.target_type = 'thread' THEN
      UPDATE public.community_threads SET score = score + _delta WHERE id = OLD.target_id RETURNING author_id INTO _author;
    ELSE
      UPDATE public.community_posts SET score = score + _delta WHERE id = OLD.target_id RETURNING author_id INTO _author;
    END IF;
    IF _author IS NOT NULL AND _author <> OLD.user_id THEN
      PERFORM public.community_bump_points(_author, CASE WHEN OLD.value = 1 THEN -2 ELSE 1 END);
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;
CREATE TRIGGER trg_vote_change
AFTER INSERT OR UPDATE OR DELETE ON public.community_votes
FOR EACH ROW EXECUTE FUNCTION public.after_community_vote_change();

-- Auto-create profile on signup with a placeholder username
CREATE OR REPLACE FUNCTION public.handle_new_community_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _base TEXT;
  _candidate TEXT;
  _i INT := 0;
BEGIN
  _base := lower(regexp_replace(coalesce(split_part(NEW.email, '@', 1), 'user'), '[^a-z0-9]+', '', 'g'));
  IF length(_base) < 3 THEN _base := 'user' || substr(NEW.id::text, 1, 6); END IF;
  _candidate := _base;
  WHILE EXISTS (SELECT 1 FROM public.community_profiles WHERE username = _candidate) LOOP
    _i := _i + 1;
    _candidate := _base || _i;
  END LOOP;
  INSERT INTO public.community_profiles(id, username, display_name)
  VALUES (NEW.id, _candidate, coalesce(NEW.raw_user_meta_data->>'display_name', _candidate));
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created_community
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_community_user();

-- ============ SEED CATEGORIES ============
INSERT INTO public.community_categories(slug, name, description, icon, sort_order) VALUES
  ('general', 'General Discussion', 'Say hi, introduce yourself, and chat about anything Find-Task related.', 'MessageSquare', 1),
  ('making-money', 'Making Money', 'Share strategies, gig ideas, and side hustles to earn more on Find-Task.', 'TrendingUp', 2),
  ('task-tips', 'Task Tips', 'Post-your-task best practices, pricing advice, and how-to guides.', 'Lightbulb', 3),
  ('tech', 'Tech Talk', 'Talk about tools, apps, phones, laptops, and anything tech.', 'Cpu', 4),
  ('off-topic', 'Off-Topic', 'Everything else — sports, music, food, and casual chat.', 'Coffee', 5),
  ('support', 'Support & Feedback', 'Report bugs, request features, and get help from the team.', 'LifeBuoy', 6);
