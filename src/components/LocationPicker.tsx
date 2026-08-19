import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LocateFixed, Loader2, MapPin } from "lucide-react";

// --- Fix Leaflet's default marker icons (they 404 in bundlers) ---
const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const DEFAULT_CENTER: [number, number] = [6.5244, 3.3792]; // Lagos

export type LatLng = { lat: number; lng: number };

// Reverse-geocode via Nominatim (free, no key, ~1 req/sec fair use).
async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.display_name ?? null;
  } catch {
    return null;
  }
}

// Forward geocode via Photon (OSM data, free, built for autocomplete).
async function searchAddress(q: string, near?: LatLng | null) {
  if (!q || q.trim().length < 3) return [];
  try {
    const bias = near
      ? `&lat=${near.lat}&lon=${near.lng}`
      : `&lat=${DEFAULT_CENTER[0]}&lon=${DEFAULT_CENTER[1]}`;
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5${bias}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.features ?? []).map((f: any) => ({
      label: [f.properties.name, f.properties.street, f.properties.district, f.properties.city, f.properties.state]
        .filter(Boolean).join(", "),
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0],
    }));
  } catch {
    return [];
  }
}

function Recenter({ coords }: { coords: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.setView([coords.lat, coords.lng], 15);
  }, [coords, map]);
  return null;
}

function ClickToPlace({ onPick }: { onPick: (c: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export function LocationPicker({
  value,
  address,
  onChange,
  onAddressChange,
}: {
  value: LatLng | null;
  address: string;
  onChange: (c: LatLng) => void;
  onAddressChange: (a: string) => void;
}) {
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [addressTouched, setAddressTouched] = useState(false);
  const [suggestions, setSuggestions] = useState<{ label: string; lat: number; lng: number }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const pickingRef = useRef(false);
  const markerRef = useRef<L.Marker | null>(null);

  // Debounced address search — waits 300ms after typing stops
  useEffect(() => {
    if (pickingRef.current) {
      pickingRef.current = false;
      return;
    }
    if (!addressTouched || !address || address.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      const results = await searchAddress(address, value);
      setSearching(false);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    }, 300);
    return () => clearTimeout(t);
  }, [address, addressTouched, value]);

  // When a pin is set/moved, auto-fill the address (unless the user edited it manually).
  const setPin = async (c: LatLng) => {
    onChange(c);
    if (addressTouched) return;
    setGeocoding(true);
    const name = await reverseGeocode(c.lat, c.lng);
    setGeocoding(false);
    if (name) onAddressChange(name);
  };

  const pickSuggestion = (s: { label: string; lat: number; lng: number }) => {
    pickingRef.current = true;
    onChange({ lat: s.lat, lng: s.lng });
    onAddressChange(s.label);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const useMyLocation = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError("Your browser doesn't support location access.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setPin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        setLocating(false);
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Enter your address or tap the map instead."
            : "Couldn't get your location. Tap the map to set it manually.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Tap the map to drop a pin, drag it to adjust, or use your current location.
        </p>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted disabled:opacity-50 shrink-0"
        >
          {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LocateFixed className="h-3.5 w-3.5" />}
          {locating ? "Locating…" : "Use my location"}
        </button>
      </div>

      <div className="h-64 w-full overflow-hidden rounded-xl border border-border">
        <MapContainer
          center={value ? [value.lat, value.lng] : DEFAULT_CENTER}
          zoom={value ? 15 : 11}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickToPlace onPick={setPin} />
          <Recenter coords={value} />
          {value && (
            <Marker
              position={[value.lat, value.lng]}
              icon={markerIcon}
              draggable
              ref={markerRef}
              eventHandlers={{
                dragend: () => {
                  const m = markerRef.current;
                  if (m) {
                    const p = m.getLatLng();
                    setPin({ lat: p.lat, lng: p.lng });
                  }
                },
              }}
            />
          )}
        </MapContainer>
      </div>

      {geoError && <p className="text-xs text-destructive">{geoError}</p>}

      {value ? (
        <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          Pinned at {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
        </p>
      ) : (
        <p className="text-xs text-amber-600 inline-flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" /> No location pinned yet — required for on-site tasks.
        </p>
      )}

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Address / area
          </label>
          {(geocoding || searching) && (
            <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              {geocoding ? "Finding address…" : "Searching…"}
            </span>
          )}
        </div>
        <div className="relative">
          <input
            value={address}
            onChange={(e) => { setAddressTouched(true); onAddressChange(e.target.value); }}
            onFocus={() => { if (suggestions.length) setShowSuggestions(true); }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Start typing an address, or drop a pin on the map"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-[1000] mt-1 w-full overflow-hidden rounded-lg border border-border bg-card shadow-lg">
              {suggestions.map((s, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pickSuggestion(s)}
                    className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm hover:bg-muted"
                  >
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="min-w-0">{s.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          You can edit this if the auto-filled address isn't precise.
        </p>
      </div>
    </div>
  );
}
