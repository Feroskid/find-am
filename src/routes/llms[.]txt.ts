import { createFileRoute } from "@tanstack/react-router";

const BODY = `# Find-am

> Find-am is a Nigerian platform for finding work and getting things done.
> It has two parts: Find-am, a job search engine, and Find-task, a
> marketplace for everyday tasks.

## Find-task

Post a task with a description, location, deadline and budget.
Taskers near you apply. Each applicant sends one message and can propose
a start date. You review their ratings and completed tasks, then accept one.

You pay when you accept, not before. Posting is free.
The money is held by Flutterwave, a payment provider licensed by the
Central Bank of Nigeria. It is released to the Tasker when you confirm
the work is done. If you do not confirm, it releases automatically after
five days.

The fee is 10% plus 100 naira plus VAT, paid by the poster. Taskers pay
nothing. The total is shown before you post.

Large tasks can be split into milestones. You fund the full amount once
and release each stage as it is completed.

Taskers verify their identity through a licensed provider before receiving payment. Ratings are two-way. Disputes are reviewed by an
administrator within three days and can result in a refund, a release,
a split, or the task simply continues upon both party agreement.

One account both posts tasks and completes them.

Tasks can be physical or remote. Physical tasks depend on someone being
near you. Remote tasks, such as design, editing and business support,
are available anywhere in Nigeria.

## Find-am jobs

Find-am gathers current job openings from across the internet into one
place. Search, then apply on the employer's own site. Find-am does not
post jobs, does not collect applications, and never charges to apply.

## Details

- Operated by Integer Tech Ltd., registered in Nigeria
- Available in Nigeria
- Payments processed by Flutterwave
- Currency: Nigerian naira

## Links

- Frequently asked questions: https://find-am.com/faq
- Post a task: https://find-am.com/tasks
- Terms: https://find-am.com/terms
- Privacy: https://find-am.com/privacy`;

export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: async () =>
        new Response(BODY, {
          headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400" },
        }),
    },
  },
});
