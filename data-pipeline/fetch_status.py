#!/usr/bin/env python3
"""
Fetch live piste/lift status for Cervinia + Zermatt.

Currently generates a mock status.json with all facilities open.
Future: scrape real status pages and match names to graph edge IDs.

Usage:
    python3 data-pipeline/fetch_status.py
"""

import json
import os
from datetime import datetime, timezone

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'data', 'matterhorn')


def build_mock_status():
    """Generate an all-open status file for development."""
    return {
        "areaId": "matterhorn",
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
        "lifts": [],
        "pistes": [],
    }


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    status = build_mock_status()
    out_path = os.path.join(OUTPUT_DIR, 'status.json')
    with open(out_path, 'w') as f:
        json.dump(status, f, indent=2)
    print(f"Status written to {out_path}")


if __name__ == '__main__':
    main()
