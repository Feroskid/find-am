import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, CircleHelp } from "lucide-react";
import { TaskHeader } from "@/components/TaskHeader";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Frequently asked questions — Find-task" },
      {
        name: "description",
        content: "Answers about trust, payments, safety, milestones, tasks and job listings on Find-am and Find-task.",
      },
      { property: "og:title", content: "Frequently asked questions — Find-task" },
      {
        property: "og:description",
        content: "Answers about trust, payments, safety, milestones, tasks and job listings on Find-am and Find-task.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://find-am.com/faq" }],
  }),
  component: FaqPage,
});

const FAQ_SECTIONS = [
  {
    id: "trust",
    title: "Trust and legitimacy",
    questions: [
      ["Is this a scam?", "No. Find-am is a product of Integer Tech Ltd., a company registered under Nigerian law. Every user on the platform is identity-verified through a licensed verification provider, payments are processed and held by a licensed secure payment gateway, and every task ends with a two-way review. We built Find-am precisely because working with strangers in Nigeria has been risky for too long."],
      ["Who is behind Find-am?", "Find-am is built by Integer Tech Ltd., a Nigerian technology company founded by Akeredolu Boluwatife, with co-founders Adeyomoye Feranmi and Olanibi Daniel."],
      ["Is my money safe?", "Yes. When you fund a task, that money is not paid to the Tasker straight away and it does not become Find-am's money. It is processed and held by Flutterwave, a licensed payment provider regulated by the Central Bank of Nigeria, and is only released when the work is done."],
      ["What happens to my money if Find-am shuts down?", "Funds on the platform are not company revenue and are not held by Integer Tech. They are held through our secure payment gateway and remain attached to the transaction they belong to."],
    ],
  },
  {
    id: "money",
    title: "Money",
    questions: [
      ["Is it free to post a task?", "Yes. Posting a task costs nothing. You are only charged when you accept an applicant and fund the task."],
      ["What does Find-am charge?", "A 10% service fee, plus ₦100, plus VAT. That is the full cost. There are no hidden charges, and the total is calculated and shown to you at the point of posting, before you commit to anything."],
      ["Who pays the fee, the poster or the Tasker?", "The poster. Taskers are not charged anything. Because the total is shown to you upfront, you can decide how to structure it: if you have ₦5,000 to spend, you can either offer ₦5,000 and pay a little above it, or offer slightly less so the total lands closer to your budget. The choice is yours."],
      ["When does the Tasker get paid?", "When the task is completed and you release the payment. If you do not release it, payment is automatically released after five days, so nobody's work goes unpaid because a poster went quiet. If a dispute is open, that countdown pauses until the dispute is resolved."],
      ["How long does it take to reach my bank account?", "Withdrawals are almost immediate, typically under five minutes."],
      ["Are there withdrawal fees?", "No."],
      ["Can I get a refund?", "Yes. If a task goes wrong, you raise a dispute and a refund can be issued as part of the resolution. If a transaction fails at the point of accepting a Tasker, the refund is automatic."],
    ],
  },
  {
    id: "safety",
    title: "Safety and verification",
    questions: [
      ["Why do you need my BVN?", "Nigerian law requires identity verification for financial transactions. Your BVN confirms that you are a real, identifiable person, which is what makes the platform safe for everyone else on it."],
      ["Is my BVN safe?", "Yes. Verification is carried out through a licensed third-party provider, and we do not store your BVN."],
      ["How are Taskers verified?", "Every user completes identity verification before transacting, and we hold their registered name, phone number, email and, where enabled, location. This means everyone on Find-am is traceable. Note that identity verification confirms who a person is; it is not a skills certification."],
      ["Can I see someone's ratings before I choose them?", "Yes, and you should. Every applicant's profile shows their completed tasks, their rating and what previous users said about them. A slightly higher offer from someone with a strong history is usually the better decision."],
      ["Is it safe to let a Tasker into my home or hostel?", "Several things protect you. The person is identity-verified and traceable. You can see their full rating history before you accept them. Messages on the platform are monitored. Location is tracked where enabled. And if anything makes you uncomfortable, you can raise a dispute, which can result in that account being frozen or permanently banned. Beyond that, ordinary care applies as it would with anyone visiting your space."],
      ["What if someone behaves badly?", "Raise a dispute. Disputes are not only for money. If someone is aggressive, dishonest, unsafe, or simply not who they said they were, that is grounds for a dispute, and outcomes include freezing or permanently banning the account. A permanent ban is tied to identity, not to an email address, so a banned user cannot simply open another account."],
    ],
  },
  {
    id: "problems",
    title: "When things go wrong",
    questions: [
      ["What if the Tasker doesn't show up?", "Raise a dispute. Where the Tasker is at fault, you are refunded."],
      ["What if the work is bad?", "Raise a dispute. You have two days after a task is completed and payment released to do so."],
      ["What if we disagree about whether the task was done?", "An admin reviews the dispute using the messages and attachments shared in the workspace, and may speak to each party separately. Decisions are made within three days. There are four possible outcomes: refund the poster, release to the Tasker, split the payment, or dismiss the dispute."],
      ["What if the poster won't release my money?", "Payment is automatically released to you after five days."],
      ["Can I cancel after I've accepted someone?", "You can cancel freely at any point before you pay. Payment is what opens the workspace between you and your Tasker. After that, cancelling means raising a dispute, because money is already committed."],
    ],
  },
  {
    id: "using-findam",
    title: "Using Find-am",
    questions: [
      ["How do I post a task?", "Tap \"Post a task\" or the + button and follow the steps: what you need done, where, when, and what you're offering to pay."],
      ["How do I decide what to pay?", "Look through similar tasks on the platform and price accordingly. A fair price attracts good applicants; an unfair one attracts nobody."],
      ["Can I message a Tasker before accepting them?", "Taskers can send one message when they apply, and can also propose an earliest start date. Posters cannot reply until they accept. This keeps applications free of spam and makes every applicant's pitch count. Because of this, put your requirements in the task description: if you need someone with a car, or someone who can start before 4pm, say so upfront."],
      ["I'm a Tasker. How do I make my application stand out?", "You get one message, so use it. Say why you're right for this specific task, what you've done before, and when you can start. A vague hello loses to a clear pitch every time."],
      ["Can one account both post tasks and do tasks?", "Yes. It's a single account and one toggle. You never need a second one."],
      ["Where is Find-am available?", "Across Nigeria. Physical tasks depend on people being near you, while remote tasks such as design, editing and business support can be done from anywhere in the country."],
    ],
  },
  {
    id: "taskers",
    title: "For Taskers",
    questions: [
      ["How do I start earning?", "Complete your verification, then apply to tasks you can genuinely do. You don't need certificates or prior experience to begin."],
      ["How do I build a good rating?", "Deliver what you promised, communicate clearly, and show up when you said you would. Ratings are the most valuable thing you own on Find-am: they're what convinces the next poster to choose you, and they compound. Repeated poor ratings damage your reputation and reduce how often your applications are seen."],
      ["How many tasks can I take at once?", "There's no limit. Be realistic though. Accepting more than you can deliver leads to disputes and damaged ratings."],
    ],
  },
  {
    id: "milestones",
    title: "Milestones",
    questions: [
      ["What are milestones?", "Some tasks are too big to be one delivery. Milestones let you break a task into stages, with an amount attached to each one, so payment moves as the work moves."],
      ["When should I use milestones?", "When work happens in stages and both sides want to see progress before the whole thing is done. A logo with drafts and revisions, a multi-day move, a project done section by section."],
      ["How do I set milestones?", "When posting, tick the milestone option and break the task into stages, setting the amount for each. The stages and their values are visible to applicants before they apply, so everyone knows what they're agreeing to."],
      ["Can more than one Tasker work on a milestone task?", "No. A task with milestones is assigned to one Tasker only."],
      ["Do I pay for each milestone separately?", "No. You fund the full amount once, at the start. It's held from there and released stage by stage as each milestone is marked complete."],
      ["How does a Tasker get paid on a milestone task?", "Each time a milestone is marked complete, the poster releases payment for it. That portion is released to them. They see their money move as the work progresses rather than waiting until the very end."],
      ["What if we disagree partway through?", "Raise a dispute, same as any task. Milestones already completed and released are done. The remainder is what an admin reviews."],
    ],
  },
  {
    id: "jobs",
    title: "Find-am jobs",
    questions: [
      ["What's the difference between Find-am and Find-task?", "Find-am is a job search engine that gathers current job openings across Nigeria for people looking for employment. Find-task is the marketplace for shorter-term earning opportunities, skilled and unskilled. Both live in the same place."],
      ["Where do the jobs come from?", "Our system searches the internet for current openings and brings them together so you can see them in one place. We don't post jobs ourselves and we don't collect applications. Every listing links to its original source, and that's where you apply."],
      ["Is applying free?", "Yes. Find-am sends you to the employer's own application page. We never charge you to apply, and we never ask you to pay for a job."],
      ["Are the listings current?", "Listings are updated regularly and we remove expired roles as they close. Because jobs are posted by employers on their own sites, always confirm on the source page before applying."],
    ],
  },
] as const;

