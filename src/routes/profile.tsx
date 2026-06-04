import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, User, MapPin, Star, Award, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { TaskHeader } from "@/components/TaskHeader";
import { useAuth } from "@/lib/auth";
import { getMe, updateProfile, getCategories } from "@/lib/findtask.functions";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Your profile — Find-task" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { token, user, setAuth } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!token) navigate({ to: "/login", search: { redirect: "/profile" } as any });
  }, [token, navigate]);

  const meFn = useServerFn(getMe);
  const updFn = useServerFn(updateProfile);
  const catsFn = useServerFn(getCategories);

  const meQ = useQuery({
    queryKey: ["me", token],
    enabled: !!token,
    queryFn: () => meFn({ data: { token: token! } }),
  });

  const catsQ = useQuery({
    queryKey: ["categories"],
    queryFn: () => catsFn({}),
    staleTime: 5 * 60_000,
  });
  const categories: any[] = catsQ.data?.ok ? (catsQ.data.data as any)?.categories ?? [] : [];

  const me: any = meQ.data?.ok ? ((meQ.data.data as any)?.user ?? meQ.data.data) : user;

  const [form, setForm] = useState({
    name: "", photo_url: "", state: "", city: "", tagline: "", about: "",
    categories: [] as number[],
  });
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (me && !loaded) {
      setForm({
        name: me.name ?? me.full_name ?? "",
        photo_url: me.photo_url ?? "",
        state: me.state ?? "",
        city: me.city ?? "",
        tagline: me.tagline ?? "",
        about: me.about ?? "",
        categories: (me.categories ?? []).map((c: any) => Number(c?.category_id ?? c)).filter(Boolean),
      });
      setLoaded(true);
    }
  }, [me, loaded]);

  const save = useMutation({
    mutationFn: () => updFn({ data: { ...form, photo_url: form.photo_url || undefined, token: token! } }),
    onSuccess: (r) => {
      if (r.ok) {
        toast.success("Profile updated.");
        const updatedUser = (r.data as any)?.user ?? r.data;
        if (updatedUser && token) setAuth({ token, user: { ...(user ?? {}), ...updatedUser } });
        meQ.refetch();
      } else toast.error(r.error);
    },
  });

  if (!token) return null;

  const employerStats = {
    posted: me?.tasks_posted ?? me?.posted_count ?? 0,
    completion: me?.completion_rate ?? null,
    rating: me?.employer_rating ?? null,
  };
  const taskerStats = {
    completed: me?.tasks_completed ?? me?.completed_count ?? 0,
    success: me?.success_rate ?? null,
    response: me?.response_rate ?? null,
    rating: me?.tasker_rating ?? null,
  };
  const memberSince = me?.created_at ?? me?.member_since;
  const verifiedPayment = !!(me?.kyc_verified ?? me?.verified_payment);
  const categoryRatings: any[] = me?.category_ratings ?? me?.ratings_by_category ?? [];
  const badges: any[] = me?.badges ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TaskHeader />
      <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-8 flex-1">
        <h1 className="text-3xl font-bold tracking-tight inline-flex items-center gap-2">
          <User className="h-7 w-7" /> Your profile
        </h1>
        <p className="mt-1 text-muted-foreground">
          One profile, used for both posting and tasking. Employers and taskers see the relevant parts.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-[1fr_320px]">
          {/* Editable form */}
          <form
            onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
            className="space-y-4 rounded-2xl border border-border bg-card p-6"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name">
                <input className="input" value={form.name} maxLength={120} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label="Photo URL">
                <input className="input" value={form.photo_url} maxLength={2048} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} placeholder="https://…" />
              </Field>
              <Field label="State">
                <input className="input" value={form.state} maxLength={80} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="e.g. Lagos" />
              </Field>
              <Field label="City">
                <input className="input" value={form.city} maxLength={80} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="e.g. Lekki" />
              </Field>
            </div>
            <Field label="Tagline (tasker)">
              <input className="input" value={form.tagline} maxLength={200} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="e.g. Professional plumber with 5 years experience" />
            </Field>
            <Field label="About">
              <textarea className="input min-h-24" value={form.about} maxLength={2000} onChange={(e) => setForm({ ...form, about: e.target.value })} placeholder="Short bio…" />
            </Field>
            <Field label="Categories you work in">
              <div className="flex flex-wrap gap-1.5">
                {categories.flatMap((c: any) => (c.subcategories ?? [{ category_id: c.category_id, category_name: c.category_name }])).map((s: any) => {
                  const on = form.categories.includes(s.category_id);
                  return (
                    <button
                      type="button"
                      key={s.category_id}
                      onClick={() =>
                        setForm({
                          ...form,
                          categories: on
                            ? form.categories.filter((x) => x !== s.category_id)
                            : [...form.categories, s.category_id],
                        })
                      }
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${on ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground"}`}
                    >
                      {s.category_name}
                    </button>
                  );
                })}
              </div>
            </Field>

            <button
              type="submit"
              disabled={save.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Save profile
            </button>
            <style>{`.input{width:100%;border:1px solid hsl(var(--border));background:transparent;border-radius:0.5rem;padding:0.55rem 0.75rem;font-size:0.875rem;outline:none}.input:focus{border-color:hsl(var(--primary))}`}</style>
          </form>

          {/* Profile summary */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5 text-center">
              {form.photo_url ? (
                <img src={form.photo_url} alt="" className="mx-auto h-20 w-20 rounded-full object-cover" />
              ) : (
                <div className="mx-auto h-20 w-20 rounded-full bg-primary/10 text-primary inline-flex items-center justify-center text-2xl font-bold">
                  {(form.name || "U").charAt(0).toUpperCase()}
                </div>
              )}
              <div className="mt-2 font-semibold">{form.name || "Unnamed"}</div>
              {(form.state || form.city) && (
                <div className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3" /> {[form.city, form.state].filter(Boolean).join(", ")}
                </div>
              )}
              {memberSince && (
                <div className="text-[11px] text-muted-foreground mt-1">
                  Member since {new Date(memberSince).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                </div>
              )}
              {verifiedPayment && (
                <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[11px] font-semibold">
                  <ShieldCheck className="h-3 w-3" /> Verified payment
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-semibold inline-flex items-center gap-2"><User className="h-4 w-4" /> Employer history</h3>
              <ul className="mt-2 space-y-1.5 text-sm">
                <li className="flex justify-between"><span className="text-muted-foreground">Tasks posted</span><span className="font-medium">{employerStats.posted}</span></li>
                <li className="flex justify-between"><span className="text-muted-foreground">Completion rate</span><span className="font-medium">{employerStats.completion != null ? `${employerStats.completion}%` : "—"}</span></li>
                <li className="flex justify-between"><span className="text-muted-foreground">Rating</span><span className="font-medium inline-flex items-center gap-0.5">{employerStats.rating ?? "—"} {employerStats.rating && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}</span></li>
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-semibold inline-flex items-center gap-2"><Award className="h-4 w-4" /> Tasker history</h3>
              <ul className="mt-2 space-y-1.5 text-sm">
                <li className="flex justify-between"><span className="text-muted-foreground">Tasks completed</span><span className="font-medium">{taskerStats.completed}</span></li>
                <li className="flex justify-between"><span className="text-muted-foreground">Success rate</span><span className="font-medium">{taskerStats.success != null ? `${taskerStats.success}%` : "—"}</span></li>
                <li className="flex justify-between"><span className="text-muted-foreground">Response rate</span><span className="font-medium">{taskerStats.response != null ? `${taskerStats.response}%` : "—"}</span></li>
                <li className="flex justify-between"><span className="text-muted-foreground">Avg rating</span><span className="font-medium inline-flex items-center gap-0.5">{taskerStats.rating ?? "—"} {taskerStats.rating && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}</span></li>
              </ul>
              {categoryRatings.length > 0 && (
                <>
                  <div className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">By category</div>
                  <ul className="mt-1 space-y-1 text-sm">
                    {categoryRatings.map((c: any, i: number) => (
                      <li key={i} className="flex justify-between">
                        <span className="text-foreground/80">{c.category_name ?? c.name}</span>
                        <span className="font-medium inline-flex items-center gap-0.5">{c.rating?.toFixed?.(1) ?? c.rating} <Star className="h-3 w-3 fill-amber-400 text-amber-400" /></span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {badges.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {badges.map((b: any, i: number) => (
                    <span key={i} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[11px] font-semibold">
                      <Award className="h-3 w-3" /> {b.name ?? b.category_name ?? b.badge_name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1.5">{label}</span>
      {children}
    </label>
  );
}
