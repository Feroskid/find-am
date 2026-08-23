import { trackEventServer, type TrackInput } from "./analytics.functions";

function detectDevice(): "desktop" | "mobile" | "tablet" {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent || "";
  if (/iPad|Tablet/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone/i.test(ua)) return "mobile";
  return "desktop";
}

function readVisitId(): string | null {
  if (typeof document === "undefined") return null;
  return document.cookie.match(/(?:^|;\s*)session-id=([^;]+)/)?.[1] ?? null;
}

/** Fire-and-forget analytics tracker. Never throws. */
export function track(input: Omit<TrackInput, "device_type"> & { device_type?: TrackInput["device_type"] }) {
  const payload: TrackInput = {
    device_type: detectDevice(),
    visit_id: readVisitId(),
    ...input,
  };
  // Don't await — never block UI.
  trackEventServer({ data: payload }).catch(() => {});
}