function FaqPage() {
  return (
    <div className="min-h-screen bg-background">
      <TaskHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
            <CircleHelp className="h-4 w-4" /> Find-am help centre
          </div>
          <h1 className="mt-3 font-display text-4xl text-ink sm:text-5xl">Frequently asked questions</h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Straight answers about how Find-am and Find-task work, from posting a task to getting paid.
          </p>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[220px_1fr]">
          <nav aria-label="FAQ topics" className="h-fit lg:sticky lg:top-28">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">On this page</p>
            <ul className="space-y-1 border-l border-border pl-4 text-sm">
              {FAQ_SECTIONS.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="block py-1.5 text-muted-foreground transition-colors hover:text-primary">
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-10">
            {FAQ_SECTIONS.map((section) => (
              <section id={section.id} key={section.id} className="scroll-mt-28">
                <h2 className="font-display text-2xl text-ink sm:text-3xl">{section.title}</h2>
                <div className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card">
                  {section.questions.map(([question, answer]) => (
                    <details key={question} className="group px-5 first:rounded-t-2xl last:rounded-b-2xl open:bg-primary-soft/30 sm:px-6">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                        <span>{question}</span>
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                      </summary>
                      <p className="max-w-3xl pb-5 pr-8 text-sm leading-7 text-muted-foreground">{answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}