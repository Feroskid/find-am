import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { verifyAppUser, uploadAvatar, decodeBase64 } from "./avatar.server";

const MAX_BYTES = 5 * 1024 * 1024;

/** Uploads a profile photo for the signed-in Find-am account. */
export const uploadProfilePhoto = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z
      .object({
        token: z.string().min(8).max(4096),
        filename: z.string().min(1).max(200),
        contentType: z.string().regex(/^image\//).max(100),
        dataBase64: z.string().min(16).max(9_000_000),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    try {
      const me = await verifyAppUser(data.token);
      const userId = me?.user_id ?? me?.id;
      if (!userId) return { ok: false as const, error: "Please sign in to upload a photo." };
      const bytes = decodeBase64(data.dataBase64);
      if (bytes.byteLength > MAX_BYTES) return { ok: false as const, error: "Please pick an image under 5MB." };
      const url = await uploadAvatar({
        bytes,
        contentType: data.contentType,
        filename: data.filename,
        userId,
      });
      return { ok: true as const, url };
    } catch (e: any) {
      return { ok: false as const, error: e?.message ?? "Upload failed" };
    }
  });
