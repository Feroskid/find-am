import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { verifyAppUser, uploadChatMedia, decodeBase64 } from "./media.server";

const MAX_BYTES = 25 * 1024 * 1024; // 25MB

/**
 * Uploads an image or short video for a task conversation.
 * The file is stored in private Cloud storage and a long-lived signed URL is
 * returned for use as a message attachment.
 */
export const uploadTaskMedia = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z
      .object({
        taskId: z.union([z.number().int().positive(), z.string().regex(/^\d+$/)]),
        token: z.string().min(8).max(4096),
        filename: z.string().min(1).max(200),
        contentType: z.string().regex(/^(image|video)\//).max(100),
        dataBase64: z.string().min(16).max(40_000_000),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    try {
      const me = await verifyAppUser(data.token);
      const userId = me?.user_id ?? me?.id ?? "unknown";
      const bytes = decodeBase64(data.dataBase64);
      if (bytes.byteLength > MAX_BYTES) {
        return { ok: false as const, error: "File is larger than 25MB." };
      }
      const url = await uploadChatMedia({
        bytes,
        contentType: data.contentType,
        filename: data.filename,
        taskId: data.taskId,
        userId,
      });
      return { ok: true as const, url };
    } catch (e: any) {
      return { ok: false as const, error: e?.message ?? "Upload failed" };
    }
  });
