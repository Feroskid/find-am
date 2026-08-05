import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  requireAdmin,
  insertTicket,
  selectTickets,
  selectTicketThread,
  insertTicketReply,
  patchTicket,
  ticketCounts,
} from "./support.server";

const Token = z.string().min(8).max(4096);

/** Public: submit a support request from the contact page. */
export const submitSupportTicket = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z
      .object({
        name: z.string().min(2).max(120),
        email: z.string().email().max(255),
        subject: z.string().min(3).max(180),
        message: z.string().min(10).max(4000),
        category: z.enum(["general", "payment", "dispute", "account", "task", "bug"]).default("general"),
        user_ref: z.string().max(120).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    try {
      const row = await insertTicket(data);
      return { ok: true as const, id: row?.id };
    } catch (e: any) {
      console.error("submitSupportTicket failed", e?.message ?? e);
      return { ok: false as const, error: "Could not send your message. Please try again." };
    }
  });

/** Admin: confirm the signed-in account has admin access. */
export const verifyAdminAccess = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ token: Token }).parse(i))
  .handler(async ({ data }) => {
    try {
      const admin = await requireAdmin(data.token);
      return { ok: true as const, admin: { name: admin.name, email: admin.email, userId: admin.userId } };
    } catch (e: any) {
      return { ok: false as const, error: e?.message ?? "Access denied" };
    }
  });

export const adminListTickets = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({ token: Token, status: z.enum(["all", "open", "answered", "closed"]).default("open") }).parse(i),
  )
  .handler(async ({ data }) => {
    try {
      await requireAdmin(data.token);
      const [tickets, counts] = await Promise.all([selectTickets(data.status), ticketCounts()]);
      return { ok: true as const, tickets, counts };
    } catch (e: any) {
      return { ok: false as const, error: e?.message ?? "Could not load tickets" };
    }
  });

export const adminGetTicket = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ token: Token, ticketId: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    try {
      await requireAdmin(data.token);
      const thread = await selectTicketThread(data.ticketId);
      return { ok: true as const, ...thread };
    } catch (e: any) {
      return { ok: false as const, error: e?.message ?? "Could not load ticket" };
    }
  });

export const adminReplyTicket = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({ token: Token, ticketId: z.string().uuid(), body: z.string().min(2).max(4000) }).parse(i),
  )
  .handler(async ({ data }) => {
    try {
      const admin = await requireAdmin(data.token);
      await insertTicketReply({ ticketId: data.ticketId, body: data.body, authorName: admin.name });
      return { ok: true as const };
    } catch (e: any) {
      return { ok: false as const, error: e?.message ?? "Could not send reply" };
    }
  });

export const adminUpdateTicket = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z
      .object({
        token: Token,
        ticketId: z.string().uuid(),
        status: z.enum(["open", "answered", "closed"]).optional(),
        priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    try {
      await requireAdmin(data.token);
      await patchTicket({ ticketId: data.ticketId, status: data.status, priority: data.priority });
      return { ok: true as const };
    } catch (e: any) {
      return { ok: false as const, error: e?.message ?? "Could not update ticket" };
    }
  });
