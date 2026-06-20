import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight, ShieldCheck, Users, Star, Sparkles, Hammer, Truck, Brush, Wrench, Laptop,
  Package, TreeDeciduous, CheckCircle2, BadgeCheck, Briefcase, Paintbrush,
  Sparkle, Camera, ClipboardList, MoveRight, Shuffle, Loader2,
} from "lucide-react";
import { TaskHeader } from "@/components/TaskHeader";
import { Footer } from "@/components/Footer";
import { TaskCard, toCardData } from "@/components/TaskCard";
import { useAuth } from "@/lib/auth";
import { listTasks } from "@/lib/findtask.functions";

export const Route = createFileRoute("/tasks/")({
  head: () => ({
    meta: [
      { title: "Find-task — Get anything done across Nigeria" },
      { name: "description", content: "Post any task. Pick the best person. Get it done. Find-task connects you with trusted Taskers nationwide." },
      { property: "og:title", content: "Find-task — Get anything done" },
      { property: "og:description", content: "Post any task. Pick the best person. Get it done." },
    ],
  }),
  component: TasksHome,
});

const TOP_CATEGORIES = [
  { icon: Truck, label: "Removalists", desc: "Packing, wrapping, moving and more!" },
  { icon: Brush, label: "Home cleaning", desc: "Clean, mop and tidy your house" },
  { icon: Package, label: "Furniture assembly", desc: "Flatpack assembly and disassembly" },
  { icon: Hammer, label: "Deliveries", desc: "Urgent deliveries and courier services" },
  { icon: TreeDeciduous, label: "Gardening & landscaping", desc: "Mulching, weeding and tidying up" },
  { icon: Wrench, label: "Handyman & repairs", desc: "Fixing things big and small" },
];

const SHOWCASE_TABS = ["Moving in", "Home maintenance", "Starting a business", "Parties", "Something different"] as const;

const SHOWCASE: Record<typeof SHOWCASE_TABS[number], { category: string; title: string; budget: number }[]> = {
  "Moving in": [
    { category: "DELIVERY", title: "Pick up & deliver a medium fridge", budget: 12000 },
    { category: "DELIVERY", title: "King mattress pickup & delivery", budget: 18000 },
    { category: "REMOVALS", title: "Help moving house 2-bedroom", budget: 65000 },
    { category: "ASSEMBLY", title: "Assemble bedroom flatpack", budget: 9500 },
  ],
  "Home maintenance": [
    { category: "PLUMBING", title: "Fix leaking kitchen tap", budget: 8000 },
    { category: "ELECTRICAL", title: "Install ceiling fan", budget: 7500 },
    { category: "CLEANING", title: "Deep clean 3-bed apartment", budget: 25000 },
    { category: "GARDENING", title: "Mow lawn & trim hedges", budget: 6000 },
  ],
  "Starting a business": [
    { category: "DESIGN", title: "Logo & business card design", budget: 35000 },
    { category: "WEB", title: "Build a one-page site", budget: 80000 },
    { category: "WRITING", title: "Write brand About page", budget: 15000 },
    { category: "PHOTO", title: "Product photoshoot (10 items)", budget: 45000 },
  ],
  "Parties": [
    { category: "EVENT", title: "MC for birthday party", budget: 30000 },
    { category: "DELIVERY", title: "Pick up & deliver party rentals", budget: 12000 },
    { category: "CLEANING", title: "Post-party cleanup", budget: 14000 },
    { category: "PHOTO", title: "Event photography 4hrs", budget: 60000 },
  ],
  "Something different": [
    { category: "TUTORING", title: "Maths tutor — JSS3", budget: 8000 },
    { category: "FITNESS", title: "Personal trainer at home", budget: 10000 },
    { category: "PET", title: "Dog walking weekday afternoons", budget: 5000 },
    { category: "TECH", title: "Set up new MacBook", budget: 9000 },
  ],
};

