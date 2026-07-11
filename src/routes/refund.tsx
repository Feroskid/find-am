import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/refund")({
  head: () => ({
    meta: [
      { title: "Refund Policy — Find-task" },
      { name: "description", content: "How and when refunds are issued on the Find-task platform." },
      { property: "og:title", content: "Refund Policy — Find-task" },
      { property: "og:description", content: "Find-task Refund Policy by Integer Tech Ltd." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RefundPage,
});

function RefundPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/60 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center gap-3">
          <Link to="/" className="p-2 rounded-full hover:bg-muted"><ArrowLeft className="h-4 w-4" /></Link>
          <h1 className="font-semibold">Refund Policy</h1>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10 prose prose-neutral dark:prose-invert max-w-none">
        <h1 className="font-display text-3xl sm:text-4xl text-ink !mb-2">Refund Policy</h1>
        <p className="text-sm text-muted-foreground !mt-0">
          <strong>Find-task</strong> (operated by Integer Tech Ltd)<br />
          <strong>Effective Date:</strong> July 2026 · <strong>Last Updated:</strong> July 2026
        </p>
        <hr />
        <p>
          This Refund Policy explains how and when refunds are issued on the Find-task platform, operated by Integer Tech Ltd ("Integer Tech," "we," "us," or "our"). By using Find-task, you agree to this Policy. It should be read together with our Terms of Service.
        </p>

        <h2>1. How task funding works</h2>
        <p>
          When an Employer accepts a Tasker for a Task, the Employer pays the Task Price together with the applicable Service Fee, Platform Maintenance Fee, and taxes. These funds are held by Integer Tech, through our payment provider, until the Task is completed or otherwise resolved.
        </p>
        <p>A Task is only funded once a Tasker has been accepted. Tasks that are never accepted are never charged.</p>

        <h2>2. Fees are non-refundable</h2>
        <p>
          The Service Fee, Platform Maintenance Fee, and applicable taxes are <strong>non-refundable</strong>. Where a refund is issued, it applies to the <strong>Task Price only</strong>, and not to any fees or taxes.
        </p>

        <h2>3. Cancellation before a Tasker is assigned</h2>
        <p>
          An Employer may cancel a Task at any time <strong>before a Tasker is assigned</strong>, at no cost. Because a Task is only funded at the point a Tasker is accepted, no payment is involved in such a cancellation, and there is nothing to refund.
        </p>
        <p>There is no cancellation penalty for cancelling a Task before a Tasker is assigned.</p>

        <h2>4. After a Tasker is assigned</h2>
        <p>
          Once a Tasker has been accepted and the Task is funded, the Task cannot be unilaterally cancelled. If an Employer or Tasker wishes to end or contest the Task, this is handled through our <strong>dispute process</strong> (see Section 5).
        </p>

        <h2>5. Disputes and refunds</h2>
        <p>If there is a disagreement about a funded Task, either party may raise a dispute.</p>
        <ul>
          <li>Integer Tech will review the dispute based on the information and evidence available to it.</li>
          <li>Disputes are reviewed and resolved within <strong>three (3) working days</strong>.</li>
          <li>
            Following review, Integer Tech may, at its discretion:
            <ul>
              <li>Release the funds to the Tasker;</li>
              <li>Refund the Task Price (in whole or in part) to the Employer; or</li>
              <li>Apply any combination it considers fair.</li>
            </ul>
          </li>
        </ul>
        <p>
          For example, where a Task has not been started and the Tasker raises no valid objection, the Task Price is refunded in full to the Employer (excluding non-refundable fees).
        </p>
        <p>Integer Tech's determination is final and binding on the parties, except where the intervention of a court or other lawful authority is required.</p>

        <h2>6. How refunds are issued</h2>
        <p>Approved refunds are credited to the Employer's <strong>Find-task Wallet</strong>.</p>
        <p>Wallet funds may be:</p>
        <ul>
          <li>Used to fund new Tasks on the platform; or</li>
          <li>Withdrawn to the Employer's bank account, subject to identity verification and our withdrawal terms.</li>
        </ul>
        <p>Refunds are credited to the Wallet promptly once a dispute is resolved in the Employer's favour.</p>

        <h2>7. Post-completion disputes</h2>
        <p>
          Where payment has already been released to a Tasker, a dispute may still be raised for a limited period after release, as provided on the platform. After that period, released funds are no longer subject to dispute through Find-task.
        </p>

        <h2>8. Contact</h2>
        <p>
          For questions about this Refund Policy or a specific refund, contact us at{" "}
          <a href="mailto:Integerpj@gmail.com" className="text-primary font-semibold">Integerpj@gmail.com</a>.
        </p>

        <hr />
        <p className="text-xs text-muted-foreground italic">
          Integer Tech Ltd reserves the right to update this Refund Policy. Updated versions will be published on the platform with a revised "Last Updated" date.
        </p>
      </main>
    </div>
  );
}
