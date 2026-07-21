import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  Loader2, ArrowLeft, ArrowRight, Plus, Trash2, MapPin, Globe, Wallet,
  Layers, Info, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { TaskHeader } from "@/components/TaskHeader";
import { LocationPicker, type LatLng } from "@/components/LocationPicker";
import { useAuth } from "@/lib/auth";
import { getCategories, createTask } from "@/lib/findtask.functions";
import { computeFees, formatNaira } from "@/lib/fees";

export const Route = createFileRoute("/post-task")({
  head: () => ({ meta: [{ title: "Post a task — Find-task" }] }),
  component: PostTaskPage,
});

const MIN_BUDGET = 2000;

type Milestone = { title: string; amount: string; description: string; due_date: string };

function PostTaskPage() {
  const { token, ready } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (ready && !token) navigate({ to: "/login", search: { redirect: "/post-task" } as any });
  }, [token, ready, navigate]);

  const catsFn = useServerFn(getCategories);
  const create = useServerFn(createTask);

  const catsQ = useQuery({
    queryKey: ["categories"],
    queryFn: () => catsFn({ data: {} }),
    staleTime: 5 * 60 * 1000,
  });
  const categories: any[] = catsQ.data?.ok ? ((catsQ.data.data as any)?.categories ?? []) : [];

  // form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [parentCat, setParentCat] = useState<number | "">("");
  const [subCat, setSubCat] = useState<number | "">("");
  const [budget, setBudget] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isRemote, setIsRemote] = useState(false);
  const [location, setLocation] = useState("");            // address text -> location_text
  const [coords, setCoords] = useState<LatLng | null>(null); // lat/lng from the map
  const [deadline, setDeadline] = useState("");
  const [isMilestone, setIsMilestone] = useState(false);
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  const selectedParent = categories.find((c) => c.category_id === parentCat);
  const subOptions: any[] = selectedParent?.subcategories ?? [];

  const budgetNum = Number(budget) || 0;
  const totalBudget = budgetNum * quantity;
  const fee = useMemo(() => computeFees(totalBudget), [totalBudget]);

  const validBudget = budgetNum >= MIN_BUDGET;
  const chosenCategory = subCat || parentCat;
  const canSubmit =
    title.trim().length >= 5 &&
    description.trim().length >= 20 &&
    validBudget &&
    !!chosenCategory &&
    (isRemote || coords !== null) &&
    quantity >= 1;

  const [error, setError] = useState<string | null>(null);

  const submitM = useMutation({
    mutationFn: () =>
      create({
        data: {
          token: token!,
          title: title.trim(),
          description: description.trim(),
          budget: budgetNum,
          category_id: Number(chosenCategory),
          quantity,
          is_remote: isRemote ? 1 : 0,
          location_text: isRemote ? undefined : (location.trim() || undefined),
          location_lat: isRemote ? undefined : coords?.lat,
          location_lng: isRemote ? undefined : coords?.lng,
          deadline: deadline || undefined,
          is_milestone: isMilestone ? 1 : 0,
          milestones: isMilestone
            ? milestones
                .filter((m) => m.title.trim() && Number(m.amount) > 0)
                .map((m) => ({
                  title: m.title.trim(),
                  amount: Number(m.amount),
                  description: m.description.trim() || undefined,
                  due_date: m.due_date || undefined,
                }))
            : [],
        },
      }),
    onSuccess: (r: any) => {
      if (r.ok) {
        toast.success("Task posted!");
        const id = r.data?.task_id ?? r.data?.id;
        if (id) navigate({ to: "/tasks/$taskId", params: { taskId: String(id) } });
        else navigate({ to: "/dashboard" });
      } else {
        setError(r.error);
        toast.error(r.error);
      }
    },
    onError: (e: any) => {
      const m = e?.message ?? "Could not post the task.";
      setError(m);
      toast.error(m);
    },
  });

  const milestonesTotal = milestones.reduce((s, m) => s + (Number(m.amount) || 0), 0);

  if (!token) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TaskHeader />
      <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-8 flex-1">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
        <h1 className="mt-2 font-display text-3xl text-ink">Post a task</h1>
        <p className="text-muted-foreground">Describe what you need done. Clear tasks get better offers.</p>

        <div className="mt-8 space-y-6">
          {/* WHAT */}
          <Section icon={Info} title="What do you need done?" desc="A clear title and detailed description.">
            <Field label="Task title" hint={`${title.trim().length}/80`}>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 80))}
                placeholder="e.g. Paint my 3-bedroom apartment"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
              {title.length > 0 && title.trim().length < 5 && (
                <p className="mt-1 text-xs text-destructive">Title should be at least 5 characters.</p>
              )}
            </Field>

            <Field label="Description" hint={`${description.trim().length} chars · min 20`}>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Describe the task in detail — what needs doing, any requirements, materials, timing…"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
            </Field>
          </Section>

          {/* CATEGORY */}
          <Section icon={Layers} title="Category" desc="Pick the closest match so the right taskers see it.">
            {catsQ.isFetching ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading categories…</div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Main category">
                  <select
                    value={parentCat}
                    onChange={(e) => { setParentCat(Number(e.target.value) || ""); setSubCat(""); }}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary outline-none"
                  >
                    <option value="">Select a category…</option>
                    {categories.map((c) => (
                      <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Subcategory" hint={subOptions.length === 0 ? "optional" : undefined}>
                  <select
                    value={subCat}
                    onChange={(e) => setSubCat(Number(e.target.value) || "")}
                    disabled={!parentCat || subOptions.length === 0}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {!parentCat ? "Choose a main category first" : subOptions.length === 0 ? "No subcategories" : "Select a subcategory…"}
                    </option>
                    {subOptions.map((s) => (
                      <option key={s.category_id} value={s.category_id}>{s.category_name}</option>
                    ))}
                  </select>
                </Field>
              </div>
            )}
          </Section>

          {/* LOCATION */}
          <Section icon={isRemote ? Globe : MapPin} title="Where?" desc="On-site tasks need a pinned location; remote ones don't.">
            <label className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 cursor-pointer hover:bg-muted/40">
              <input
                type="checkbox"
                checked={isRemote}
                onChange={(e) => setIsRemote(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              <span className="text-sm font-medium">This task can be done remotely</span>
            </label>

            {!isRemote && (
              <LocationPicker
                value={coords}
                address={location}
                onChange={setCoords}
                onAddressChange={setLocation}
              />
            )}
          </Section>

          {/* BUDGET + QUANTITY */}
          <Section icon={Wallet} title="Budget & taskers" desc="How much per tasker, and how many taskers you need.">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Budget per tasker (₦)" hint={`min ${formatNaira(MIN_BUDGET)}`}>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  min={MIN_BUDGET}
                  placeholder="5000"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
                {budget !== "" && !validBudget && (
                  <p className="mt-1 text-xs text-destructive">Minimum budget is {formatNaira(MIN_BUDGET)}.</p>
                )}
              </Field>

              <Field label="Number of taskers">
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="h-10 w-10 rounded-lg border border-border font-bold hover:bg-muted">−</button>
                  <input
                    type="number"
                    value={quantity}
                    min={1}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full text-center rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary outline-none"
                  />
                  <button type="button" onClick={() => setQuantity((q) => q + 1)} className="h-10 w-10 rounded-lg border border-border font-bold hover:bg-muted">+</button>
                </div>
              </Field>
            </div>

            <Field label="Deadline (optional)">
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary outline-none"
              />
            </Field>
          </Section>

          {/* MILESTONES (optional) */}
          <Section icon={CheckCircle2} title="Milestones (optional)" desc="Break a big task into paid stages.">
            <label className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 cursor-pointer hover:bg-muted/40">
              <input
                type="checkbox"
                checked={isMilestone}
                onChange={(e) => { setIsMilestone(e.target.checked); if (e.target.checked && milestones.length === 0) setMilestones([{ title: "", amount: "", description: "", due_date: "" }]); }}
                className="h-4 w-4 accent-primary"
              />
              <span className="text-sm font-medium">Use milestones for this task</span>
            </label>

            {isMilestone && (
              <div className="space-y-3">
                {milestones.map((m, i) => (
                  <div key={i} className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Milestone {i + 1}</span>
                      <button type="button" onClick={() => setMilestones((ms) => ms.filter((_, x) => x !== i))} className="text-destructive hover:opacity-80">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <input
                      value={m.title}
                      onChange={(e) => setMilestones((ms) => ms.map((x, xi) => xi === i ? { ...x, title: e.target.value } : x))}
                      placeholder="Milestone title"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        value={m.amount}
                        onChange={(e) => setMilestones((ms) => ms.map((x, xi) => xi === i ? { ...x, amount: e.target.value } : x))}
                        placeholder="Amount (₦)"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      />
                      <input
                        type="date"
                        value={m.due_date}
                        onChange={(e) => setMilestones((ms) => ms.map((x, xi) => xi === i ? { ...x, due_date: e.target.value } : x))}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setMilestones((ms) => [...ms, { title: "", amount: "", description: "", due_date: "" }])}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                >
                  <Plus className="h-4 w-4" /> Add milestone
                </button>
                {milestonesTotal > 0 && (
                  <p className="text-xs text-muted-foreground">Milestones total: {formatNaira(milestonesTotal)}</p>
                )}
              </div>
            )}
          </Section>

          {/* COST SUMMARY — reacts to quantity */}
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
            <h3 className="font-display text-lg text-ink">Cost summary</h3>
            <dl className="mt-3 space-y-1.5 text-sm">
              <Row label={`Budget${quantity > 1 ? ` (${quantity} taskers × ${formatNaira(budgetNum)})` : ""}`} value={formatNaira(totalBudget)} />
              <Row label="Service fee" value={formatNaira(fee.serviceFee ?? 0)} muted />
              <Row label="Platform fee" value={formatNaira(fee.fixedFee ?? 0)} muted />
              <Row label="VAT" value={formatNaira(fee.vat ?? 0)} muted />
              <div className="border-t border-primary/20 my-1.5" />
              <Row label="Total you pay" value={formatNaira(fee.total ?? totalBudget)} bold />
            </dl>
            <p className="mt-2 text-xs text-muted-foreground">
              You'll be asked to fund this (from wallet or card) when you accept a tasker.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          <button
            onClick={() => { setError(null); submitM.mutate(); }}
            disabled={!canSubmit || submitM.isPending}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {submitM.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
            {submitM.isPending ? "Posting…" : "Post task"}
          </button>
          {!canSubmit && (
            <p className="text-center text-xs text-muted-foreground">
              Fill in a title, description (20+ chars), category, budget ({formatNaira(MIN_BUDGET)}+){!isRemote ? ", and pin a location" : ""} to continue.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

function Section({ icon: Icon, title, desc, children }: { icon: any; title: string; desc: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-semibold text-ink">{title}</h2>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</label>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value, muted, bold }: { label: string; value: string; muted?: boolean; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className={muted ? "text-muted-foreground" : bold ? "font-bold text-ink" : "text-foreground"}>{label}</dt>
      <dd className={bold ? "font-display text-lg text-ink" : muted ? "text-muted-foreground" : "text-foreground"}>{value}</dd>
    </div>
  );
}
