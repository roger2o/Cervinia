#!/usr/bin/env python3
"""Build a routing graph from raw OSM ski data.

Clusters nearby endpoints into station nodes, creates directed edges
(lifts go uphill, pistes go downhill) with difficulty/distance/duration.
"""

import argparse
import json
import math
import sys
from collections import defaultdict
from pathlib import Path


# --- Geo utilities ---

def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distance in meters between two lat/lon points."""
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def polyline_length(nodes: list[dict]) -> float:
    """Total length of a polyline in meters."""
    total = 0
    for i in range(len(nodes) - 1):
        total += haversine(nodes[i]["lat"], nodes[i]["lon"],
                           nodes[i + 1]["lat"], nodes[i + 1]["lon"])
    return total


def estimate_elevation(lat: float, lon: float, all_nodes: list[dict]) -> float:
    """Rough elevation estimate from nearby nodes with elevation data.
    Falls back to a latitude-based heuristic if no elevation data available."""
    # Simple heuristic: higher latitude in the Alps ≈ higher elevation
    # This is very rough; real elevation comes from DEM or OSM ele tags
    return 2000 + (lat - 45.9) * 5000


# --- Difficulty mapping ---

DIFFICULTY_MAP = {
    "novice": "blue",
    "easy": "blue",
    "intermediate": "red",
    "advanced": "black",
    "expert": "black",
    "freeride": "black",
    "unknown": "red",  # Default to red if unspecified
}


# --- Clustering ---

class StationClusterer:
    """Cluster nearby endpoints into station nodes using ~50m threshold."""

    def __init__(self, threshold_m: float = 50.0):
        self.threshold = threshold_m
        self.stations: list[dict] = []

    def find_or_create(self, lat: float, lon: float, name_hint: str = "") -> str:
        """Find existing station within threshold or create a new one."""
        for station in self.stations:
            dist = haversine(lat, lon, station["lat"], station["lon"])
            if dist < self.threshold:
                # Update name if the hint is more descriptive
                if name_hint and (not station["name"] or station["name"].startswith("Station")):
                    station["name"] = name_hint
                # Update position to average
                n = station["_count"]
                station["lat"] = (station["lat"] * n + lat) / (n + 1)
                station["lon"] = (station["lon"] * n + lon) / (n + 1)
                station["_count"] = n + 1
                return station["id"]

        station_id = f"station_{len(self.stations)}"
        self.stations.append({
            "id": station_id,
            "name": name_hint or f"Station {len(self.stations)}",
            "lat": lat,
            "lon": lon,
            "elevation": 0,  # Set later
            "_count": 1,
        })
        return station_id

    def get_stations(self) -> list[dict]:
        """Return stations without internal fields."""
        result = []
        for s in self.stations:
            result.append({
                "id": s["id"],
                "name": s["name"],
                "lat": round(s["lat"], 6),
                "lon": round(s["lon"], 6),
                "elevation": s["elevation"],
            })
        return result


def assign_sub_area(lat: float, lon: float, area_config: dict | None = None) -> str:
    """Assign a station to a sub-area based on geographic boundaries.

    For Matterhorn, uses the original hardcoded boundaries.
    For other areas, assigns to the nearest sub-area by dividing the bbox
    into equal longitudinal sectors.
    """
    if area_config is None or area_config.get("id") == "matterhorn":
        # Original Matterhorn logic
        if lat > 45.98:
            return "Zermatt"
        elif lon < 7.63:
            return "Valtournenche"
        else:
            return "Cervinia"

    sub_areas = area_config.get("subAreas", [])
    if not sub_areas:
        return "Unknown"
    if len(sub_areas) == 1:
        return sub_areas[0]

    # Divide the bbox into equal longitudinal sectors
    bbox = area_config["bbox"]
    west = bbox["west"]
    east = bbox["east"]
    sector_width = (east - west) / len(sub_areas)
    index = int((lon - west) / sector_width)
    index = max(0, min(index, len(sub_areas) - 1))
    return sub_areas[index]


def _directed_reachable(adj_out: dict, start: str) -> set[str]:
    """BFS from start following directed edges."""
    reached = set()
    queue = [start]
    while queue:
        n = queue.pop()
        if n in reached:
            continue
        reached.add(n)
        for to_id in adj_out.get(n, []):
            if to_id not in reached:
                queue.append(to_id)
    return reached


def _bridge_connectivity_gaps(
    stations: list[dict],
    edges: list[dict],
    max_radius_m: float = 500.0,
    max_iterations: int = 50,
) -> list[dict]:
    """Iteratively add connector edges to bridge directed-graph gaps.

    Each iteration:
    1. Compute directed reachability from every station
    2. Find the pair of nearby stations (< max_radius_m) where adding a
       bidirectional connector would most increase overall reachability
    3. Add it and repeat until no improvement or max iterations reached
    """
    node_map = {s["id"]: s for s in stations}
    new_edges = list(edges)

    # Precompute pairwise distances for nearby stations
    nearby_pairs: list[tuple[float, str, str]] = []
    station_list = list(stations)
    for i in range(len(station_list)):
        for j in range(i + 1, len(station_list)):
            a, b = station_list[i], station_list[j]
            d = haversine(a["lat"], a["lon"], b["lat"], b["lon"])
            if d < max_radius_m:
                nearby_pairs.append((d, a["id"], b["id"]))
    nearby_pairs.sort()

    total_added = 0
    for iteration in range(max_iterations):
        # Build directed adjacency
        adj_out: dict[str, set[str]] = defaultdict(set)
        for e in new_edges:
            adj_out[e["from"]].add(e["to"])

        # Compute reachability from each node
        reach: dict[str, set[str]] = {}
        connected_nodes = set()
        for e in new_edges:
            connected_nodes.add(e["from"])
            connected_nodes.add(e["to"])

        for nid in connected_nodes:
            reach[nid] = _directed_reachable(adj_out, nid)

        total_reach = sum(len(r) for r in reach.values())

        # Find the best connector to add
        best_gain = 0
        best_pair = None
        best_dist = 0

        for dist, a_id, b_id in nearby_pairs:
            if a_id not in connected_nodes or b_id not in connected_nodes:
                continue

            # Check if a->b already exists
            a_reaches_b = b_id in reach.get(a_id, set())
            b_reaches_a = a_id in reach.get(b_id, set())

            if a_reaches_b and b_reaches_a:
                continue

            # Estimate gain: if we add a->b, everything that can reach a
            # can now also reach everything b can reach (and vice versa)
            gain = 0
            if not a_reaches_b:
                # Nodes that reach a but not b's targets
                a_reachers = sum(1 for n in connected_nodes if a_id in reach.get(n, set()))
                b_targets = len(reach.get(b_id, set()))
                gain += a_reachers * b_targets
            if not b_reaches_a:
                b_reachers = sum(1 for n in connected_nodes if b_id in reach.get(n, set()))
                a_targets = len(reach.get(a_id, set()))
                gain += b_reachers * a_targets

            if gain > best_gain:
                best_gain = gain
                best_pair = (a_id, b_id)
                best_dist = dist

        if not best_pair or best_gain == 0:
            break

        a_id, b_id = best_pair
        a_name = node_map[a_id]["name"]
        b_name = node_map[b_id]["name"]

        # Add bidirectional connector
        new_edges.append({
            "id": f"connector_{total_added}_ab",
            "from": a_id,
            "to": b_id,
            "type": "lift",
            "liftType": "connector",
            "name": f"Transfer to {b_name}",
            "distance": round(best_dist),
            "duration": round(best_dist / 50, 1),
            "difficulty": None,
        })
        new_edges.append({
            "id": f"connector_{total_added}_ba",
            "from": b_id,
            "to": a_id,
            "type": "lift",
            "liftType": "connector",
            "name": f"Transfer to {a_name}",
            "distance": round(best_dist),
            "duration": round(best_dist / 50, 1),
            "difficulty": None,
        })
        total_added += 1
        print(f"  Connector {total_added}: {a_name} <-> {b_name} ({best_dist:.0f}m, gain={best_gain})")

    if total_added:
        print(f"  Total connectors added: {total_added}")
    return new_edges


def load_area_config(area: str) -> dict | None:
    """Load area config JSON if it exists."""
    config_path = Path(__file__).parent / "areas" / f"{area}.json"
    if config_path.exists():
        return json.loads(config_path.read_text())
    return None


def build_graph(raw_data: dict, cluster_threshold: float = 200.0, area_config: dict | None = None) -> tuple[dict, dict, dict]:
    """Build graph.json, geo.json, and meta.json from raw OSM data.

    Returns (graph, geo, meta) dicts.
    """
    clusterer = StationClusterer(threshold_m=cluster_threshold)
    edges = []
    geo_features = []

    # Process lifts
    for lift in raw_data["lifts"]:
        nodes = lift["nodes"]
        if len(nodes) < 2:
            continue

        start = nodes[0]
        end = nodes[-1]
        name = lift["name"]

        # Lifts go uphill: start at bottom, end at top
        # We determine direction by assuming the first node is the bottom station
        from_id = clusterer.find_or_create(start["lat"], start["lon"], f"{name} (bottom)")
        to_id = clusterer.find_or_create(end["lat"], end["lon"], f"{name} (top)")

        distance = polyline_length(nodes)
        # Estimate lift duration: ~5 min/km for gondolas, ~8 min/km for chairs
        lift_type = lift.get("lift_type", "chair_lift")
        speed_factor = 5.0 if lift_type in ("gondola", "cable_car") else 8.0
        duration = (distance / 1000) * speed_factor

        edges.append({
            "id": lift["id"],
            "from": from_id,
            "to": to_id,
            "type": "lift",
            "liftType": lift_type,
            "name": name,
            "distance": round(distance),
            "duration": round(duration, 1),
            "difficulty": None,
        })

        # GeoJSON feature for the lift
        geo_features.append({
            "type": "Feature",
            "properties": {
                "id": lift["id"],
                "name": name,
                "type": "lift",
                "liftType": lift_type,
            },
            "geometry": {
                "type": "LineString",
                "coordinates": [[n["lon"], n["lat"]] for n in nodes],
            },
        })

    # Process pistes
    for piste in raw_data["pistes"]:
        nodes = piste["nodes"]
        if len(nodes) < 2:
            continue

        start = nodes[0]
        end = nodes[-1]
        name = piste["name"]
        raw_difficulty = piste.get("difficulty", "unknown")
        difficulty = DIFFICULTY_MAP.get(raw_difficulty, "red")

        # Pistes go downhill: assume first node is top
        from_id = clusterer.find_or_create(start["lat"], start["lon"], f"{name} (top)")
        to_id = clusterer.find_or_create(end["lat"], end["lon"], f"{name} (bottom)")

        distance = polyline_length(nodes)
        # Estimate ski duration: ~2 min/km for easy, ~1.5 for intermediate, ~1 for advanced
        speed_map = {"blue": 2.0, "red": 1.5, "black": 1.0}
        duration = (distance / 1000) * speed_map.get(difficulty, 1.5)

        edges.append({
            "id": piste["id"],
            "from": from_id,
            "to": to_id,
            "type": "piste",
            "name": name,
            "distance": round(distance),
            "duration": round(duration, 1),
            "difficulty": difficulty,
        })

        # GeoJSON feature
        color_map = {"blue": "#3b82f6", "red": "#ef4444", "black": "#1f2937"}
        geo_features.append({
            "type": "Feature",
            "properties": {
                "id": piste["id"],
                "name": name,
                "type": "piste",
                "difficulty": difficulty,
                "color": color_map.get(difficulty, "#ef4444"),
            },
            "geometry": {
                "type": "LineString",
                "coordinates": [[n["lon"], n["lat"]] for n in nodes],
            },
        })

    # Assign elevations and sub-areas to stations
    stations = clusterer.get_stations()
    for station in stations:
        station["elevation"] = round(estimate_elevation(
            station["lat"], station["lon"], []
        ))
        station["subArea"] = assign_sub_area(station["lat"], station["lon"], area_config)

    # Post-clustering: bridge gaps in OSM data by adding connector edges
    # between nearby stations that aren't reachable from each other.
    edges = _bridge_connectivity_gaps(stations, edges, max_radius_m=500.0, max_iterations=50)

    # Remove self-loop edges (same from/to caused by clustering)
    edges = [e for e in edges if e["from"] != e["to"]]

    # Build graph structure
    graph = {
        "nodes": stations,
        "edges": edges,
    }

    geo = {
        "type": "FeatureCollection",
        "features": geo_features,
    }

    # Add station markers to geo
    for station in stations:
        geo["features"].append({
            "type": "Feature",
            "properties": {
                "id": station["id"],
                "name": station["name"],
                "type": "station",
                "elevation": station["elevation"],
                "subArea": station["subArea"],
            },
            "geometry": {
                "type": "Point",
                "coordinates": [station["lon"], station["lat"]],
            },
        })

    meta = {
        "id": raw_data["area"],
        "name": area_config["name"] if area_config else "Matterhorn Ski Paradise",
        "bbox": raw_data["bbox"],
        "center": area_config.get("center", [
            (raw_data["bbox"]["south"] + raw_data["bbox"]["north"]) / 2,
            (raw_data["bbox"]["west"] + raw_data["bbox"]["east"]) / 2,
        ]) if area_config else [
            (raw_data["bbox"]["south"] + raw_data["bbox"]["north"]) / 2,
            (raw_data["bbox"]["west"] + raw_data["bbox"]["east"]) / 2,
        ],
        "subAreas": area_config.get("subAreas", []) if area_config else ["Cervinia", "Valtournenche", "Zermatt"],
        "stats": {
            "stations": len(stations),
            "lifts": sum(1 for e in edges if e["type"] == "lift"),
            "pistes": sum(1 for e in edges if e["type"] == "piste"),
            "bluePistes": sum(1 for e in edges if e.get("difficulty") == "blue"),
            "redPistes": sum(1 for e in edges if e.get("difficulty") == "red"),
            "blackPistes": sum(1 for e in edges if e.get("difficulty") == "black"),
        },
        "fetchedAt": raw_data.get("fetched_at", ""),
        "builtAt": __import__("time").strftime("%Y-%m-%dT%H:%M:%SZ", __import__("time").gmtime()),
    }

    return graph, geo, meta


def validate_graph(graph: dict) -> list[str]:
    """Run basic validation checks on the graph."""
    warnings = []
    node_ids = {n["id"] for n in graph["nodes"]}

    # Check for orphan edges
    for edge in graph["edges"]:
        if edge["from"] not in node_ids:
            warnings.append(f"Edge {edge['id']} references unknown from-node {edge['from']}")
        if edge["to"] not in node_ids:
            warnings.append(f"Edge {edge['id']} references unknown to-node {edge['to']}")

    # Check for isolated nodes (no edges)
    connected = set()
    for edge in graph["edges"]:
        connected.add(edge["from"])
        connected.add(edge["to"])

    isolated = node_ids - connected
    if isolated:
        warnings.append(f"{len(isolated)} isolated stations with no connections")

    # Check for nodes with only incoming or only outgoing edges
    outgoing = defaultdict(int)
    incoming = defaultdict(int)
    for edge in graph["edges"]:
        outgoing[edge["from"]] += 1
        incoming[edge["to"]] += 1

    dead_ends = [nid for nid in connected if outgoing[nid] == 0]
    if dead_ends:
        warnings.append(f"{len(dead_ends)} dead-end stations (no outgoing edges)")

    sources = [nid for nid in connected if incoming[nid] == 0]
    if sources:
        warnings.append(f"{len(sources)} source stations (no incoming edges)")

    return warnings


def main():
    parser = argparse.ArgumentParser(description="Build routing graph from raw OSM data")
    parser.add_argument("--area", default="matterhorn", help="Area name")
    parser.add_argument("--input", default=None, help="Raw data input file")
    parser.add_argument("--output-dir", default=None, help="Output directory")
    parser.add_argument("--threshold", type=float, default=200.0, help="Station clustering threshold in meters")
    args = parser.parse_args()

    input_path = args.input or str(Path(__file__).parent / f"raw_{args.area}.json")
    output_dir = Path(args.output_dir or str(
        Path(__file__).parent.parent / "public" / "data" / args.area
    ))
    output_dir.mkdir(parents=True, exist_ok=True)

    if not Path(input_path).exists():
        sys.exit(f"Input file not found: {input_path}. Run fetch_osm.py first.")

    raw_data = json.loads(Path(input_path).read_text())
    print(f"Loaded raw data: {len(raw_data['pistes'])} pistes, {len(raw_data['lifts'])} lifts")
    print(f"Clustering threshold: {args.threshold}m")

    area_config = load_area_config(args.area)
    graph, geo, meta = build_graph(raw_data, cluster_threshold=args.threshold, area_config=area_config)

    # Validate
    warnings = validate_graph(graph)
    for w in warnings:
        print(f"  WARNING: {w}")

    # Write outputs
    (output_dir / "graph.json").write_text(json.dumps(graph, indent=2))
    (output_dir / "geo.json").write_text(json.dumps(geo, indent=2))
    (output_dir / "meta.json").write_text(json.dumps(meta, indent=2))

    print(f"\nOutput written to {output_dir}/")
    print(f"  graph.json: {meta['stats']['stations']} stations, "
          f"{meta['stats']['lifts']} lifts, {meta['stats']['pistes']} pistes")
    print(f"  geo.json: {len(geo['features'])} features")
    print(f"  meta.json: area metadata")


if __name__ == "__main__":
    main()
