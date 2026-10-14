# Terms update, lower minimum budget, dispute outcomes and "Post Task Again"

## What will change

1. **Terms, section 6 title**: "Payments, escrow, and fees" becomes "Payments, Held Funds, and fees". This changes the side menu and the heading.
2. **Terms, section 10 (Intellectual property)**:
   - The current paragraph becomes **10.1** ("All Platform content, trademarks…").
   - Add a new **10.2 Deliverables** with your six clauses, word for word: 10.2.1 to 10.2.6 (rights pass on full payment, the Tasker keeps rights until payment or after a full refund, pre-existing materials, portfolio use, originality, and Integer Tech claims no ownership).
   - Items 2 and 3 in your list ask for the same addition, so it will be added once.
3. **Minimum task budget**: lowered from ₦2,000 to ₦1,000 on the Post a task page, including the hint and the error text. The shared fee settings will also be set to ₦1,000 so the two values match.
4. **Status after a dispute**:
   - Full refund to the poster: the task shows **Cancelled**.
   - Split between the Tasker and the poster (or full release to the Tasker): the task shows **Completed**.
   - This applies on the task page, task cards and My tasks.
5. **"Post Task Again" button**: shown to the poster on a cancelled task (including a task cancelled after a refund). It opens Post a task with the title, description, category, budget, location, remote setting and milestones already filled in. The poster can change anything and then publishes it as a new task. The old task stays as it is.

## Note
- Before building item 4, I'll check what the task details return after a dispute is resolved. If the task details don't include the dispute result, the status can only change once the service sends it, and I'll tell you.

## Technical details
- `terms.tsx`: rename the SECTIONS entry and h2; add h3 10.1/10.2 and the clauses.
- `post-task.tsx`: set `MIN_BUDGET = 1000`. Set `MIN_TASK_BUDGET` in `fees.ts` to 1000. Add `validateSearch` with an optional `from` task ID. When it is present, load the task with the existing get-task function and prefill the form once. Publishing uses the normal `createTask`.
- `task-status.ts`: add a `displayTaskStatus(task)` helper. It reads dispute resolution fields such as `dispute.resolution`, `resolution` and `dispute_outcome`. `refund_employer` maps to cancelled, and `split` or `release_tasker` maps to completed. Use it in `TaskCard`, `tasks.$taskId.index.tsx` and `tasks.mine.tsx`.
- `tasks.$taskId.index.tsx`: the poster sidebar shows a "Post Task Again" link to `/post-task?from={taskId}` when the displayed status is cancelled. Show it on My tasks cards too.
- Add tests for the status mapping and the ₦1,000 minimum. Add the new tasks to roadmap.md.
