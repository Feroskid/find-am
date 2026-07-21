import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin } from "lucide-react";

type Pt = { latitude: number; longitude: number; recorded_at?: string };
type Trail = { sharing?: boolean; points: Pt[] } | null;

// --- Colored marker icons (Leaflet default icons 404 in bundlers) ---
function coloredIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<span style="display:inline-block;width:16px;height:16px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 0 1px rgba(0,0,0,.25)"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}
const TASK_ICON = L.divIcon({
  className: "",
  html: `<span style="display:inline-block;width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#7c3aed;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.4)"></span>`,
  iconSize: [22, 22],
  iconAnchor: [11, 22],
});
const ME_ICON = coloredIcon("#2563eb");        // blue — me
const OTHER_ICON = coloredIcon("#059669");     // green — other party
const LIVE_ICON = coloredIcon("#2563eb");

function toLatLng(p: Pt): [number, number] {
  return [Number(p.latitude), Number(p.longitude)];
}

function relTime(iso?: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

// Fit the map to all provided points once they exist.
function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 1) map.setView(points[0], 15);
    else if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
  }, [points, map]);
  return null;
}

export function LiveTaskMap({
  taskLat,
  taskLng,
  me,
  other,
  liveTrail,
  isPoster,
}: {
  taskLat?: number | null;
  taskLng?: number | null;
  me: Trail;         // my sparse backend trail
  other: Trail;      // other party's sparse backend trail
  liveTrail: [number, number][]; // my dense in-session trail (watchPosition)
  isPoster: boolean;
}) {
  const taskPin: [number, number] | null =
    taskLat != null && taskLng != null ? [Number(taskLat), Number(taskLng)] : null;

  const mePts = (me?.points ?? []).map(toLatLng);
  const otherPts = (other?.points ?? []).map(toLatLng);
  const otherLast = other?.points?.length ? other.points[other.points.length - 1] : null;
  const meLast = me?.points?.length ? me.points[me.points.length - 1] : null;

  // Everything we want in view.
  const allPoints: [number, number][] = [
    ...(taskPin ? [taskPin] : []),
    ...mePts,
    ...otherPts,
    ...liveTrail,
  ];

  const center: [number, number] = allPoints[0] ?? [6.5244, 3.3792];
  const otherLabel = isPoster ? "Tasker" : "Poster";

  return (
    <div className="space-y-2">
      <div className="h-72 w-full overflow-hidden rounded-xl border border-border">
        <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
          <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <FitBounds points={allPoints} />

          {/* Fixed task location */}
          {taskPin && (
            <Marker position={taskPin} icon={TASK_ICON}>
              <Popup>Task location</Popup>
            </Marker>
          )}

          {/* My live dense trail (this session) */}
          {liveTrail.length > 1 && <Polyline positions={liveTrail} pathOptions={{ color: "#2563eb", weight: 4, opacity: 0.9 }} />}
          {liveTrail.length > 0 && (
            <Marker position={liveTrail[liveTrail.length - 1]} icon={LIVE_ICON}>
              <Popup>You (live)</Popup>
            </Marker>
          )}

          {/* My sparse backend breadcrumb (fallback if no live points yet) */}
          {liveTrail.length === 0 && mePts.length > 0 && (
            <>
              {mePts.length > 1 && <Polyline positions={mePts} pathOptions={{ color: "#2563eb", weight: 3, dashArray: "6 6", opacity: 0.6 }} />}
              <Marker position={mePts[mePts.length - 1]} icon={ME_ICON}>
                <Popup>You · {relTime(meLast?.recorded_at)}</Popup>
              </Marker>
            </>
          )}

          {/* Other party's sparse breadcrumb trail */}
          {otherPts.length > 1 && <Polyline positions={otherPts} pathOptions={{ color: "#059669", weight: 3, dashArray: "6 6", opacity: 0.7 }} />}
          {otherPts.length > 0 && (
            <Marker position={otherPts[otherPts.length - 1]} icon={OTHER_ICON}>
              <Popup>{otherLabel} · last seen {relTime(otherLast?.recorded_at)}</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Legend + honesty about freshness */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "#7c3aed" }} /> Task</span>
        <span className="inline-flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "#2563eb" }} /> You</span>
        <span className="inline-flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "#059669" }} /> {otherLabel}</span>
        {otherLast && (
          <span className="ml-auto">{otherLabel} last updated {relTime(otherLast.recorded_at)}</span>
        )}
      </div>
    </div>
  );
}
