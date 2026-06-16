import { createFileRoute, Link } from "@tanstack/react-router";
import { TaskHeader } from "@/components/TaskHeader";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Find-task" },
      { name: "description", content: "How Find-task (Integer Tech Ltd) collects, uses, stores, shares and protects your personal data under the NDPA." },
      { property: "og:title", content: "Find-task Privacy Policy" },
      { property: "og:description", content: "Our privacy commitments to Find-task users in Nigeria." },
    ],
  }),
  component: Privacy,
});

const SECTIONS = [
  ["who", "1. Who we are"],
  ["info", "2. Information we collect"],
  ["use", "3. How we use your information"],
  ["legal", "4. Legal basis for processing"],
  ["share", "5. How we share your information"],
  ["protect", "6. How we protect your information"],
  ["retention", "7. Data retention"],
  ["rights", "8. Your rights"],
  ["children", "9. Children"],
  ["changes", "10. Changes to this policy"],
  ["contact", "11. Contact us"],
];

function Privacy() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TaskHeader />
      <main className="flex-1 mx-auto max-w-6xl w-full px-4 sm:px-6 py-12 grid gap-8 md:grid-cols-[240px_1fr]">
        <aside className="md:sticky md:top-28 self-start rounded-2xl border border-border bg-card p-4 h-fit">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">On this page</div>
          <ul className="mt-2 space-y-1 text-sm">
            {SECTIONS.map(([id, title]) => (
              <li key={id}><a href={`#${id}`} className="text-foreground/80 hover:text-primary">{title}</a></li>
            ))}
          </ul>
        </aside>

        <article className="prose prose-sm max-w-none dark:prose-invert">
          <header>
            <div className="text-xs uppercase tracking-wider text-primary font-bold">Privacy Policy</div>
            <h1 className="font-display text-4xl text-ink mt-1">Find-task Privacy Policy</h1>
            <p className="text-muted-foreground">Operated by Integer Tech Ltd · Effective June 2026 · Last updated June 2026</p>
          </header>

          <p className="mt-6">
            Integer Tech Ltd ("Integer Tech," "we," "us," or "our") owns and operates the Find-task platform ("Find-task" or the "Platform"). This Privacy Policy explains how we collect, use, store, share, and protect your personal data when you use the Platform.
          </p>
          <p>
            We process personal data in accordance with the Nigeria Data Protection Act (NDPA) and other applicable data protection laws. By using Find-task, you acknowledge the practices described in this Policy.
          </p>

          <section id="who" className="mt-8"><h2>1. Who we are</h2>
            <p>Integer Tech Ltd is the data controller responsible for your personal data on the Find-task Platform. For any privacy-related questions or requests, contact us at <a href="mailto:hello@find-am.com">hello@find-am.com</a>.</p>
          </section>

          <section id="info" className="mt-6"><h2>2. Information we collect</h2>
            <h3>2.1 Account Information</h3>
            <ul>
              <li>Name</li><li>Email address</li><li>Phone number</li>
              <li>Password (stored only in encrypted/hashed form, never in plain text)</li>
              <li>Account type (individual or company)</li>
            </ul>
            <h3>2.2 Identity and Verification Information</h3>
            <ul>
              <li>Bank Verification Number (BVN), verified through our verification provider. We do not store your raw BVN; we store only a one-way hashed result of the verification, which cannot be reversed back into your BVN.</li>
              <li>Bank account details (account number, bank, account name) used for processing withdrawals.</li>
            </ul>
            <h3>2.3 Transaction and Financial Information</h3>
            <ul>
              <li>Task details, budgets, and payments</li>
              <li>Wallet balances and transaction history (credits, debits, withdrawals)</li>
              <li>Records of fees charged</li>
            </ul>
            <h3>2.4 Location Information</h3>
            <ul><li>Geographic coordinates associated with Tasks, used to enable location-based ("near me") search and to display Task locations.</li></ul>
            <h3>2.5 Usage, Device, and Session Information</h3>
            <ul><li>Device type and IP address</li><li>Login sessions and activity records</li><li>Interactions with the Platform (such as searches and views)</li></ul>
            <h3>2.6 Communications and Content</h3>
            <ul><li>Messages exchanged between Users in relation to a Task</li><li>Ratings and reviews you submit</li><li>Profile information and any profile image you choose to upload</li></ul>
          </section>

          <section id="use" className="mt-6"><h2>3. How we use your information</h2>
            <ul>
              <li>Create and manage your account</li>
              <li>Provide and operate the Platform's core features (posting Tasks, applying, matching, messaging)</li>
              <li>Verify your identity, particularly before allowing withdrawals</li>
              <li>Process payments and manage your in-platform Wallet</li>
              <li>Prevent, detect, and investigate fraud, abuse, and prohibited activity</li>
              <li>Resolve disputes between Users</li>
              <li>Enable location-based search</li>
              <li>Send essential service communications (verification emails, password resets, account, payment, and status notifications)</li>
              <li>Comply with legal and regulatory obligations</li>
              <li>Maintain the security and integrity of the Platform</li>
            </ul>
          </section>

          <section id="legal" className="mt-6"><h2>4. Legal basis for processing</h2>
            <ul>
              <li><strong>Performance of a contract</strong> — to provide the services you signed up for</li>
              <li><strong>Consent</strong> — where you have given it</li>
              <li><strong>Legal obligation</strong> — to comply with applicable laws, including financial and identity-verification requirements</li>
              <li><strong>Legitimate interests</strong> — to operate, secure, and improve the Platform, and to prevent fraud, in a manner consistent with your rights</li>
            </ul>
          </section>

          <section id="share" className="mt-6"><h2>5. How we share your information</h2>
            <h3>5.1 Service Providers</h3>
            <p>We share personal data with trusted third-party service providers who process it on our behalf, only as necessary to operate the Platform. These include payment processors, identity verification providers, and email service providers. These providers are required to handle your data securely and only for the purposes we specify.</p>
            <h3>5.2 Legal and Regulatory Disclosure</h3>
            <p>We may disclose personal data where required by law, regulation, court order, or lawful request by a competent authority, or where necessary to protect our rights, Users, or the public.</p>
            <h3>5.3 Business Transfers</h3>
            <p>If Integer Tech Ltd is involved in a merger, acquisition, or sale of assets, personal data may be transferred as part of that transaction, subject to this Policy.</p>
          </section>

          <section id="protect" className="mt-6"><h2>6. How we protect your information</h2>
            <ul>
              <li>Hashing of passwords and BVN verification results</li>
              <li>Restricted access to systems holding personal data</li>
              <li>Use of reputable, security-conscious third-party providers</li>
            </ul>
            <p>No system is completely secure, and we cannot guarantee absolute security. You are responsible for keeping your account credentials confidential.</p>
          </section>

          <section id="retention" className="mt-6"><h2>7. Data retention</h2>
            <ul>
              <li>We retain your personal data while your account is active.</li>
              <li>After your account is closed, we retain <strong>transaction and financial records</strong> for as long as required by applicable law (for example, for tax, accounting, and regulatory purposes).</li>
              <li>Other personal data is deleted within <strong>twelve (12) months</strong> of account closure, except where we are legally required or permitted to retain it longer.</li>
            </ul>
          </section>

          <section id="rights" className="mt-6"><h2>8. Your rights</h2>
            <ul>
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccurate or incomplete data</li>
              <li>Request deletion of your data, where lawful and where we are not required to retain it</li>
              <li>Object to or restrict certain processing</li>
              <li>Withdraw consent where processing is based on consent</li>
            </ul>
            <p>To exercise any of these rights, contact us at <a href="mailto:hello@find-am.com">hello@find-am.com</a>. We may need to verify your identity before acting on a request.</p>
          </section>

          <section id="children" className="mt-6"><h2>9. Children</h2>
            <p>Find-task is not intended for anyone under the age of eighteen (18). We do not knowingly collect personal data from minors. If we become aware that we have collected data from a minor, we will take steps to delete it.</p>
          </section>

          <section id="changes" className="mt-6"><h2>10. Changes to this policy</h2>
            <p>We may update this Privacy Policy from time to time. Updated versions will be published on the Platform with a revised "Last Updated" date. Your continued use of the Platform after changes take effect constitutes acceptance of the updated Policy.</p>
          </section>

          <section id="contact" className="mt-6"><h2>11. Contact us</h2>
            <p>For questions, concerns, or requests regarding this Privacy Policy or your personal data:</p>
            <p><strong>Integer Tech Ltd</strong><br/>Email: <a href="mailto:hello@find-am.com">hello@find-am.com</a></p>
            <p className="mt-4"><Link to="/terms" className="text-primary font-semibold">Read our Terms of Service →</Link></p>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  );
}
