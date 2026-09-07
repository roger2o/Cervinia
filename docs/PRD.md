**Product Requirements Document**

Ski Route Planner PWA\
Matterhorn Ski Area

Cervinia • Valtournenche • Zermatt

  -----------------------------------------------------------------------
           Document Version                           1.0
  ----------------------------------- -----------------------------------
                 Date                             2026-02-23

                Project                   Cervinia Ski Route Planner

                Status                               Draft
  -----------------------------------------------------------------------

# Table of Contents

1\. Purpose

2\. Target Users

3\. Functional Requirements

4\. Non-Functional Requirements

5\. Data Sources

6\. UI Flows

7\. Tech Stack

8\. Acceptance Criteria

# 1. Purpose

The Ski Route Planner is a Progressive Web Application (PWA) designed to
help skiers plan optimal routes across the interconnected Matterhorn ski
area, which spans Cervinia (Italy), Valtournenche (Italy), and Zermatt
(Switzerland). The three resorts share a vast network of lifts and
pistes that can be daunting to navigate, especially for first-time
visitors.

Users select a start point and an end point, set a difficulty preference
(blue, red, or black), and receive step-by-step directions that tell
them exactly which lifts to take and which runs to ski. The application
visualises the recommended route on an interactive map, enabling
confident navigation across all three resorts.

# 2. Target Users

The primary audience is skiers visiting the Matterhorn ski area who want
to navigate efficiently between Cervinia, Valtournenche, and Zermatt.
Specific user segments include:

- **Visiting skiers:** First-time or infrequent visitors unfamiliar with
  the piste network who need guidance navigating between the three
  interconnected resorts.

- **Intermediate skiers:** Skiers who prefer blue or red runs and want
  to avoid accidentally ending up on black runs while traversing the
  area.

- **Advanced skiers:** Experienced skiers seeking the most direct or
  challenging route between two points.

- **Group leaders:** Ski instructors or group organisers who need to
  plan routes appropriate for mixed-ability groups.

- **Day-trippers:** Skiers staying in one resort who want to explore
  another resort and need a reliable plan to get there and back before
  lifts close.

# 3. Functional Requirements

## 3.1 Interactive Map

The application displays an interactive map of the Matterhorn ski area
using OpenTopoMap as the base tile layer, with piste and lift data
overlaid.

- OpenTopoMap base layer providing topographic context (contours,
  elevation shading).

- Piste overlays colour-coded by difficulty: blue (easy), red
  (intermediate), black (advanced).

- Lift overlays distinguishing lift types (gondola, chairlift, drag
  lift) with appropriate icons.

- Pan, zoom, and pinch-to-zoom gestures for mobile devices.

- Current GPS position indicator (when location permission is granted).

## 3.2 Start / End Point Selection

Users can select route start and end points via two methods:

- Map click/tap: Tapping on a lift station or piste junction on the map
  sets it as the start or end point.

- Searchable dropdown: A text-searchable dropdown listing all named
  stations and junctions, grouped by resort area.

## 3.3 Difficulty Preference

A three-way toggle allows users to set their maximum comfortable
difficulty:

  -----------------------------------------------------------------------
  **Setting**             **Allowed Pistes**      **Routing Behaviour**
  ----------------------- ----------------------- -----------------------
  Blue (Easy)             Blue only               Routes exclusively via
                                                  blue pistes. If no
                                                  blue-only path exists,
                                                  the user is informed.

  Red (Intermediate)      Blue + Red              Prefers blue pistes but
                                                  will use red when
                                                  necessary. Avoids black
                                                  pistes entirely.

  Black (Advanced)        Blue + Red + Black      Uses shortest/fastest
                                                  path regardless of
                                                  difficulty.
  -----------------------------------------------------------------------

## 3.4 Route Calculation Engine

The routing engine models the ski area as a directed weighted graph and
uses Dijkstra\'s algorithm to find optimal paths.

- Nodes represent lift stations and piste junctions.

- Edges represent piste segments (downhill) and lift segments (uphill).

- Edge weights factor in: estimated travel time, difficulty penalty
  (based on user preference), and lift wait-time estimates.

- Pistes outside the user\'s difficulty preference are excluded from the
  graph before routing.

