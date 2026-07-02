import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MapPin, Star, Award, ShieldCheck, User } from "lucide-react";
import { TaskHeader } from "@/components/TaskHeader";
import { TaskCard, toCardData } from "@/components/TaskCard";
import { getPublicUser } from "@/lib/findtask.functions";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/u/$userId")({
  head: () => ({ meta: [{ title: "Profile — Find-task" }] }),
  component: PublicProfilePage,
});

function PublicProfilePage() {
  const { userId } = Route.useParams();
  const { token } = useAuth();
  const uFn = useServerFn(getPublicUser);

  const uQ = useQuery({
    queryKey: ["pu", userId, token ? "auth" : "anon"],
    queryFn: () => uFn({ data: { userId, token: token ?? undefined } }),
  });


  const raw: any = uQ.data?.ok ? uQ.data.data : null;
  const u: any = raw?.profile ?? raw?.user ?? raw ?? null;
  const categoryRatings: any[] = u?.category_ratings ?? u?.ratings_by_category ?? [];
  const badges: any[] = u?.badges ?? [];
  const tasks: any[] = (() => {
    const t = u?.tasks ?? u?.recent_tasks ?? u?.posted_tasks ?? [];
    return Array.isArray(t) ? t : [];
  })();

  const has = (v: any) => v !== undefined && v !== null && v !== "" && !(typeof v === "number" && Number.isNaN(v));
  const employer = {
    posted: u?.tasks_posted ?? u?.posted_count,
    completion: u?.completion_rate,
    rating: u?.employer_rating ?? u?.poster_rating,
  };
  const tasker = {
    completed: u?.tasks_completed ?? u?.completed_count,
    success: u?.success_rate,
    response: u?.response_rate,
    rating: u?.tasker_rating ?? u?.rating,
  };
  const hasEmployerStats = has(employer.posted) || has(employer.completion) || has(employer.rating);
  const hasTaskerStats = has(tasker.completed) || has(tasker.success) || has(tasker.response) || has(tasker.rating) || categoryRatings.length > 0 || badges.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TaskHeader />
      <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-8 flex-1">
        {uQ.isFetching && !u ? (
          <div className="text-muted-foreground inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
        ) : !uQ.data?.ok ? (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{uQ.data?.error ?? "User not found."}</div>
        ) : !u ? (
          <div className="text-muted-foreground">No profile data.</div>
        ) : (
          <>
            <header className="flex items-start gap-5">
              {u.photo_url ? (
                <img src={u.photo_url} alt="" className="h-20 w-20 rounded-full object-cover" />
              ) : (
                <div className="h-20 w-20 rounded-full bg-primary/10 text-primary inline-flex items-center justify-center text-2xl font-bold">
                  {String(u.name ?? "U").charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold tracking-tight inline-flex items-center gap-2">{u.name ?? "Unnamed"} {u.kyc_verified && <ShieldCheck className="h-5 w-5 text-emerald-500" aria-label="Verified payment" />}</h1>
                {u.tagline && <p className="text-muted-foreground">{u.tagline}</p>}
                <div className="mt-1 text-xs text-muted-foreground flex flex-wrap gap-3">
                  {(u.city || u.state || u.location) && (
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {[u.city, u.state].filter(Boolean).join(", ") || u.location}</span>
                  )}
                  {u.created_at && <span>Member since {new Date(u.created_at).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</span>}
                </div>
                {u.about && <p className="mt-3 text-sm text-foreground/80 whitespace-pre-wrap">{u.about}</p>}
              </div>
            </header>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {hasEmployerStats ? (
                <section className="rounded-2xl border border-border bg-card p-5">
                  <h2 className="font-semibold inline-flex items-center gap-2"><User className="h-4 w-4" /> As employer</h2>
                  <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    {has(employer.posted) && <Stat label="Tasks posted" value={employer.posted} />}
                    {has(employer.completion) && <Stat label="Completion rate" value={`${employer.completion}%`} />}
                    {has(employer.rating) && <Stat label="Employer rating" value={employer.rating} star />}
                  </dl>
                </section>
              ) : null}

              {hasTaskerStats ? (
                <section className="rounded-2xl border border-border bg-card p-5">
                  <h2 className="font-semibold inline-flex items-center gap-2"><Award className="h-4 w-4" /> As tasker</h2>
                  <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    {has(tasker.completed) && <Stat label="Tasks completed" value={tasker.completed} />}
                    {has(tasker.success) && <Stat label="Success rate" value={`${tasker.success}%`} />}
                    {has(tasker.response) && <Stat label="Response rate" value={`${tasker.response}%`} />}
                    {has(tasker.rating) && <Stat label="Overall rating" value={tasker.rating} star />}
                  </dl>

                  {categoryRatings.length > 0 && (
                    <>
                      <div className="mt-4 text-xs uppercase tracking-wide text-muted-foreground">Category ratings</div>
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
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {badges.map((b: any, i: number) => (
                        <span key={i} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[11px] font-semibold">
                          <Award className="h-3 w-3" /> {b.name ?? b.category_name ?? b.badge_name}
                        </span>
                      ))}
                    </div>
                  )}
                </section>
              ) : null}

              {!hasEmployerStats && !hasTaskerStats && (
                <div className="md:col-span-2 rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground text-center">
                  This user hasn't built up a public reputation yet.
                </div>
              )}
            </div>

            {tasks.length > 0 && (
              <section className="mt-8">
                <h2 className="text-lg font-semibold">Recent tasks</h2>
                <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {tasks.slice(0, 6).map((t: any) => <TaskCard key={t.task_id ?? t.id} task={toCardData(t)} />)}
                </div>
              </section>
            )}

            <div className="mt-10">
              <Link to="/tasks/browse" className="text-sm text-primary hover:underline">← Browse all tasks</Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value, star }: { label: string; value: any; star?: boolean }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="font-semibold inline-flex items-center gap-1">{value}{star && value !== "—" && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}</dd>
    </div>
  );
}
