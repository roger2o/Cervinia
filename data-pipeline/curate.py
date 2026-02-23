#!/usr/bin/env python3
"""Manual curation layer for ski area graph data.

Applies name fixes, missing connections, difficulty corrections,
and other manual overrides to the generated graph.json.
"""

import argparse
import json
import sys
from pathlib import Path


def load_curations(area: str) -> dict:
    """Load curation rules for an area."""
    curation_path = Path(__file__).parent / "areas" / f"{area}_curations.json"
    if not curation_path.exists():
        print(f"No curation file found at {curation_path}, creating template...")
        template = {
            "nameOverrides": {},
            "difficultyOverrides": {},
            "addEdges": [],
            "removeEdges": [],
            "mergeStations": [],
            "stationNameOverrides": {},
        }
        curation_path.write_text(json.dumps(template, indent=2))
        return template
    return json.loads(curation_path.read_text())


def apply_curations(graph: dict, curations: dict) -> tuple[dict, int]:
    """Apply curation rules to a graph. Returns (modified_graph, change_count)."""
    changes = 0

    # Station name overrides
    for node in graph["nodes"]:
        if node["id"] in curations.get("stationNameOverrides", {}):
            old_name = node["name"]
            node["name"] = curations["stationNameOverrides"][node["id"]]
            print(f"  Renamed station: {old_name} -> {node['name']}")
            changes += 1

    # Edge name overrides
    for edge in graph["edges"]:
        if edge["id"] in curations.get("nameOverrides", {}):
            old_name = edge["name"]
            edge["name"] = curations["nameOverrides"][edge["id"]]
            print(f"  Renamed edge: {old_name} -> {edge['name']}")
            changes += 1

    # Difficulty overrides
    for edge in graph["edges"]:
        if edge["id"] in curations.get("difficultyOverrides", {}):
            old_diff = edge.get("difficulty")
            edge["difficulty"] = curations["difficultyOverrides"][edge["id"]]
            print(f"  Changed difficulty of {edge['name']}: {old_diff} -> {edge['difficulty']}")
            changes += 1

    # Remove edges
    remove_ids = set(curations.get("removeEdges", []))
    if remove_ids:
        before = len(graph["edges"])
        graph["edges"] = [e for e in graph["edges"] if e["id"] not in remove_ids]
        removed = before - len(graph["edges"])
        if removed:
            print(f"  Removed {removed} edges")
            changes += removed

    # Add edges
    for edge_def in curations.get("addEdges", []):
        graph["edges"].append(edge_def)
        print(f"  Added edge: {edge_def.get('name', edge_def['id'])}")
        changes += 1

    # Merge stations (replace all references to second ID with first ID)
    for merge in curations.get("mergeStations", []):
        keep_id, remove_id = merge[0], merge[1]
        # Update all edge references
        for edge in graph["edges"]:
            if edge["from"] == remove_id:
                edge["from"] = keep_id
            if edge["to"] == remove_id:
                edge["to"] = keep_id
        # Remove the merged station
        graph["nodes"] = [n for n in graph["nodes"] if n["id"] != remove_id]
        print(f"  Merged station {remove_id} into {keep_id}")
        changes += 1

    return graph, changes


def main():
    parser = argparse.ArgumentParser(description="Apply manual curations to graph data")
    parser.add_argument("--area", default="matterhorn", help="Area name")
    parser.add_argument("--data-dir", default=None, help="Data directory")
    args = parser.parse_args()

    data_dir = Path(args.data_dir or str(
        Path(__file__).parent.parent / "public" / "data" / args.area
    ))

    graph_path = data_dir / "graph.json"
    if not graph_path.exists():
        sys.exit(f"graph.json not found at {graph_path}. Run build_graph.py first.")

    graph = json.loads(graph_path.read_text())
    curations = load_curations(args.area)

    print(f"Applying curations for {args.area}...")
    graph, changes = apply_curations(graph, curations)

    if changes:
        graph_path.write_text(json.dumps(graph, indent=2))
        print(f"Applied {changes} curations, updated {graph_path}")
    else:
        print("No curations to apply")


if __name__ == "__main__":
    main()
