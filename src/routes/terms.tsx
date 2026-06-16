import { createFileRoute, Link } from "@tanstack/react-router";
import { TaskHeader } from "@/components/TaskHeader";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Find-task" },
      { name: "description", content: "The Integer User Agreement governing use of the Find-task platform." },
      { property: "og:title", content: "Find-task Terms of Service" },
      { property: "og:description", content: "Integer User Agreement for Find-task." },
    ],
  }),
  component: Terms,
});

const SECTIONS = [
  ["definitions", "1. Definitions"],
  ["nature", "2. Nature of the platform"],
  ["eligibility", "3. Eligibility"],
  ["accounts", "4. User accounts"],
  ["tasks", "5. Posted tasks and services"],
  ["payments", "6. Payments, escrow, and fees"],
  ["liability", "7. Liability, disclaimers & indemnity"],
  ["disputes", "8. Dispute resolution"],
  ["data", "9. Data protection and privacy"],
  ["ip", "10. Intellectual property"],
  ["termination", "11. Termination"],
  ["modifications", "12. Modifications"],
  ["law", "13. Governing law"],
  ["severability", "14. Severability"],
  ["entire", "15. Entire agreement"],
  ["contact", "16. Contact information"],
];

function Terms() {
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
            <div className="text-xs uppercase tracking-wider text-primary font-bold">Terms of Service</div>
            <h1 className="font-display text-4xl text-ink mt-1">Integer User Agreement</h1>
            <p className="text-muted-foreground">Effective June 2026 · Last updated June 2026</p>
          </header>

          <p className="mt-6">THIS TERMS OF SERVICE AGREEMENT constitutes a legally binding agreement between <strong>Integer Tech Ltd</strong> ("Integer Tech," "we," "us," or "our"), the company that owns and operates the Find-task platform, and any person, business, company, organization, or entity ("User," "you") accessing or using the Find-task Platform.</p>
          <p>By accessing, browsing, registering on, or using Find-task in any manner whatsoever, you acknowledge that you have read, understood, and agreed to be bound by this Agreement, including all policies incorporated herein by reference. If you do not agree to these Terms, you must immediately discontinue use of the Platform.</p>

          <section id="definitions" className="mt-8"><h2>1. Definitions</h2>
            <ul>
              <li><strong>"Platform" or "Find-task"</strong> means the Find-task website, mobile applications, software systems, payment and wallet systems, communication systems, and all related services operated by Integer Tech Ltd.</li>
              <li><strong>"Wallet"</strong> means the in-platform account in which a Worker's earnings are held by Integer Tech Ltd, through its payment providers, pending withdrawal.</li>
              <li><strong>"Employer"</strong> means any individual, company, firm, organization, institution, or business seeking to engage a Worker through the Platform.</li>
              <li><strong>"Worker"</strong> means any individual offering services, applying for employment, freelance, contract, temporary work, internships, or task-based opportunities through the Platform.</li>
              <li><strong>"Task"</strong> means any employment opportunity, freelance engagement, service request, gig, contract, or assignment posted on the Platform.</li>
              <li><strong>"Task Contract"</strong> means any agreement formed directly between an Employer and a Worker through the Platform.</li>
              <li><strong>"Held Funds"</strong> means funds temporarily held by Integer Tech Ltd, through its payment providers, pending completion or resolution of a Task.</li>
              <li><strong>"Fees"</strong> means all charges, commissions, service fees, maintenance fees, taxes, penalties, and other sums payable under this Agreement.</li>
            </ul>
          </section>

          <section id="nature" className="mt-6"><h2>2. Nature of the platform</h2>
            <h3>2.1 Marketplace Technology Platform</h3>
            <p>Find-task operates solely as a technology-enabled marketplace and intermediary platform that facilitates connections between Employers and Workers. Find-task provides: job posting systems; candidate matching systems; communication tools; Held Funds payment services; workforce discovery systems; and related digital marketplace infrastructure.</p>
            <h3>2.2 No Employment Relationship</h3>
            <p>Find-task is not an employer, labor provider, recruitment agency, staffing agency, contractor, subcontractor, or agent of any User. Nothing in this Agreement creates an employer-employee relationship, partnership, joint venture, agency relationship, or fiduciary relationship between Find-task and any User. All relationships formed through the Platform exist solely between the Employer and the Worker. Workers remain independent contractors unless expressly agreed otherwise.</p>
            <h3>2.3 No Guarantee</h3>
            <p>Find-task does not warrant or guarantee employment opportunities, Worker availability, suitability of candidates, quality of services, completion of Tasks, accuracy of User information, legality of posted opportunities, or financial capability of Users. Users engage and transact entirely at their own risk.</p>
          </section>

          <section id="eligibility" className="mt-6"><h2>3. Eligibility</h2>
            <p>You may only use Find-task if you are at least eighteen (18) years old and possess legal capacity to enter binding agreements under applicable law. By using the Platform, you represent and warrant that all information provided by you is true, complete, and accurate; you are legally authorized to enter this Agreement; and your use of the Platform does not violate any applicable law, regulation, or contractual obligation.</p>
          </section>

          <section id="accounts" className="mt-6"><h2>4. User accounts</h2>
            <h3>4.1 Registration</h3>
            <p>Certain features of the Platform require account registration. You agree to provide accurate, complete, and updated information at all times.</p>
            <h3>4.2 Account Security</h3>
            <p>You are solely responsible for maintaining the confidentiality of your account credentials, restricting unauthorized access to your account, and all activities conducted through your account. Find-task shall not be liable for losses arising from unauthorized access caused by your failure to secure your credentials.</p>
            <h3>4.3 Identity Verification</h3>
            <p>Integer Tech Ltd may request identity or compliance verification from any User, including government-issued identification, BVN verification, CAC documentation, tax documentation, utility bills, or any other documentation reasonably necessary. Identity verification (including BVN verification) is <strong>mandatory before a Worker may withdraw funds</strong> from their Wallet. A Worker who has not completed verification may use other features but will be unable to withdraw earnings until verification is successfully completed. Integer Tech Ltd may suspend, restrict, or terminate any account where verification requirements are not satisfied, or where information provided is false, incomplete, or fraudulent.</p>
          </section>

          <section id="tasks" className="mt-6"><h2>5. Posted tasks and services</h2>
            <h3>5.1 Employer Obligations</h3>
            <p>Employers shall post lawful and accurate opportunities; provide safe working conditions; comply with all labor, tax, and employment laws; honour agreed payments; and treat Workers lawfully and respectfully. Employers shall not post fraudulent, illegal, misleading, discriminatory, harmful or exploitative engagements.</p>
            <h3>5.2 Worker Obligations</h3>
            <p>Workers represent and warrant that they possess the necessary skills and qualifications; hold all required licences or certifications; are legally entitled to perform the services offered; and shall perform services competently and lawfully. Workers are solely responsible for taxes, statutory remittances, insurance obligations, and regulatory compliance.</p>
            <h3>5.3 User-Generated Content</h3>
            <p><strong>(a) User Content.</strong> Users may submit content to the Platform, including profile information, profile images, Task descriptions, messages, ratings, and reviews ("User Content"). You are solely responsible for User Content you submit and represent that you have the right to submit it and that it does not infringe the rights of any third party or violate any law.</p>
            <p><strong>(b) Prohibited Content.</strong> You shall not submit content that is unlawful, fraudulent, defamatory, obscene, harassing, hateful, sexually explicit, infringing, or that depicts or endangers minors, or that otherwise violates these Terms.</p>
            <p><strong>(c) Ratings and Reviews.</strong> Ratings and reviews reflect Users' own opinions. Find-task does not author, endorse, or guarantee the accuracy of any rating or review.</p>
            <p><strong>(d) Moderation and Removal.</strong> Find-task may, at its sole discretion and without notice, review, moderate, remove, or restrict any User Content and suspend or terminate any account associated with prohibited content.</p>
            <p><strong>(e) Licence.</strong> By submitting User Content, you grant Integer Tech Ltd a non-exclusive, royalty-free, worldwide licence to host, store, display, and use that content as necessary to operate and provide the Platform.</p>
          </section>

          <section id="payments" className="mt-6"><h2>6. Payments, escrow, and fees</h2>
            <h3>6.1 Pricing</h3>
            <p>The Employer sets the compensation payable for a Task (the "Task Price") when posting the Task.</p>
            <h3>6.2 Platform Held Funding</h3>
            <p>Upon accepting a Worker for a Task, the Employer shall pay, and Find-task shall hold:</p>
            <ul>
              <li>The Task Price;</li>
              <li>A Service Fee of <strong>ten percent (10%)</strong> of the Task Price;</li>
              <li>A Platform Maintenance Fee of <strong>₦100</strong>; and</li>
              <li>Applicable VAT and taxes.</li>
            </ul>
            <h3>6.3 Payment Processing</h3>
            <p>Payments are processed through third-party payment providers including FLUTTERWAVE and other authorized processors. Integer does not store debit or credit card details and shall not be liable for failures attributable to payment processors.</p>
            <h3>6.4 Release to Wallet</h3>
            <p>Subject to dispute provisions below, Find-task shall release Held funds for a completed Task to the Worker's in-platform Wallet, either upon the Employer confirming completion, or automatically <strong>five (5) days</strong> after the Worker marks the Task complete if the Employer has neither released payment nor raised a dispute within that period.</p>
            <h3>6.5 Withdrawals</h3>
            <p>A Worker may withdraw available Wallet funds to their bank account. Withdrawal requires successful identity verification (see Section 4.3). Integer Tech Ltd does not deduct any additional charge from Wallet withdrawals; the full available Wallet amount is payable to the Worker, though the Worker's own bank may apply charges outside the Platform.</p>
            <h3>6.6 Fees Are Non-Refundable</h3>
            <p>The Service Fee, Platform Maintenance Fee, and applicable taxes are non-refundable. Where a refund is issued to an Employer under these Terms, the refund applies to the Task Price only (in whole or in part as determined under Section 8), and not to any fees or taxes.</p>
            <h3>6.7 Non-Circumvention</h3>
            <p>Users shall not solicit, make, or receive payment outside the Platform for engagements initiated through Find-task. Any attempt to circumvent the Platform's payment systems constitutes a material breach and may result in suspension, termination, withholding of funds in accordance with applicable law, and/or legal proceedings.</p>
          </section>

          <section id="liability" className="mt-6"><h2>7. Liability, disclaimers, and indemnity</h2>
            <h3>7.1 Worker Liability</h3>
            <p>Workers shall bear sole and absolute liability for property damage, theft, fraud, negligence, personal injury, and any unlawful conduct arising from services offered and/or performed.</p>
            <h3>7.2 Employer Responsibility</h3>
            <p>Employers bear sole responsibility for workplace safety, compliance with labor laws, insurance obligations, payment obligations, and lawful treatment of Workers.</p>
            <h3>7.3 Disclaimer of Liability</h3>
            <p>Find-task is not liable for any loss, damage, or harm arising from the acts, omissions, or conduct of Users, including the quality or outcome of any Task. The Platform is provided strictly on an "as is" and "as available" basis without warranties of any kind.</p>
            <h3>7.4 Indemnity</h3>
            <p>You agree to indemnify, defend, and hold harmless Find-task, its founders, shareholders, directors, officers, employees, contractors, affiliates, successors, and agents from and against all claims, liabilities, losses, damages, costs, expenses, penalties, and legal fees arising from your use of the Platform; your breach of this Agreement; your violation of applicable laws; your interactions with other Users; or any Task or employment engagement facilitated through the Platform.</p>
          </section>

          <section id="disputes" className="mt-6"><h2>8. Dispute resolution</h2>
            <h3>8.1 Internal Resolution</h3>
            <p>Users shall first attempt to resolve any dispute directly and in good faith.</p>
            <h3>8.2 Raising a Dispute</h3>
            <p>A dispute may be raised on an active Task and, where payment has already been released, for a limited period after release as provided on the Platform. After that period, released funds are no longer subject to dispute through the Platform.</p>
            <h3>8.3 Review and Evidence</h3>
            <p>Where a dispute is raised, Integer Tech Ltd may, at its discretion, investigate and review any relevant information available to it, including but not limited to messages, images, audio, video, receipts, location records, submitted documents, and Platform records.</p>
            <h3>8.4 Determination</h3>
            <p>Integer Tech Ltd will resolve disputes based on the information and evidence available to it. Integer Tech Ltd may order the release of funds to the Worker, a full or partial refund of the Task Price to the Employer, or any combination it considers fair, and may apply account sanctions. Integer Tech Ltd's determination is final and binding on the Users, save where the intervention of a court or other lawful authority is required.</p>
          </section>

          <section id="data" className="mt-6"><h2>9. Data protection and privacy</h2>
            <p>Find-task processes personal data in accordance with the Nigeria Data Protection Act (NDPA), applicable data protection regulations, and Integer's <Link to="/privacy">Privacy Policy</Link>. Users consent to the collection, processing, storage, transfer, and disclosure of personal information for identity verification, fraud prevention, service improvement, regulatory compliance, and operational purposes. Find-task does not sell Users' personal information to third parties.</p>
          </section>

          <section id="ip" className="mt-6"><h2>10. Intellectual property</h2>
            <p>All Platform content, trademarks, software, source code, designs, logos, graphics, and intellectual property rights remain the exclusive property of Integer Tech Ltd unless otherwise stated. Users are granted a limited, revocable, non-transferable licence to access and use the Platform solely for lawful purposes. No User may reproduce, modify, reverse engineer, distribute, or commercially exploit Platform content without prior written consent.</p>
          </section>

          <section id="termination" className="mt-6"><h2>11. Termination</h2>
            <p>Integer Tech Ltd reserves the right, at its sole discretion, to suspend, restrict, or terminate any User account without prior notice where this Agreement is breached; fraud or illegal conduct is suspected; regulatory compliance requires such action; or User conduct threatens the integrity or security of the Platform. Termination shall not extinguish accrued liabilities or obligations.</p>
          </section>

          <section id="modifications" className="mt-6"><h2>12. Modifications to this agreement</h2>
            <p>Integer Tech Ltd reserves the right to amend, modify, or update this Agreement at any time. Updated Terms become effective immediately upon publication unless otherwise specified. Continued use of the Platform after updates constitutes acceptance of the revised Terms.</p>
          </section>

          <section id="law" className="mt-6"><h2>13. Governing law and jurisdiction</h2>
            <p>This Agreement shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria. The courts of competent jurisdiction in Nigeria shall have exclusive jurisdiction over disputes arising from or relating to this Agreement.</p>
          </section>

          <section id="severability" className="mt-6"><h2>14. Severability</h2>
            <p>If any provision of this Agreement is held invalid or unenforceable, such provision shall be severed, and the remaining provisions shall remain in full force and effect.</p>
          </section>

          <section id="entire" className="mt-6"><h2>15. Entire agreement</h2>
            <p>This Agreement constitutes the entire agreement between Integer Tech Ltd and Users regarding use of the Platform and supersedes all prior agreements, understandings, and representations.</p>
          </section>

          <section id="contact" className="mt-6"><h2>16. Contact information</h2>
            <p>For legal notices, complaints, or inquiries, contact:</p>
            <p><strong>Integer Legal Team</strong><br/>Email: <a href="mailto:Integerpj@gmail.com">Integerpj@gmail.com</a></p>
            <p className="mt-6 text-xs uppercase tracking-wider text-muted-foreground">By accessing or using Integer, you acknowledge that you have read, understood, and agreed to be legally bound by this Agreement.</p>
            <p className="text-xs text-muted-foreground">Copyright © Integer 2026. All Rights Reserved.</p>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  );
}