function TasksHome() {
  const [tab, setTab] = useState<(typeof SHOWCASE_TABS)[number]>("Moving in");
  const { token } = useAuth();

  if (token) return <LoggedInHome />;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <TaskHeader />


      {/* HERO */}
      <section className="relative overflow-hidden bg-surface-soft border-b border-border">
        <div className="absolute inset-0 opacity-[0.08] [background:radial-gradient(circle_at_15%_20%,var(--color-primary)_0%,transparent_45%),radial-gradient(circle_at_85%_30%,var(--color-primary)_0%,transparent_40%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Trusted across Nigeria
          </span>
          <h1 className="mt-6 font-display text-5xl sm:text-7xl md:text-8xl text-ink leading-[0.95]">
            GET ANYTHING <br />
            <span className="text-primary">DONE</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base sm:text-lg text-muted-foreground">
            Post any task. Pick the best person. Get it done — safely paid through Find-task.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/post-task" className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-bold text-primary-foreground shadow-lg hover:opacity-90">
              Post your task for free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/register" className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border-2 border-ink/80 px-7 py-3.5 text-sm font-bold text-ink hover:bg-ink hover:text-background">
              Earn money as a Tasker
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-3 max-w-xl mx-auto gap-3 text-xs sm:text-sm text-ink/80">
            <div className="flex flex-col items-center gap-1"><Users className="h-4 w-4 text-primary" /><span className="font-semibold">1M+ customers</span></div>
            <div className="flex flex-col items-center gap-1"><ShieldCheck className="h-4 w-4 text-primary" /><span className="font-semibold">Secure payments</span></div>
            <div className="flex flex-col items-center gap-1"><Star className="h-4 w-4 text-primary fill-primary" /><span className="font-semibold">4.0 ‘Great’</span></div>
          </div>
        </div>
      </section>

      {/* MEMBERSHIP BAND */}
      <section className="bg-surface-warm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-primary">Find-task Membership</div>
            <h2 className="mt-1 font-display text-3xl sm:text-5xl text-ink leading-tight max-w-xl">
              Unlock ₦0 connection fees all year round.
            </h2>
          </div>
          <Link to="/register" className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-bold text-background hover:opacity-90">
            Join now <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pb-4 text-xs text-muted-foreground">Membership ₦12,000/yr. T&Cs apply.</div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-16">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl text-ink">Post your first task in seconds</h2>
            <p className="mt-2 text-muted-foreground">Save yourself hours and get your to-do list completed</p>
            <ol className="mt-6 space-y-4">
              {[
                ["1", "Describe what you need done"],
                ["2", "Set your budget"],
                ["3", "Receive quotes and pick the best Tasker"],
              ].map(([n, txt]) => (
                <li key={n} className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground font-bold">{n}</span>
                  <span className="text-base text-ink font-medium pt-1">{txt}</span>
                </li>
              ))}
            </ol>
            <Link to="/post-task" className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:opacity-90">
              Post your task
            </Link>
          </div>
          <div className="relative">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-xl">
              <div className="text-xs font-bold uppercase tracking-wider text-primary">Sample task</div>
              <h3 className="mt-1 font-display text-2xl text-ink">Help me move a 2-bed apartment</h3>
              <div className="mt-2 text-sm text-muted-foreground">Lagos, Lekki • Saturday morning</div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <div>
                  <div className="text-xs text-muted-foreground">Task budget</div>
                  <div className="font-display text-3xl text-ink">₦65,000</div>
                </div>
                <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success">OPEN • 5 offers</span>
              </div>
            </div>
            <div className="absolute -bottom-6 -right-2 rounded-2xl bg-success text-background px-4 py-2 text-xs font-bold shadow-lg rotate-3">
              <CheckCircle2 className="inline h-3.5 w-3.5 mr-1" /> Payment received!
            </div>
          </div>
        </div>
      </section>

      {/* TOP CATEGORIES */}
      <section className="bg-surface-soft py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-end justify-between flex-wrap gap-3">
            <h2 className="font-display text-3xl sm:text-4xl text-ink">Popular categories</h2>
            <Link to="/tasks/categories" className="text-sm font-bold text-primary hover:underline">Learn how Find-task works →</Link>
          </div>
          <p className="mt-2 text-muted-foreground">Whatever you need, there's a Tasker for that.</p>
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {TOP_CATEGORIES.map((c) => (
              <Link
                key={c.label}
                to="/tasks/categories"
                className="group rounded-2xl border border-border bg-card p-5 text-left hover:border-primary hover:shadow-md transition"
              >
                <c.icon className="h-7 w-7 text-primary" />
                <div className="mt-3 font-bold text-sm text-ink leading-tight">{c.label}</div>
                <div className="mt-1 text-[11px] text-muted-foreground line-clamp-2">{c.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      {/* RANDOM LIVE TASKS */}
      <RandomTasksRail />


      {/* SHOWCASE TABS */}
      <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 py-16">
        <h2 className="font-display text-3xl sm:text-4xl text-ink">See what others are getting done</h2>
        <div className="mt-6 flex flex-wrap gap-2">
          {SHOWCASE_TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={
                "rounded-full px-4 py-2 text-sm font-semibold transition " +
                (t === tab
                  ? "bg-ink text-background"
                  : "bg-muted text-foreground hover:bg-ink/10")
              }
            >
              {t}
            </button>
          ))}
        </div>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SHOWCASE[tab].map((card, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5 flex flex-col">
              <div className="text-[10px] font-bold uppercase tracking-widest text-primary">{card.category}</div>
              <div className="mt-2 font-bold text-ink leading-snug min-h-[3em]">{card.title}</div>
              <div className="mt-4 inline-flex items-center gap-0.5 text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-amber-500" />
                ))}
              </div>
              <div className="mt-auto pt-4 font-display text-2xl text-ink">₦{card.budget.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </section>

      {/* TRUST & SAFETY */}
      <section className="bg-ink text-background py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="font-display text-3xl sm:text-4xl">Trust and safety features for your protection</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              { icon: ShieldCheck, title: "Secure payments", body: "Only release payment when the task is completed to your satisfaction." },
              { icon: Star, title: "Trusted ratings & reviews", body: "Pick the right person based on real ratings from other users." },
              { icon: BadgeCheck, title: "Insurance for peace of mind", body: "We provide liability insurance for Taskers performing most task activities." },
            ].map((t) => (
              <div key={t.title}>
                <span className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground">
                  <t.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 font-display text-xl">{t.title}</h3>
                <p className="mt-2 text-sm text-background/80 max-w-xs">{t.body}</p>
              </div>
            ))}
          </div>
          <Link to="/post-task" className="mt-10 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:opacity-90">
            Post your task for free
          </Link>
        </div>
      </section>

      {/* BE YOUR OWN BOSS */}
      <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 py-16">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="order-2 md:order-1 relative">
            <div className="rounded-3xl bg-surface-soft p-6 shadow-lg">
              <div className="text-xs font-bold uppercase tracking-wider text-primary">New job alert!</div>
              <div className="mt-2 font-display text-xl text-ink">Paint chairs · 2h ago</div>
              <div className="mt-2 font-display text-2xl text-ink">₦17,900</div>
            </div>
            <div className="mt-4 rounded-3xl bg-card border border-border p-6">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total earnings</div>
              <div className="mt-1 font-display text-4xl text-ink">₦1,306,600</div>
              <div className="mt-1 text-xs font-semibold text-success">▲ 20% vs last month</div>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <h2 className="font-display text-3xl sm:text-4xl text-ink">Be your own boss</h2>
            <p className="mt-2 text-muted-foreground max-w-md">
              Whether you're a spreadsheet wizard or a diligent carpenter, find your next job on Find-task.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Free access to thousands of job opportunities",
                "No subscription or credit fees",
                "Earn extra income on a flexible schedule",
                "Grow your business and client base",
              ].map((b) => (
                <li key={b} className="flex items-start gap-3 text-base">
                  <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <Link to="/register" className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:opacity-90">
              Earn money as a Tasker
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURED TASKERS */}
      <section className="bg-surface-soft py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="font-display text-3xl sm:text-4xl text-ink text-center">160,000+ Taskers earning income on Find-task</h2>
          <div className="mt-10 grid md:grid-cols-2 gap-6">
            {[
              { name: "Hassan O.", rating: "5.0", ratings: 73, completion: "97%", speciality: "24/7 emergency plumbing, gas fitting, renovations", quote: "A+++ for Hassan! Highly professional, punctual and he did it all with a friendly smile.", by: "Nic K." },
              { name: "Philippe A.", rating: "4.9", ratings: 818, completion: "93%", speciality: "Delivery, removals and interstate moves", quote: "On time, very careful with boxes. Wrapped the couch and mattress for us. Highly recommend!", by: "Erin O." },
            ].map((t) => (
              <article key={t.name} className="rounded-3xl bg-card border border-border p-6">
                <div className="flex items-center gap-4">
                  <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 font-display text-2xl text-primary">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-display text-xl text-ink inline-flex items-center gap-1.5">{t.name} <BadgeCheck className="h-4 w-4 text-primary" /></div>
                    <div className="text-xs text-muted-foreground">Verified ID • Payment Method • Mobile</div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-surface-soft p-3">
                    <div className="font-display text-2xl text-ink">{t.rating} <Star className="inline h-4 w-4 fill-amber-500 text-amber-500" /></div>
                    <div className="text-[11px] text-muted-foreground">{t.ratings} ratings</div>
                  </div>
                  <div className="rounded-xl bg-surface-soft p-3">
                    <div className="font-display text-2xl text-ink">{t.completion}</div>
                    <div className="text-[11px] text-muted-foreground">Completion rate</div>
                  </div>
                </div>
                <div className="mt-4 text-sm"><span className="font-semibold">Speciality:</span> <span className="text-muted-foreground">{t.speciality}</span></div>
                <blockquote className="mt-4 rounded-xl bg-surface-soft p-4 text-sm italic text-ink">
                  "{t.quote}"
                  <footer className="mt-2 text-xs not-italic text-muted-foreground">— {t.by}</footer>
                </blockquote>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ARTICLES */}
      <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 py-16">
        <h2 className="font-display text-3xl sm:text-4xl text-ink">Articles, stories & more</h2>
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          {[
            { tag: "CASE STUDY", title: "How Edible Blooms scales operations with on-demand support", body: "Built a smarter, leaner staffing approach across every city it serves." },
            { tag: "GUIDE", title: "Top hay fever hacks for the rainy season", body: "Keep those pesky allergies at bay with these tips." },
            { tag: "MONEY", title: "How to save on electricity bills", body: "Cost of living going up — keep your energy bills down with these tips." },
          ].map((a) => (
            <article key={a.title} className="rounded-2xl border border-border bg-card overflow-hidden hover:shadow-md transition">
              <div className="h-40 bg-gradient-to-br from-primary/20 via-surface-warm to-surface-soft" />
              <div className="p-5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-primary">{a.tag}</div>
                <h3 className="mt-1 font-display text-lg text-ink leading-snug">{a.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{a.body}</p>
                <button className="mt-3 text-sm font-bold text-primary hover:underline">Read more →</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}

const LOGGED_IN_CHIPS = [
  { icon: Truck, label: "Help me move home" },
  { icon: Brush, label: "End of lease cleaning" },
  { icon: Wrench, label: "Fix my washing machine" },
  { icon: TreeDeciduous, label: "Mow my backyard" },
];

const LOGGED_IN_TOPCATS = [
  { icon: TreeDeciduous, label: "Gardening" },
  { icon: Paintbrush, label: "Painting" },
  { icon: Sparkle, label: "Cleaning" },
  { icon: Truck, label: "Removals" },
  { icon: Wrench, label: "Repairs and Installations" },
  { icon: ClipboardList, label: "Admin" },
];

const LOGGED_IN_GRID = [
  { icon: Briefcase, label: "Business & Admin" },
  { icon: Laptop, label: "Computers & IT" },
  { icon: Package, label: "Furniture Assembly" },
  { icon: Hammer, label: "Handyman" },
  { icon: Paintbrush, label: "Marketing & Design" },
  { icon: Camera, label: "Events & Photography" },
  { icon: Sparkles, label: "Fun & Quirky" },
  { icon: TreeDeciduous, label: "Home & Gardening" },
  { icon: Star, label: "Anything" },
];

function LoggedInHome() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <TaskHeader />

      {/* HERO — purple */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
          <h1 className="font-display text-4xl sm:text-6xl leading-tight">Post a task. Get it done.</h1>
          <form
            onSubmit={(e) => { e.preventDefault(); navigate({ to: "/post-task" } as any); }}
            className="mt-7 flex items-stretch gap-0 rounded-full bg-background overflow-hidden shadow-xl max-w-3xl"
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="In a few words, what do you need done?"
              className="flex-1 bg-transparent px-5 py-3 text-foreground placeholder:text-muted-foreground outline-none"
            />
            <button className="inline-flex items-center gap-1.5 bg-ink text-background px-5 sm:px-6 text-sm font-bold whitespace-nowrap">
              Get Offers <MoveRight className="h-4 w-4" />
            </button>
          </form>
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {LOGGED_IN_CHIPS.map((c) => (
              <Link
                key={c.label}
                to="/post-task"
                className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-primary-foreground/40 bg-primary-foreground/10 px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary-foreground/20"
              >
                <c.icon className="h-3.5 w-3.5" /> {c.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* TOP CATEGORIES — chips */}
      <section className="bg-surface-soft">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
          <h2 className="font-bold text-ink text-lg">Our top categories</h2>
          <p className="text-sm text-muted-foreground">Find the help you need on Find-task</p>
          <div className="mt-5 flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            {LOGGED_IN_TOPCATS.map((c) => (
              <Link
                key={c.label}
                to="/tasks/categories"
                className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-ink hover:border-primary"
              >
                <c.icon className="h-4 w-4 text-primary" /> {c.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* GET IT DONE TODAY */}
      <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 py-12">
        <h2 className="font-bold text-ink text-2xl">Get it done today</h2>
        <p className="text-sm text-muted-foreground max-w-2xl mt-1">
          To-do list never getting shorter? Take the burden off and find the help you need on Find-task.
        </p>
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {LOGGED_IN_GRID.map((c) => (
            <Link
              key={c.label}
              to="/tasks/categories"
              className="rounded-xl border border-border bg-card p-5 flex flex-col items-center justify-center text-center gap-2 hover:border-primary hover:shadow-md transition min-h-[110px]"
            >
              <c.icon className="h-6 w-6 text-ink" />
              <div className="text-[13px] font-semibold text-ink leading-tight">{c.label}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-surface-soft">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 text-center">
          <div className="text-sm text-muted-foreground">Can't find what you need?</div>
          <Link
            to="/post-task"
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:opacity-90"
          >
            Post a task & get offers
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function RandomTasksRail() {
  const list = useServerFn(listTasks);
  const q = useQuery({
    queryKey: ["random-tasks"],
    queryFn: () => list({ data: { sort: "random", limit: 8, page: 1 } }),
    staleTime: 60_000,
  });
  const items: any[] = (() => {
    const d: any = q.data?.ok ? q.data.data : null;
    if (!d) return [];
    if (Array.isArray(d)) return d;
    return d.tasks ?? d.results ?? d.data ?? d.items ?? [];
  })();
  return (
    <section className="bg-surface-warm border-y border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl text-ink inline-flex items-center gap-2">
              <Shuffle className="h-7 w-7 text-primary" /> Random tasks happening now
            </h2>
            <p className="mt-1 text-muted-foreground">A live snapshot of what people across Nigeria need done today.</p>
          </div>
          <Link to="/tasks/browse" search={{ q: "", category_id: 0, location: "", is_remote: 0, page: 1 } as any} className="text-sm font-bold text-primary hover:underline">
            Browse all tasks →
          </Link>
        </div>
        <div className="mt-6">
          {q.isLoading ? (
            <div className="flex items-center justify-center gap-2 text-muted-foreground py-12">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading live tasks…
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
              No open tasks just now — check back soon.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {items.slice(0, 8).map((t: any) => (
                <TaskCard key={t.task_id ?? t.id} task={toCardData(t)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}


