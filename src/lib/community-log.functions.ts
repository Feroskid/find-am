import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Token = z.string().min(8).max(4096);

/**
 * Record a moderation action taken through this app, so admins can see who
 * did what in the community. Never blocks the action itself — failures are
 * swallowed and reported as `{ ok: false }`.
 */
export const logCommunityAction = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z
      .object({
        token: Token,
        action: z.string().min(1).max(60),
        target_type: z.enum(["thread", "post", "member", "report", "role"]),
        target_id: z.string().max(120).optional(),
        target_username: z.string().max(60).optional(),
        reason: z.string().max(500).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    try {
      const { requireCommunityActor, insertCommunityAction } = await import("./community-log.server");
      const actor = await requireCommunityActor(data.token);
      await insertCommunityAction({
        actor,
        action: data.action,
        target_type: data.target_type,
        target_id: data.target_id ?? null,
        target_username: data.target_username ?? null,
        reason: data.reason ?? null,
      });
      return { ok: true as const };
    } catch (e: any) {
      console.error("logCommunityAction failed", e?.message ?? e);
      return { ok: false as const, error: e?.message ?? "Could not record the action" };
    }
  });

/** Admin only: the record of every community action taken through the app. */
export const listCommunityActions = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({ token: Token, actor: z.string().max(60).optional(), limit: z.number().int().min(1).max(500).optional() }).parse(i),
  )
  .handler(async ({ data }) => {
    try {
      const { requireAdmin } = await import("./support.server");
      await requireAdmin(data.token);
      const { selectCommunityActions } = await import("./community-log.server");
      const rows = await selectCommunityActions({ actor: data.actor, limit: data.limit });
      return { ok: true as const, rows };
    } catch (e: any) {
      return { ok: false as const, error: e?.message ?? "Access denied" };
    }
  });
