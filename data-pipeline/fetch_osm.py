#!/usr/bin/env python3
"""Fetch ski pistes and lifts from OpenStreetMap via Overpass API."""

import argparse
import json
import sys
import time
from pathlib import Path

try:
    import overpy
except ImportError:
    sys.exit("Install overpy: pip install overpy")


def load_area_config(area: str) -> dict:
    config_path = Path(__file__).parent / "areas" / f"{area}.json"
    if not config_path.exists():
        sys.exit(f"Area config not found: {config_path}")
    return json.loads(config_path.read_text())


def fetch_pistes(api: overpy.Overpass, bbox: dict) -> list[dict]:
    """Fetch downhill pistes within bounding box."""
    query = f"""
    [out:json][timeout:120];
    (
      way["piste:type"="downhill"]({bbox['south']},{bbox['west']},{bbox['north']},{bbox['east']});
    );
    out body;
    >;
    out skel qt;
    """
    print("Fetching pistes...")
    result = api.query(query)

    pistes = []
    for way in result.ways:
        nodes = []
        for node in way.nodes:
            nodes.append({"lat": float(node.lat), "lon": float(node.lon)})

        difficulty = way.tags.get("piste:difficulty", "unknown")
        name = way.tags.get("name", way.tags.get("piste:name", f"Piste {way.id}"))

        pistes.append({
            "id": f"piste_{way.id}",
            "osm_id": way.id,
            "type": "piste",
            "name": name,
            "difficulty": difficulty,
            "nodes": nodes,
            "tags": dict(way.tags),
        })

    print(f"  Found {len(pistes)} pistes")
    return pistes


def fetch_lifts(api: overpy.Overpass, bbox: dict) -> list[dict]:
    """Fetch aerial lifts within bounding box."""
    query = f"""
    [out:json][timeout:120];
    (
      way["aerialway"]({bbox['south']},{bbox['west']},{bbox['north']},{bbox['east']});
    );
    out body;
    >;
    out skel qt;
    """
    print("Fetching lifts...")
    time.sleep(2)  # Be polite to Overpass
    result = api.query(query)

    lifts = []
    for way in result.ways:
        aerialway_type = way.tags.get("aerialway", "")
        # Skip non-transport types
        if aerialway_type in ("pylon", "station"):
            continue

        nodes = []
        for node in way.nodes:
            nodes.append({"lat": float(node.lat), "lon": float(node.lon)})

        name = way.tags.get("name", f"Lift {way.id}")

        lifts.append({
            "id": f"lift_{way.id}",
            "osm_id": way.id,
            "type": "lift",
            "lift_type": aerialway_type,
            "name": name,
            "nodes": nodes,
            "tags": dict(way.tags),
        })

    print(f"  Found {len(lifts)} lifts")
    return lifts


def main():
    parser = argparse.ArgumentParser(description="Fetch OSM ski data")
    parser.add_argument("--area", default="matterhorn", help="Area config name")
    parser.add_argument("--output", default=None, help="Output file path")
    args = parser.parse_args()

    config = load_area_config(args.area)
    bbox = config["bbox"]

    api = overpy.Overpass()

    pistes = fetch_pistes(api, bbox)
    lifts = fetch_lifts(api, bbox)

    raw_data = {
        "area": config["id"],
        "bbox": bbox,
        "fetched_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "pistes": pistes,
        "lifts": lifts,
    }

    output_path = args.output or str(
        Path(__file__).parent / f"raw_{config['id']}.json"
    )
    Path(output_path).write_text(json.dumps(raw_data, indent=2))
    print(f"Wrote raw data to {output_path}")
    print(f"Total: {len(pistes)} pistes, {len(lifts)} lifts")


if __name__ == "__main__":
    main()