- If no valid route exists for the selected difficulty, the engine
  returns a clear message and suggests relaxing the difficulty
  constraint.

- Route calculation must complete in under 1 second on a mid-range
  mobile device.

## 3.5 Step-by-Step Directions

Once a route is calculated, the application presents clear directions:

- Ordered list of steps, each describing either a lift ride or a piste
  descent.

- Each step includes: action (e.g. \"Take gondola\", \"Ski red piste\"),
  name of lift/piste, estimated duration.

- Total estimated route time displayed at the top.

- Ability to expand/collapse individual steps for additional detail.

## 3.6 Route Visualisation

- The calculated route is highlighted on the map as a bold, coloured
  polyline.

- Piste segments are coloured by their difficulty (blue/red/black).

- Lift segments are shown as dashed grey lines.

- Start and end markers are clearly distinguishable.

- The map auto-zooms to fit the entire route in view.

## 3.7 PWA & Offline Support

The application is a fully installable PWA with robust offline support,
recognising that mobile connectivity on ski slopes is often poor or
absent.

- Service Worker caches the application shell, JavaScript bundles, and
  CSS on first visit.

- Map tiles for one ski area are pre-cached to IndexedDB (\~10--20 MB
  per area).

- The user selects which area to cache via an \"area switcher\" in
  settings.

- Route graph data is cached alongside map tiles for full offline
  routing.

- Cache status indicator shows the user whether offline mode is ready.

- Stale cache detection prompts the user to update when connectivity is
  restored.

## 3.8 Multi-Area Architecture

Although the initial release targets the Matterhorn ski area, the
application is designed to be extensible to additional ski areas in
future.

- Each ski area is defined as a self-contained data package (graph,
  tiles, metadata).

- An area selector allows switching between available ski areas.

- The routing engine, UI, and caching logic are area-agnostic.

- New areas can be added by providing a conforming data package without
  code changes.

# 4. Non-Functional Requirements

  -----------------------------------------------------------------------
  **ID**                  **Requirement**         **Target**
  ----------------------- ----------------------- -----------------------
  NFR-1                   Offline capability      Full route planning and
                                                  map viewing after
                                                  initial cache of
                                                  selected area.

  NFR-2                   Responsive design       Mobile-first layout;
                                                  fully usable on screens
                                                  from 320px to 1440px
                                                  wide.

  NFR-3                   Map tile cache size     10--20 MB per ski area,
                                                  stored in IndexedDB.

  NFR-4                   Route calculation speed \< 1 second on a
                                                  mid-range smartphone
                                                  (e.g. Pixel 7a).

  NFR-5                   Installability          Meets PWA install
                                                  criteria (manifest,
                                                  service worker, HTTPS).

  NFR-6                   Accessibility           WCAG 2.1 AA compliance
                                                  for all interactive
                                                  elements and text
                                                  content.
  -----------------------------------------------------------------------

# 5. Data Sources

## 5.1 OpenStreetMap via Overpass API

The primary data source for piste and lift geometry is OpenStreetMap,
queried through the Overpass API. Relevant OSM tags include:

  -----------------------------------------------------------------------
  **Feature**             **OSM Tag**             **Notes**
  ----------------------- ----------------------- -----------------------
  Downhill pistes         piste:type=downhill     Includes
                                                  piste:difficulty for
                                                  colour grading.

  Ski lifts               aerialway=\*            Covers gondola,
                                                  chair_lift, drag_lift,
                                                  cable_car.

  Lift stations           aerialway=station       Named nodes at
                                                  top/bottom of each
                                                  lift.

  Piste names             piste:name=\* / name=\* Used for directions and
                                                  dropdown search.
  -----------------------------------------------------------------------

## 5.2 Manual Curation Layer

A manual curation layer supplements OSM data to handle:

- Missing or inaccurate piste connections (e.g. short linking paths
  between runs).

- Lift capacity and estimated wait-time metadata not available in OSM.

- Seasonal closures and temporary route changes.

- Corrected piste difficulty ratings where OSM data is outdated.

Curated data is stored as GeoJSON files in the project repository and
merged with OSM data during the build pipeline.

# 6. UI Flows

## 6.1 Map Interaction

- On launch, the map centres on the user\'s cached area (default:
  Cervinia).

