import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { TaskHeader } from "@/components/TaskHeader";
import { FeeBreakdown } from "@/components/FeeBreakdown";
import { createTask, getCategories } from "@/lib/findtask.functions";
import { useAuth } from "@/lib/auth";
import { MIN_TASK_BUDGET } from "@/lib/fees";

export const Route = createFileRoute("/post-task")({
  head: () => ({
    meta: [
      { title: "Post a task — Find-task" },
      { name: "description", content: "Tell us what you need done and get offers from trusted Taskers across Nigeria." },
    ],
  }),
  component: PostTask,
});

function PostTask() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const create = useServerFn(createTask);

  const [form, setForm] = useState({
    title: "",
    description: "",
    budget: "",
    location_text: "",
    deadline: "",
    is_remote: false,
    category_id: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const catsFn = useServerFn(getCategories);
  const catsQ = useQuery({ queryKey: ["categories"], queryFn: () => catsFn({}), staleTime: 5 * 60_000 });
  const categories: any[] = catsQ.data?.ok ? (catsQ.data.data as any)?.categories ?? [] : [];

  useEffect(() => {
    if (!token) navigate({ to: "/login", search: { redirect: "/post-task" } as any });
  }, [token, navigate]);

  const budgetNum = Number(form.budget);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!token) return;
    if (!Number.isFinite(budgetNum) || budgetNum < MIN_TASK_BUDGET) {
      setError(`Minimum task budget is ₦${MIN_TASK_BUDGET.toLocaleString()}.`);
      return;
    }
    setSubmitting(true);
    // Convert YYYY-MM-DD to ISO datetime expected by FastAPI
    const deadlineIso = form.deadline ? new Date(`${form.deadline}T18:00:00`).toISOString() : undefined;
    const res = await create({
      data: {
        title: form.title.trim(),
        description: form.description.trim(),
        budget: budgetNum,
        location_text: form.location_text.trim() || undefined,
        is_remote: form.is_remote ? 1 : 0,
        deadline: deadlineIso,
        token,
      },
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    const d: any = res.data;
    const id = d?.task_id ?? d?.id ?? d?.task?.task_id ?? d?.task?.id;
    if (id !== undefined) navigate({ to: "/tasks/$taskId", params: { taskId: String(id) } });
    else navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TaskHeader />
      <main className="mx-auto w-full max-w-2xl px-4 sm:px-6 py-10 flex-1">
        <h1 className="text-3xl font-bold tracking-tight">Post a task</h1>
        <p className="mt-1 text-muted-foreground">Tell us what you need done. Free to post.</p>

        <form onSubmit={submit} className="mt-8 space-y-5 rounded-2xl border border-border bg-card p-6">
          <Field label="Task title" hint="e.g. 'Fix leaking kitchen sink'">
            <input
              required minLength={4} maxLength={140}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </Field>

          <Field label="Describe what you need done">
            <textarea
              required minLength={10} maxLength={4000} rows={5}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary resize-y"
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Budget (₦)">
              <input
                required type="number" min={500} step={100}
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </Field>
            <Field label={form.is_remote ? "Location (remote)" : "Location"}>
              <input
                disabled={form.is_remote} maxLength={160}
                placeholder="e.g. Lekki, Lagos"
                value={form.location_text}
                onChange={(e) => setForm({ ...form, location_text: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-50"
              />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Deadline (optional)">
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </Field>
            <label className="self-end inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_remote}
                onChange={(e) => setForm({ ...form, is_remote: e.target.checked })}
              />
              This task can be done remotely
            </label>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          <button
            type="submit" disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Posting…" : "Post task"}
          </button>
          <p className="text-center text-xs text-muted-foreground">
            By posting you agree to Find-task <Link to="/tasks" className="underline">Terms</Link>.
          </p>
        </form>
      </main>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 text-sm font-medium">{label}</div>
      {children}
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </label>
  );
}
