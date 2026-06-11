import { createFileRoute, Link } from "@tanstack/react-router";
import { TaskHeader } from "@/components/TaskHeader";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Privacy — Find-task" },
      { name: "description", content: "The Find-task Terms of Service and Privacy summary." },
    ],
  }),
  component: Terms,
});

const SECTIONS = [
  { id: "overview", title: "1. Overview" },
  { id: "accounts", title: "2. Your account" },
  { id: "tasks", title: "3. Posting and accepting tasks" },
  { id: "payments", title: "4. Payments, escrow & fees" },
  { id: "conduct", title: "5. Conduct & safety" },
  { id: "disputes", title: "6. Disputes & refunds" },
  { id: "privacy", title: "7. Privacy summary" },
  { id: "termination", title: "8. Termination" },
  { id: "contact", title: "9. Contact" },
];

function Terms() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TaskHeader />
      <main className="flex-1 mx-auto max-w-6xl w-full px-4 sm:px-6 py-12 grid gap-8 md:grid-cols-[220px_1fr]">
        <aside className="md:sticky md:top-28 self-start rounded-2xl border border-border bg-card p-4 h-fit">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">On this page</div>
          <ul className="mt-2 space-y-1 text-sm">
            {SECTIONS.map((s) => <li key={s.id}><a href={`#${s.id}`} className="text-foreground/80 hover:text-primary">{s.title}</a></li>)}
          </ul>
        </aside>

        <article className="prose prose-sm max-w-none dark:prose-invert">
          <h1 className="text-3xl font-bold tracking-tight">Find-task Terms & Privacy</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

          <section id="overview" className="mt-8">
            <h2>1. Overview</h2>
            <p>Find-task is a marketplace connecting Posters (people who need a task done) with Taskers (people who get the task done) across Nigeria. By using Find-task you agree to these terms.</p>
          </section>

          <section id="accounts" className="mt-6">
            <h2>2. Your account</h2>
            <p>You must be at least 18 to use Find-task. One account per person. You're responsible for the activity on your account. Keep your password safe and verify your email and phone for the best experience.</p>
          </section>

          <section id="tasks" className="mt-6">
            <h2>3. Posting and accepting tasks</h2>
            <ul>
              <li>Posters describe the task accurately and set a fair budget (minimum ₦2,000).</li>
              <li>Taskers may only apply for tasks they are qualified and equipped to perform.</li>
              <li>Tasks auto-expire after 30 days if no Tasker is accepted.</li>
              <li>Illegal, dangerous, or sexually-explicit tasks are prohibited and will be removed.</li>
            </ul>
          </section>

          <section id="payments" className="mt-6">
            <h2>4. Payments, escrow & fees</h2>
            <p>When a Poster accepts a Tasker, the budget is held in escrow via Paystack. Funds are released when the Poster marks the task complete. Find-task collects:</p>
            <ul>
              <li>A 10% service fee on the budget</li>
              <li>A flat ₦100 processing fee</li>
              <li>7.5% VAT on the service fee (Nigerian law)</li>
            </ul>
          </section>

          <section id="conduct" className="mt-6">
            <h2>5. Conduct & safety</h2>
            <p>Be respectful. Don't share contact details to take payments off-platform — doing so removes our escrow protection and may get your account suspended.</p>
          </section>

          <section id="disputes" className="mt-6">
            <h2>6. Disputes & refunds</h2>
            <p>Either party may raise a dispute from the task workspace. Our team reviews the conversation, evidence, and task history before releasing or refunding the escrowed funds.</p>
          </section>

          <section id="privacy" className="mt-6">
            <h2>7. Privacy summary</h2>
            <p>We collect only what we need to run the marketplace: your name, contact details, payment account, and task activity. We never sell your data. You can request export or deletion at any time by emailing privacy@find-am.com.</p>
            <p>Messages between Posters and Taskers are encrypted in transit. In-task chat content is encrypted client-side per task before transmission, so casual database reads cannot see the message contents.</p>
          </section>

          <section id="termination" className="mt-6">
            <h2>8. Termination</h2>
            <p>You may close your account at any time. We may suspend or close accounts that violate these terms or applicable law.</p>
          </section>

          <section id="contact" className="mt-6">
            <h2>9. Contact</h2>
            <p>Questions? Reach us at <a href="mailto:hello@find-am.com">hello@find-am.com</a>. See also our <Link to="/community">Community guidelines</Link>.</p>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  );
}
