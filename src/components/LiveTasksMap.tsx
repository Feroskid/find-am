import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Crosshair } from "lucide-react";

/**
 * Live tasks map — Leaflet + OpenStreetMap (no API key).
 * Imports leaflet dynamically to keep SSR happy.
 */
type Task = {
  task_id?: number | string;
  id?: number | string;
  title?: string;
  budget?: number;
  location_lat?: number | null;
  location_lng?: number | null;
  latitude?: number | null;
  longitude?: number | null;
};

export function LiveTasksMap({ tasks }: { tasks: Task[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const meMarkerRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);
  const [geoErr, setGeoErr] = useState<string | null>(null);

  // dyn-import leaflet (browser only)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !containerRef.current || mapRef.current) return;
      const map = L.map(containerRef.current, {
        center: [9.082, 8.6753], // Nigeria
        zoom: 6,
        scrollWheelZoom: true,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      setReady(true);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove?.();
      mapRef.current = null;
    };
  }, []);

  const pinned = useMemo(
    () =>
      tasks
        .map((t) => {
          const lat = (t.location_lat ?? t.latitude) as number | null | undefined;
          const lng = (t.location_lng ?? t.longitude) as number | null | undefined;
          if (lat == null || lng == null || isNaN(Number(lat)) || isNaN(Number(lng))) return null;
          return { ...t, lat: Number(lat), lng: Number(lng) };
        })
        .filter(Boolean) as (Task & { lat: number; lng: number })[],
    [tasks],
  );

  // render task pins whenever data changes
  useEffect(() => {
    if (!ready || !layerRef.current) return;
    (async () => {
      const L = (await import("leaflet")).default;
      layerRef.current.clearLayers();
      pinned.forEach((t) => {
        const id = t.task_id ?? t.id;
        const marker = L.marker([t.lat, t.lng]).addTo(layerRef.current);
        marker.bindPopup(
          `<div style="font-family:inherit"><strong>${escapeHtml(String(t.title ?? "Task"))}</strong><br/>₦${Number(t.budget ?? 0).toLocaleString()}<br/><a href="/tasks/${id}" style="color:#2563eb">View task →</a></div>`,
        );
      });
    })();
  }, [ready, pinned]);

  const pinMe = () => {
    setGeoErr(null);
    if (!("geolocation" in navigator)) {
      setGeoErr("Geolocation isn't available on this device.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setMe({ lat: latitude, lng: longitude });
        const L = (await import("leaflet")).default;
        if (meMarkerRef.current) meMarkerRef.current.remove();
        meMarkerRef.current = L.circleMarker([latitude, longitude], {
          radius: 8,
          color: "#2563eb",
          fillColor: "#3b82f6",
          fillOpacity: 0.9,
        })
          .addTo(mapRef.current)
          .bindPopup("You are here");
        mapRef.current.setView([latitude, longitude], 13);
      },
      (err) => setGeoErr(err.message || "Could not get location."),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  return (
    <div className="relative">
      <div ref={containerRef} className="h-[70vh] w-full rounded-2xl overflow-hidden border border-border bg-muted" />
      {!ready && (
        <div className="absolute inset-0 grid place-items-center text-muted-foreground bg-background/60">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}
      <div className="absolute top-3 right-3 z-[400] flex flex-col gap-2">
        <button
          onClick={pinMe}
          className="inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-3 py-1.5 text-xs font-semibold shadow"
        >
          <Crosshair className="h-3.5 w-3.5" /> Pin me
        </button>
        {me && (
          <span className="rounded-full bg-card border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
            {me.lat.toFixed(3)}, {me.lng.toFixed(3)}
          </span>
        )}
        {geoErr && <span className="rounded-md bg-destructive/10 text-destructive text-[10px] px-2 py-0.5">{geoErr}</span>}
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        Showing {pinned.length} task{pinned.length === 1 ? "" : "s"} with GPS. Tiles © OpenStreetMap.
      </div>
    </div>
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!),
  );
}
