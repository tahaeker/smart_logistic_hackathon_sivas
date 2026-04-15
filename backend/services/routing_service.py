"""Routing service — fetches real road geometry from OSRM and caches to disk.

Uses the public OSRM demo server (router.project-osrm.org) for development.
For production, point OSRM_BASE_URL at a self-hosted instance.

Result shape per segment:
    {
        "from_seq": int,
        "to_seq": int,
        "geometry": [[lat, lng], ...],   # list of points along the real road
        "distance_m": float,
        "duration_s": float,
    }

If OSRM fails for a segment, that segment is returned with geometry = [] and
the frontend falls back to a straight line between the two stops.
"""

import json
import os
import urllib.parse
import urllib.request
import urllib.error
import warnings

_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_PROJECT_DIR = os.path.dirname(_BACKEND_DIR)
CACHE_DIR = os.path.join(_PROJECT_DIR, "data", "cache", "geometry")

OSRM_BASE_URL = os.environ.get("OSRM_BASE_URL", "https://router.project-osrm.org")
OSRM_TIMEOUT_S = 8.0


def _cache_path(route_id: str) -> str:
    return os.path.join(CACHE_DIR, f"{route_id}.json")


def _load_cache(route_id: str):
    path = _cache_path(route_id)
    if not os.path.exists(path):
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


def _save_cache(route_id: str, segments: list):
    os.makedirs(CACHE_DIR, exist_ok=True)
    path = _cache_path(route_id)
    try:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(segments, f)
    except Exception as e:
        warnings.warn(f"Failed to cache route geometry {route_id}: {e}")


def _fetch_osrm_segment(lat1: float, lng1: float, lat2: float, lng2: float) -> dict:
    """Call OSRM for a single A→B segment. Returns dict with geometry/distance/duration."""
    coords = f"{lng1},{lat1};{lng2},{lat2}"
    url = (
        f"{OSRM_BASE_URL}/route/v1/driving/{coords}"
        f"?overview=full&geometries=geojson"
    )
    req = urllib.request.Request(url, headers={"User-Agent": "smart-logistics/1.0"})

    with urllib.request.urlopen(req, timeout=OSRM_TIMEOUT_S) as resp:
        payload = json.loads(resp.read().decode("utf-8"))

    if payload.get("code") != "Ok" or not payload.get("routes"):
        raise ValueError(f"OSRM returned non-Ok: {payload.get('code')}")

    route = payload["routes"][0]
    # OSRM returns [lng, lat] pairs — convert to [lat, lng] for Leaflet
    coords_lnglat = route["geometry"]["coordinates"]
    geometry = [[c[1], c[0]] for c in coords_lnglat]

    return {
        "geometry": geometry,
        "distance_m": float(route.get("distance", 0.0)),
        "duration_s": float(route.get("duration", 0.0)),
    }


def _build_segments_for_ordered_stops(cache_key: str, ordered_stops: list) -> list:
    """Core geometry builder — takes stops in the desired visit order, returns segments.

    Caches by `cache_key` (disk file). Use route_id for natural order or a derived key
    like f"{route_id}-opt-{order_hash}" for optimized orders.
    """
    if not ordered_stops or len(ordered_stops) < 2:
        return []

    cached = _load_cache(cache_key)
    if cached is not None:
        return cached

    segments = []
    for i in range(1, len(ordered_stops)):
        prev = ordered_stops[i - 1]
        cur = ordered_stops[i]

        segment = {
            "from_seq": int(prev["stop_sequence"]),
            "to_seq": int(cur["stop_sequence"]),
            "geometry": [],
            "distance_m": 0.0,
            "duration_s": 0.0,
        }

        try:
            osrm = _fetch_osrm_segment(
                float(prev["latitude"]), float(prev["longitude"]),
                float(cur["latitude"]), float(cur["longitude"]),
            )
            segment.update(osrm)
        except (urllib.error.URLError, urllib.error.HTTPError, ValueError, TimeoutError) as e:
            warnings.warn(
                f"OSRM failed for {cache_key} seg {segment['from_seq']}→{segment['to_seq']}: {e}"
            )

        segments.append(segment)

    _save_cache(cache_key, segments)
    return segments


def get_route_geometry(route_id: str, stops: list) -> list:
    """Return segments with road geometry in natural stop_sequence order."""
    if not stops or len(stops) < 2:
        return []
    ordered = sorted(stops, key=lambda s: s["stop_sequence"])
    return _build_segments_for_ordered_stops(route_id, ordered)


def get_optimized_geometry(route_id: str, stops: list, optimized_order: list) -> list:
    """Return segments with road geometry for stops visited in `optimized_order`.

    `optimized_order` is a list of stop_sequence values in the new visit order.
    Cached separately per unique order so running optimize twice is free.
    """
    if not stops or len(stops) < 2 or not optimized_order:
        return []

    stop_by_seq = {int(s["stop_sequence"]): s for s in stops}
    ordered = [stop_by_seq[int(seq)] for seq in optimized_order if int(seq) in stop_by_seq]
    if len(ordered) < 2:
        return []

    order_key = "-".join(str(int(s)) for s in optimized_order)
    cache_key = f"{route_id}__opt__{order_key}"
    return _build_segments_for_ordered_stops(cache_key, ordered)
