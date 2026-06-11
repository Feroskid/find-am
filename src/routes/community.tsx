import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, ShieldCheck, Heart, MessageSquare, Award, Sparkles, ArrowRight } from "lucide-react";
import { TaskHeader } from "@/components/TaskHeader";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Find-task Community — Stories, guidelines & help" },
      { name: "description", content: "Read tasker stories, community guidelines and join the Find-task Nigeria community." },
    ],
  }),
  component: Community,
});

const STORIES = [
  { name: "Chinaza · Lagos", role: "Top Cleaner", body: "I started on Find-task between jobs. Six months later it's my main income — I earn more than my old admin role and I pick my own hours." },
  { name: "Emeka · Abuja", role: "Handyman", body: "Most weeks I get 4–6 jobs through Find-task. The escrow means I never chase payment again. Big difference." },
  { name: "Fola · Port Harcourt", role: "Designer", body: "Remote tasks are how I built my portfolio. Today I have repeat clients who book me directly through the platform." },
];

const GUIDELINES = [
  { icon: ShieldCheck, title: "Stay on-platform", body: "Keep payments and chat inside Find-task so escrow and dispute support protect you." },
  { icon: Heart, title: "Be kind & professional", body: "Treat every Poster and Tasker with respect — even when you disagree." },
  { icon: MessageSquare, title: "Communicate early", body: "Update the other party as soon as something changes. Silence is the #1 cause of disputes." },
  { icon: Award, title: "Earn your rating", body: "A 5-star task is one delivered fully, on time, and politely." },
];

function Community() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TaskHeader />
      <main className="flex-1">
        <section className="bg-gradient-to-br from-primary/10 via-background to-background border-b border-border">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-20">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" /> The Find-task community
            </span>
            <h1 className="mt-4 text-4xl sm:text-5xl font-black tracking-tight">
              Real people. Real work. <span className="text-primary">Real impact.</span>
            </h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Over a million Nigerians have used Find-am to find work, talent, and a way to earn on their own terms.
              Read their stories, learn the rules, and join the conversation.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/register" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
                Join Find-task <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#guidelines" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold hover:bg-muted">
                Community guidelines
              </a>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-14">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight inline-flex items-center gap-2"><Users className="h-6 w-6 text-primary" /> Stories from the community</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {STORIES.map((s) => (
              <div key={s.name} className="rounded-2xl border border-border bg-card p-6">
                <div className="text-xs uppercase tracking-wide text-primary font-semibold">{s.role}</div>
                <p className="mt-3 text-foreground/90">“{s.body}”</p>
                <div className="mt-4 text-sm font-medium">{s.name}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="guidelines" className="bg-muted/40 py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Community guidelines</h2>
            <p className="mt-2 text-muted-foreground">A few simple rules that keep Find-task safe and fair for everyone.</p>
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {GUIDELINES.map((g) => (
                <div key={g.title} className="rounded-2xl border border-border bg-card p-5">
                  <g.icon className="h-6 w-6 text-primary" />
                  <h3 className="mt-3 font-semibold">{g.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{g.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-14">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Need help?</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <a href="mailto:hello@find-am.com" className="rounded-2xl border border-border bg-card p-6 hover:border-primary">
              <div className="font-semibold">Email support</div>
              <p className="mt-1 text-sm text-muted-foreground">hello@find-am.com — we usually respond within 24 hours.</p>
            </a>
            <Link to="/terms" className="rounded-2xl border border-border bg-card p-6 hover:border-primary">
              <div className="font-semibold">Terms & privacy</div>
              <p className="mt-1 text-sm text-muted-foreground">Read the full Terms of Service and our Privacy summary.</p>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
