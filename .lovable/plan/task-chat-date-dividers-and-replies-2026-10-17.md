# Task chat: date dividers and replies

Applies to the task workspace chat (the poster/tasker conversation), which is the chat that carries system messages.

## 1. Date dividers and hover time
- Add `dayLabel(iso)` and `needsDivider(prev, cur)` exactly as specified.
- While rendering messages, when `needsDivider(messages[i-1], messages[i])` is true, show a centered label ("Today", "Yesterday", or e.g. "Sat, 17 Oct 2026") before the message.
- Each normal bubble gets `title={new Date(created_at).toLocaleString()}` so hovering shows the full date and time.

## 2. Reply flow
- One state value `replyingTo` (message or null).
- A small "Reply" button on each normal bubble sets `replyingTo`.
- A bar above the input shows the sender name, a one-line snippet of the text (or "📎 Attachment"), and an ✕ to clear it.
- On send, include `reply_to_id: replyingTo ? replyingTo.message_id : null`, then clear `replyingTo`.
- Messages with `reply_to_id` show a quoted block at the top of the bubble: `reply_sender_name` plus `reply_text` cut to about 80 characters, or "📎 Attachment" when `reply_attachment` exists with no text.

## 3. System messages
- System messages get no Reply button, no hover time, and cannot be replied to. Date dividers still appear around them.

## Technical details
- `src/lib/findtask.functions.ts` `sendMessage`: accept optional `reply_to_id` (string/number, nullable) and forward it in the POST body.
- `src/routes/tasks.$taskId.workspace.tsx`: add helpers, divider rendering, `replyingTo` state, reply bar, quoted block, and pass `reply_to_id` in the send mutation.
