import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, MapPin, Crosshair } from "lucide-react";
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

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River",
  "Delta","Ebonyi","Edo","Ekiti","Enugu","FCT - Abuja","Gombe","Imo","Jigawa","Kaduna",
  "Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun",
  "Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara",
];

function PostTask() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const create = useServerFn(createTask);

  const [form, setForm] = useState({
    title: "",
    description: "",
    budget: "",
    location_text: "",
    state: "",
    city: "",
    deadline: "",
    quantity: 1,
    urgency: "normal" as "low" | "normal" | "high" | "urgent",
    is_remote: false,
    category_id: 0,
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [geoMsg, setGeoMsg] = useState<string | null>(null);
  const [useMilestones, setUseMilestones] = useState(false);
  const [milestones, setMilestones] = useState<{ title: string; amount: string }[]>([
    { title: "", amount: "" },
  ]);

  const catsFn = useServerFn(getCategories);
  const catsQ = useQuery({ queryKey: ["categories"], queryFn: () => catsFn({}), staleTime: 5 * 60_000 });
  const categories: any[] = catsQ.data?.ok ? (catsQ.data.data as any)?.categories ?? [] : [];

  useEffect(() => {
    if (!token) navigate({ to: "/login", search: { redirect: "/post-task" } as any });
  }, [token, navigate]);

  const captureLocation = () => {
    if (!("geolocation" in navigator)) {
      setGeoStatus("error");
      setGeoMsg("Geolocation is not supported on this device.");
      return;
    }
    setGeoStatus("loading");
    setGeoMsg(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setForm((f) => ({ ...f, latitude, longitude }));
        // Best-effort reverse geocode (free, no key) — falls back to coords.
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
            { headers: { Accept: "application/json" } },
          );
          if (r.ok) {
            const j: any = await r.json();
            const a = j.address ?? {};
            const city = a.city ?? a.town ?? a.village ?? a.suburb ?? a.county ?? "";
            const state = a.state ?? "";
            const label = [city, state].filter(Boolean).join(", ") || j.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            setForm((f) => ({
              ...f,
              city: f.city || city,
              state: f.state || (NIGERIAN_STATES.find((s) => state && state.toLowerCase().includes(s.toLowerCase().split(" ")[0])) ?? state),
              location_text: f.location_text || label,
            }));
          }
        } catch {}
        setGeoStatus("ok");
        setGeoMsg("Location captured.");
      },
      (err) => {
        setGeoStatus("error");
        setGeoMsg(err.message || "Couldn't read your location.");
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  const budgetNum = Number(form.budget);
  const parsedMilestones = useMilestones
    ? milestones
        .map((m) => ({ title: m.title.trim(), amount: Number(m.amount) }))
        .filter((m) => m.title.length > 0 && Number.isFinite(m.amount) && m.amount > 0)
    : [];
  const milestonesTotal = parsedMilestones.reduce((s, m) => s + m.amount, 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!token) return;
    if (!Number.isFinite(budgetNum) || budgetNum < MIN_TASK_BUDGET) {
      setError(`Minimum task budget is ₦${MIN_TASK_BUDGET.toLocaleString()}.`);
      return;
    }
    // On-site tasks must have a location.
    if (!form.is_remote) {
      const hasLoc = form.state && (form.city.trim() || form.location_text.trim());
      const hasGps = form.latitude !== undefined && form.longitude !== undefined;
      if (!hasLoc && !hasGps) {
        setError("On-site tasks require a location. Use 'Use my current location' or enter the state and city/address.");
        return;
      }
    }
    if (useMilestones) {
      if (parsedMilestones.length < 1) {
        setError("Add at least one milestone with a title and amount.");
        return;
      }
      if (Math.abs(milestonesTotal - budgetNum) > 0.5) {
        setError(`Milestones must sum to your budget (₦${budgetNum.toLocaleString()}). Current sum: ₦${milestonesTotal.toLocaleString()}.`);
        return;
      }
    }
    setSubmitting(true);
    const deadlineIso = form.deadline ? new Date(`${form.deadline}T18:00:00`).toISOString() : undefined;
    const res = await create({
      data: {
        title: form.title.trim(),
        description: form.description.trim(),
        budget: budgetNum,
        category_id: form.category_id || undefined,
        location_text: form.location_text.trim() || undefined,
        state: form.state || undefined,
        city: form.city || undefined,
        latitude: form.latitude,
        longitude: form.longitude,
        is_remote: form.is_remote ? 1 : 0,
        deadline: deadlineIso,
        quantity: useMilestones ? 1 : (form.quantity > 1 ? form.quantity : undefined),
        urgency: form.urgency !== "normal" ? form.urgency : undefined,
        milestones: useMilestones ? parsedMilestones : undefined,
        token,
      },
    });
    setSubmitting(false);
    if (!res.ok) { setError(res.error); return; }
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
            <input required minLength={4} maxLength={140}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input" />
          </Field>

          <Field label="Describe what you need done">
            <textarea required minLength={10} maxLength={4000} rows={5}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input resize-y" />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={`Budget (₦) — min ₦${MIN_TASK_BUDGET.toLocaleString()}`}>
              <input required type="number" min={MIN_TASK_BUDGET} step={100}
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
                className="input" />
            </Field>
            <Field label="Category">
              <select
                value={form.category_id || 0}
                onChange={(e) => setForm({ ...form, category_id: Number(e.target.value) || 0 })}
                className="input"
              >
                <option value={0}>Auto-detect from description</option>
                {categories.flatMap((c: any) => {
                  const subs = c.subcategories ?? [];
                  return subs.length
                    ? subs.map((s: any) => (
                        <option key={s.category_id} value={s.category_id}>
                          {c.category_name} → {s.category_name}
                        </option>
                      ))
                    : [<option key={c.category_id} value={c.category_id}>{c.category_name}</option>];
                })}
              </select>
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Quantity (taskers needed)" hint={useMilestones ? "Locked to 1 — milestones support one tasker only." : undefined}>
              <input type="number" min={1} max={99}
                value={useMilestones ? 1 : form.quantity}
                disabled={useMilestones}
                onChange={(e) => setForm({ ...form, quantity: Math.max(1, Number(e.target.value) || 1) })}
                className="input disabled:opacity-60" />
            </Field>
            <Field label="Urgency">
              <select value={form.urgency}
                onChange={(e) => setForm({ ...form, urgency: e.target.value as any })}
                className="input">
                <option value="low">Flexible</option>
                <option value="normal">Normal</option>
                <option value="high">High priority</option>
                <option value="urgent">Urgent</option>
              </select>
            </Field>
          </div>

          {/* Milestones */}
          <div className="rounded-xl border border-dashed border-border p-4 space-y-3">
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1" checked={useMilestones}
                onChange={(e) => setUseMilestones(e.target.checked)} />
              <span>
                <span className="font-medium">Break the budget into milestones</span>
                <span className="block text-xs text-muted-foreground">
                  Pay the tasker in stages as parts of the work are completed. Milestone tasks are limited to one tasker.
                </span>
              </span>
            </label>

            {useMilestones && (
              <div className="space-y-2">
                {milestones.map((m, i) => (
                  <div key={i} className="grid grid-cols-[1fr_140px_auto] gap-2 items-center">
                    <input
                      value={m.title}
                      onChange={(e) => setMilestones((arr) => arr.map((x, j) => j === i ? { ...x, title: e.target.value } : x))}
                      placeholder={`Milestone ${i + 1} — e.g. Wireframes delivered`}
                      maxLength={140}
                      className="input"
                    />
                    <input
                      type="number" min={0} step={100}
                      value={m.amount}
                      onChange={(e) => setMilestones((arr) => arr.map((x, j) => j === i ? { ...x, amount: e.target.value } : x))}
                      placeholder="Amount ₦"
                      className="input"
                    />
                    <button type="button"
                      onClick={() => setMilestones((arr) => arr.length > 1 ? arr.filter((_, j) => j !== i) : arr)}
                      disabled={milestones.length <= 1}
                      className="text-xs px-2 py-1 rounded border border-border text-muted-foreground hover:text-destructive disabled:opacity-40">
                      Remove
                    </button>
                  </div>
                ))}
                <div className="flex items-center justify-between text-xs">
                  <button type="button"
                    onClick={() => setMilestones((arr) => [...arr, { title: "", amount: "" }])}
                    className="font-medium text-primary hover:underline">
                    + Add milestone
                  </button>
                  <span className={`tabular-nums ${Math.abs(milestonesTotal - budgetNum) > 0.5 ? "text-destructive" : "text-muted-foreground"}`}>
                    Total: ₦{milestonesTotal.toLocaleString()} / ₦{(Number.isFinite(budgetNum) ? budgetNum : 0).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Location block */}
          <div className="rounded-xl border border-dashed border-border p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-medium inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary" /> Where is this task?
              </div>
              <label className="inline-flex items-center gap-2 text-xs">
                <input type="checkbox" checked={form.is_remote}
                  onChange={(e) => setForm({ ...form, is_remote: e.target.checked })} />
                Can be done remotely
              </label>
            </div>

            {!form.is_remote && (
              <>
                <button type="button" onClick={captureLocation}
                  disabled={geoStatus === "loading"}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-60">
                  {geoStatus === "loading" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Crosshair className="h-3.5 w-3.5" />}
                  Use my current location
                </button>
                {geoMsg && (
                  <div className={`text-xs ${geoStatus === "error" ? "text-destructive" : "text-muted-foreground"}`}>{geoMsg}</div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="State">
                    <select value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                      className="input">
                      <option value="">Select state</option>
                      {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label="City / Area">
                    <input maxLength={80} value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="input" placeholder="e.g. Lekki Phase 1" />
                  </Field>
                </div>

                <Field label="Street address / landmark">
                  <input maxLength={160} value={form.location_text}
                    onChange={(e) => setForm({ ...form, location_text: e.target.value })}
                    className="input" placeholder="e.g. 12 Admiralty Way, near GTBank" />
                </Field>

                {form.latitude !== undefined && (
                  <div className="text-[11px] text-muted-foreground">
                    GPS: {form.latitude.toFixed(4)}, {form.longitude!.toFixed(4)} (will be shared with the accepted tasker only)
                  </div>
                )}
              </>
            )}
          </div>

          <Field label="Deadline (optional)">
            <input type="date" value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              className="input" />
          </Field>

          {budgetNum >= MIN_TASK_BUDGET && <FeeBreakdown budget={budgetNum} />}

          {error && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          <button type="submit" disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Posting…" : "Post task"}
          </button>
          <p className="text-center text-xs text-muted-foreground">
            By posting you agree to Find-task <Link to="/tasks" className="underline">Terms</Link>.
          </p>
        </form>
      </main>
      <style>{`.input{width:100%;border:1px solid hsl(var(--border));background:hsl(var(--background));border-radius:0.5rem;padding:0.5rem 0.75rem;font-size:0.875rem;outline:none}.input:focus{border-color:hsl(var(--primary))}`}</style>
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
