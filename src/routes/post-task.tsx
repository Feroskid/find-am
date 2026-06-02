import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { TaskHeader } from "@/components/TaskHeader";
import { createTask } from "@/lib/findtask.functions";
import { FALLBACK_CATEGORIES } from "@/lib/findtask-categories";
import { useAuth } from "@/lib/auth";

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
    location: "",
    deadline: "",
    category: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) navigate({ to: "/login", search: { redirect: "/post-task" } as any });
  }, [token, navigate]);

  const onChange = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!token) return;
    const budgetNum = Number(form.budget);
    if (!Number.isFinite(budgetNum) || budgetNum <= 0) {
      setError("Enter a valid budget in Naira.");
      return;
    }
    setSubmitting(true);
    const res = await create({
      data: {
        title: form.title.trim(),
        description: form.description.trim(),
        budget: budgetNum,
        location: form.location.trim(),
        deadline: form.deadline || undefined,
        category: form.category || undefined,
        token,
      },
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    const id = (res.data as any)?.task_id ?? (res.data as any)?.id ?? (res.data as any)?.task?.id;
    if (id) navigate({ to: "/tasks/$taskId", params: { taskId: String(id) } });
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
              value={form.title} onChange={onChange("title")}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </Field>

          <Field label="Describe what you need done">
            <textarea
              required minLength={10} maxLength={4000} rows={5}
              value={form.description} onChange={onChange("description")}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary resize-y"
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Budget (₦)">
              <input
                required type="number" min={500} step={100}
                value={form.budget} onChange={onChange("budget")}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </Field>
            <Field label="Location">
              <input
                required maxLength={160}
                placeholder="e.g. Lekki, Lagos"
                value={form.location} onChange={onChange("location")}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Category (optional)">
              <select
                value={form.category} onChange={onChange("category")}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value="">Auto-detect</option>
                {FALLBACK_CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Deadline (optional)">
              <input
                type="date" value={form.deadline} onChange={onChange("deadline")}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </Field>
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