- Tapping a lift station highlights it and offers \"Set as Start\" /
  \"Set as End\" buttons.

- Long-press on any map point snaps to the nearest station.

- Piste segments show a tooltip with name and difficulty on tap.

## 6.2 Dropdown Selection

- A collapsible panel at the top contains Start and End dropdown fields.

- Dropdowns are searchable with type-ahead filtering.

- Stations are grouped by sub-area (Cervinia, Valtournenche, Zermatt).

- Selecting a station in the dropdown also highlights it on the map.

## 6.3 Difficulty Toggle

- A segmented control with three options: Blue, Red, Black.

- Default is Red (intermediate).

- Changing difficulty immediately recalculates the route if start/end
  are set.

- Visual feedback: selected segment is colour-coded to match difficulty.

## 6.4 Route Panel

- A bottom sheet (mobile) or side panel (desktop) displays route
  details.

- Header shows: total time, total distance, number of lifts, number of
  pistes.

- Body shows ordered step-by-step directions with icons for lift/piste
  type.

- Each step is expandable to show additional metadata (lift capacity,
  piste gradient).

- A \"Clear Route\" button resets the selection.

## 6.5 Area Switcher

- Accessible from the settings menu or a floating button.

- Shows available ski areas with cache status (cached / not cached /
  update available).

- Tapping an uncached area initiates a download with progress indicator.

- Switching area reloads the map view and station lists for the selected
  area.

# 7. Tech Stack

  -----------------------------------------------------------------------
  **Layer**               **Technology**          **Purpose**
  ----------------------- ----------------------- -----------------------
  UI Framework            React 18                Component-based UI with
                                                  hooks for state
                                                  management.

  Language                TypeScript 5            Type safety across the
                                                  codebase; improved
                                                  developer experience.

  Map Library             Leaflet + react-leaflet Lightweight,
                                                  mobile-friendly map
                                                  rendering with plugin
                                                  ecosystem.

  Build Tool              Vite 5                  Fast HMR during
                                                  development; optimised
                                                  production builds.

  Styling                 Tailwind CSS            Utility-first CSS for
                                                  rapid, consistent UI
                                                  development.

  PWA                     vite-plugin-pwa         Service worker
                                                  generation, manifest
                                                  creation, precache
                                                  config.

  Offline Storage         IndexedDB (via idb)     Structured storage for
                                                  map tiles, route
                                                  graphs, and user prefs.

  Routing Algorithm       Custom Dijkstra (TS)    In-browser graph-based
                                                  route calculation with
                                                  difficulty-aware
                                                  weights.
  -----------------------------------------------------------------------

# 8. Acceptance Criteria

The following criteria must be met for the initial release to be
considered complete:

  -----------------------------------------------------------------------
  **ID**                  **Criterion**           **Verification**
  ----------------------- ----------------------- -----------------------
  AC-1                    Can plan a route        Select 20 random
                          between any two         station pairs; all
                          stations in the         return a valid route or
                          Matterhorn ski area.    a clear \"no route\"
                                                  message.

  AC-2                    Difficulty preference   For a known pair with
                          affects route choice.   blue and red options,
                                                  setting \"Blue\" must
                                                  exclude red segments.

  AC-3                    Works offline after     Cache Cervinia area,
                          caching.                enable airplane mode,
                                                  verify map display and
                                                  route calculation.

  AC-4                    Step-by-step directions Every calculated route
                          are displayed.          shows an ordered list
                                                  of at least 2 steps
                                                  with lift/piste names.

  AC-5                    Pistes are colour-coded Visual inspection: blue
                          by difficulty on the    pistes render blue, red
                          map.                    render red, black
                                                  render black.

  AC-6                    Route calculation       Benchmark 50 routes on
                          completes in \< 1       a Pixel 7a; 95th
                          second.                 percentile under 1000
                                                  ms.

  AC-7                    PWA is installable.     Lighthouse PWA audit
                                                  passes with a score of
                                                  100.

  AC-8                    Responsive layout works Manual QA on iPhone SE,
                          on mobile and desktop.  Pixel 7, iPad, and
                                                  1440px desktop
                                                  viewport.
  -----------------------------------------------------------------------
