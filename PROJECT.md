# Cervinia Ski Route Planner

**A mobile-friendly web app for any ski resort worldwide -- combining real-time activity tracking (speed, distance, top speed) with turn-by-turn route planning matched to the skier's ability level.**

---

## 1. Business Purpose

Navigating an unfamiliar ski area is confusing and can lead to wasted time, wrong turns onto runs that are too difficult, or missed last lifts home. Meanwhile, skiers increasingly want to track their performance on the mountain -- how fast they went, how far they skied, and which pistes they covered.

This app solves both problems. It works at any ski resort in the world (over 4,600 areas indexed) and serves two equally important roles:

1. **Activity tracker.** The default view records your ski day in real time via GPS -- showing live speed, total distance, skiing distance, and top speed (including which piste it was achieved on). At the end of the day, you can replay your route on the map.

2. **Route planner ("satnav for skiing").** Switch to the route planning mode to pick where you are and where you want to go, set your comfort level, and receive step-by-step directions: which lifts to ride, which runs to ski, and how long it will take. The directions are shown both as a list and highlighted on an interactive map.

Live weather data is available so skiers can plan their day accordingly.

---

## 2. Target Users

- **Visiting skiers** -- First-time or infrequent visitors who do not know the piste network and need reliable guidance to get from one part of the mountain to another.
- **Intermediate skiers** -- People who are comfortable on blue and red runs but want to avoid accidentally ending up on a black run while crossing between resorts.
- **Advanced skiers** -- Experienced skiers looking for the most direct or challenging route between two points.
- **Group leaders and instructors** -- Anyone planning routes for mixed-ability groups who needs to find a path that works for everyone.
- **Day-trippers** -- Skiers staying in one resort village who want to explore a neighbouring resort and need a plan to get there and back before lifts close.

---

## 3. Features

### Daily Activity Tracking (Primary Experience)
- The default view when opening the app -- always-on activity tracking is the core experience.
- Record your ski day via GPS with live stats: current speed, total distance, skiing distance (excluding lifts), and top speed.
- Identifies which piste your top speed was achieved on.
- Auto-detects whether you are on a lift or skiing a run (using altitude and speed).
- View your track on the map, colour-coded to distinguish skiing from lift rides.
- Replay your day as an animation at various speeds.
- Activity stats displayed in an expandable bottom panel with drag-to-resize.

### Route Planning
- Accessible via an Activity/Routes toggle in the header.
- Pick a start point and destination by tapping on the map or searching by name.
- Add multiple intermediate stops to create multi-leg routes.
- Reorder or remove stops easily.
- Set a difficulty preference (five levels from "Blue only" through to "Black/all runs") via a collapsible selector so the route avoids runs above your comfort level.
- Get step-by-step directions telling you exactly which lift to take and which run to ski, with estimated times for each step.
- See total distance, skiing distance, vertical drop, duration, and the hardest run on the route.
- Share a route with friends via WhatsApp, including a link that recreates the exact route when opened.

### Worldwide Ski Area Support
- Works at any ski resort in the world -- over 4,600 ski areas indexed and searchable.
- Search for any area by name; piste and lift data is fetched automatically and cached for offline use.
- No hardcoded resort data -- all areas load dynamically.
- Selected area is remembered across app restarts.

### Interactive Map
- Topographic base map with OpenSnowMap overlay showing pistes and lifts in standard colours.
- Calculated route highlighted as a bold overlay on the map.
- Tap any step in the directions to zoom the map to that segment.
- Station markers with names (unnamed stations hidden for a cleaner view).
- Adjustable label size setting for readability on the slopes.
- Full-screen zoomable map legend.
- GPS location tracking so you can see where you are on the mountain.

### Weather Forecast
- Current conditions (temperature, wind, weather type) for the selected ski area.
- Seven-day forecast with highs, lows, precipitation, snowfall, and wind.

### Run History and Season Summary
- Log completed routes to build a personal history.
- Season summary showing total runs, kilometres skied, vertical metres, time on the mountain, and a breakdown by difficulty.
- See your three most-repeated favourite routes.

### Offline Use
- Works fully offline after the initial load -- essential for ski slopes where mobile signal is poor.
- Route data (stations, lifts, runs) cached automatically on first visit to an area.
- Map tiles can be pre-downloaded over Wi-Fi for guaranteed offline map display.
- Offline indicator lets you know when you are using cached data.
- "Refresh App Data" button in the menu to clear stale cached data when needed.

### Installable App
- Can be installed to your phone's home screen (works like a native app on both iOS and Android).
- No app store required.
- Automatic update detection with prompt to reload when a new version is available.

---

## 4. UX Considerations

- **Mobile-first design.** The primary use case is a skier on the mountain using their phone, possibly wearing gloves. The interface uses large tap targets and simple gestures.
- **Responsive layout.** Fully usable on screens from 320px (small phones) up to 1440px (desktop), with a bottom-sheet panel on mobile and a side panel on desktop.
- **Activity tracking as the default.** The app opens straight into activity tracking mode -- no setup needed to start recording your ski day. Route planning is one tap away via the mode toggle.
- **Minimal steps to a route.** Two taps (start and end) plus one toggle (difficulty) is all that is needed to get directions. The default difficulty is set to "Red" (intermediate), which suits the majority of users.
- **Colour-coded clarity.** Runs use the universal skiing colour code (blue/red/black) throughout the app -- on the map, in the directions list, and in the difficulty selector -- so there is no ambiguity.
- **Offline reliability.** Skiers cannot rely on mobile signal at altitude. The app is built to cache everything needed so it works without any connection after the first load.
- **Drag-to-resize route panel.** The directions panel has three positions (collapsed, half, full) so users can balance map visibility with route detail.
- **Clear error handling.** If no route exists at the chosen difficulty, the app explains which leg failed and suggests trying a higher difficulty level.
- **Accessibility.** The target is WCAG 2.1 AA compliance for all interactive elements and text content.

---

## 5. Key Architecture Decisions

| Decision | Rationale |
|---|---|
| **All routing runs in the browser, not on a server.** | This means the app works fully offline -- critical for mountain use where connectivity is unreliable. It also eliminates server costs and latency. The trade-off is that the user's device does the computation, but the ski area graphs are small enough that this completes in under one second even on mid-range phones. |
| **Progressive Web App (PWA) rather than a native app.** | No app store submission or approval process. Users simply visit the website and can install it to their home screen. Works on both iOS and Android without maintaining two separate codebases. The trade-off is slightly less access to native device features, but GPS (the main one needed) works well in browsers. |
| **Map and route data sourced from OpenStreetMap.** | OpenStreetMap provides free, community-maintained ski area data that is generally accurate and up to date. This avoids licensing costs and enables support for 4,600+ ski areas worldwide without pre-building data for each one. The trade-off is that data quality varies by area. |
| **One ski area cached at a time.** | To keep storage usage reasonable on mobile devices, only one area's data is stored at a time. Switching areas replaces the cached data. This is a reasonable trade-off since skiers typically visit one resort at a time. |
| **Data pipeline runs in the browser, not offline.** | When a user selects a new ski area, the app fetches data from OpenStreetMap and builds the routing graph directly in the browser. This eliminates the need for a developer to pre-build data for each area and is what enables worldwide coverage. The trade-off is a short loading time when first selecting an area (data is then cached for offline use). |
| **Static hosting on Netlify (no backend server).** | The app is entirely client-side with no backend. This means zero server maintenance, zero server costs, and simple deployment. External APIs (weather, OpenStreetMap) are called directly from the browser. |

---

## 6. Technology Stack

| Component | Technology | Why |
|---|---|---|
| **User interface** | React 19 | Widely used, large talent pool, strong community support. Reduces hiring and maintenance risk. |
| **Programming language** | TypeScript 5 | Catches errors before they reach users. Makes the codebase easier to maintain as it grows. |
| **Map display** | Leaflet with react-leaflet | Lightweight, mobile-optimised, and well-proven for interactive maps. Free and open-source. |
| **Map tiles** | CartoDB (base) + ArcGIS (hillshade) + OpenSnowMap (piste overlay) | Provides clear topographic maps with ski-specific piste and lift detail. All services offer free tiers. |
| **Build and bundling** | Vite 7 | Fast development workflow and optimised production output. Industry-standard tool. |
| **Styling** | Tailwind CSS 4 | Enables rapid, consistent visual design without writing custom style sheets. |
| **Offline/PWA support** | vite-plugin-pwa + Workbox | Generates the service worker that enables offline use and home-screen installation. |
| **Local storage** | IndexedDB (via idb library) | Stores cached map data, route graphs, run history, and user preferences on the device. |
| **Routing algorithm** | Custom implementation (Dijkstra's algorithm) | Standard shortest-path algorithm adapted for skiing (accounts for difficulty, lift times, and closures). Runs entirely in the browser. |
| **Ski data source** | OpenStreetMap via Overpass API | Free, open data for 4,600+ ski areas worldwide. Data is fetched and graph-built in the browser on demand. |
| **Weather data** | Open-Meteo API | Free weather forecast service. No API key required. |
| **Hosting** | Netlify | Free tier covers current needs. Automatic deployments from the code repository. No server to manage. |
| **Testing** | Vitest + Testing Library | Unit and component testing to catch regressions. |
| **Data pipeline** | TypeScript (in-browser) | The data pipeline (fetching from Overpass and building the routing graph) now runs entirely in the browser when a user selects a new ski area. No offline build step required. |

---

## 7. Security Considerations

- **No user accounts or login.** The app does not collect personal information, emails, or passwords. There is no authentication system.
- **All data stored locally on the user's device.** Run history, preferences, and cached map data are stored in the browser's local database (IndexedDB). Nothing is sent to a server.
- **No backend server.** There is no database or server that could be breached. The app is a static website.
- **Third-party API calls.** The app calls external services directly from the browser: OpenStreetMap/Overpass (ski data and elevation), Open-Meteo (weather and elevation), CartoDB/ArcGIS (base map tiles), and OpenSnowMap (piste overlay tiles). These calls do not include any user-identifying information.
- **HTTPS enforced.** The app is served over HTTPS via Netlify, ensuring data in transit is encrypted.
- **GPS data stays on device.** Location tracking data (daily activity) is stored only in the browser and never transmitted.
- **No API keys in the client.** The external services used do not require API keys, so there are no secrets exposed in the code.
- **Compliance.** Since no personal data is collected or stored on any server, GDPR and similar data-protection requirements are largely not applicable. GPS data is used only locally and only with the user's explicit permission.

---

## 8. Performance Requirements

| Metric | Target |
|---|---|
| **Route calculation speed** | Under 1 second on a mid-range smartphone (benchmarked on Pixel 7a, 95th percentile). |
| **Initial page load** | Fast -- static assets served from Netlify CDN. Subsequent visits load instantly from the service worker cache. |
| **Offline readiness** | Full route planning and map viewing after the first visit, provided the user has cached the selected area. |
| **Map tile storage** | 10-20 MB per ski area, stored on the device. |
| **Supported screen sizes** | 320px (small phone) to 1440px (desktop). |
| **Expected load** | This is a client-side app with no backend. There is no server load to manage. The only shared infrastructure is Netlify's CDN for serving static files, which scales automatically. |
| **Scalability** | All 4,600+ ski areas are already available -- no action needed to add new ones. If a new area is added to OpenStreetMap, it becomes available automatically. |

---

## 9. Dependencies and Risks

### Third-Party Services
| Service | What It Provides | Risk If Unavailable |
|---|---|---|
| **OpenStreetMap / Overpass API** | Ski run and lift data | Data is fetched when a user selects a ski area and cached on their device. If the Overpass API goes down, already-cached areas still work. Selecting a new area would be blocked until it returns. |
| **Open-Meteo** | Weather forecasts | Weather panel would show an error. All other features continue to work. No cost or API key dependency. |
| **CartoDB / ArcGIS / OpenSnowMap** | Map tile images and piste overlay | If tile servers are unreachable and tiles are not pre-cached, the map background or piste overlay would be blank. Route planning and directions still work. |
| **Netlify** | Hosting and deployment | If Netlify has an outage, new users cannot access the app. Existing users with a cached version can continue using it offline. |

### Data Quality
- OpenStreetMap data is community-maintained and may contain errors (missing pistes, incorrect difficulty ratings, unnamed runs). Data quality varies by ski area -- well-known European resorts tend to be well-mapped, while smaller or newer areas may have gaps.
- The app filters out auto-generated or unnamed stations to keep the map clean, but this means some valid but poorly-labelled features may be hidden.

### Single Points of Failure
- **Netlify hosting.** The app is served from a single hosting provider. If Netlify were to discontinue service, migration to another static host would be straightforward but would require action.
- **OpenStreetMap.** The primary data source. If OSM data quality for a ski area degrades, there is no automatic fallback. The app relies entirely on the community-maintained data.

### Other Risks
- **Browser compatibility.** PWA support varies by browser and operating system. iOS Safari has historically lagged behind in PWA features (e.g., limited IndexedDB storage, no push notifications).
- **Data freshness.** Ski area data is fetched from OpenStreetMap when a user first selects an area and cached locally. If the real-world ski area changes, the cached data becomes stale. Users can clear their cache via the "Refresh App Data" menu option to re-fetch.

---

## 10. Current Status

### Working
- Worldwide ski area support -- over 4,600 areas searchable, with data fetched and cached automatically.
- Activity tracking as the primary experience -- live speed, distance (total and skiing-only), top speed with piste identification.
- Route planning with multi-stop waypoints, accessible via Activity/Routes mode toggle.
- Difficulty-aware routing with five preference levels and collapsible difficulty selector.
- Interactive map with OpenSnowMap piste overlay, adjustable station labels, and route highlighting.
- Step-by-step directions panel with distance, vertical drop, and duration.
- GPS location tracking on the map.
- Animated replay of recorded ski days.
- Run history logging and season summary statistics.
- Weather forecast panel (current conditions and 7-day forecast).
- Route sharing via WhatsApp.
- Offline operation (cached route data and pre-downloadable map tiles).
- PWA installable to home screen with automatic update detection.
- Deployed and hosted on Netlify.
- Mobile-optimised layout with compact controls and reliable GPS/legend display.

### Removed Since Earlier Versions
- **Piste and lift status display** -- removed because no universal, reliable data source exists that covers all ski areas worldwide. This was previously available only for the two originally-supported resorts.
- **Hardcoded ski area data** -- all areas now load dynamically; no pre-built area configurations remain.

### Known Limitations
- Route planning quality depends on the completeness of OpenStreetMap data for a given ski area. Well-mapped areas (e.g., major Alpine resorts) work well; less-mapped areas may have gaps in connectivity.
- The graph-building step when first selecting an area can take a few seconds on slower devices or large areas.

---

## 11. Open Questions

- **Piste/lift status -- is there a path to restoring it?** Live status was removed because no universal data source exists across all resorts. Are there per-resort APIs or data partnerships that could bring this back selectively for popular areas?
- **Is there any analytics or usage tracking?** The app does not collect any usage data. If understanding user behaviour or identifying popular areas is important, this would need to be added.
- **iOS PWA limitations.** Apple's Safari has storage limits for PWAs and does not support all PWA features. Has this been tested across a range of ski areas, and are there known issues with cache size?
- **Battery impact.** Always-on GPS activity tracking (now the default experience) consumes battery. Are there benchmarks for battery drain during a full ski day, and should the app include power-saving defaults (e.g., reduced GPS polling frequency)?
- **Multi-language support.** The app now works worldwide. Is there a plan to support languages beyond English in the interface?
- **Monetisation or cost model.** All current third-party services are free. If usage grows, what is the budget plan?
- **OpenStreetMap data quality feedback loop.** For less-mapped areas, routing quality can be poor. Is there a way to let users flag data issues or contribute corrections from within the app?
- **Activity data export.** Skiers may want to export their tracked days (e.g., GPX format) for use in other apps or for personal records. Is this planned?
- **UI consistency and colour palette.** The skiing colour coding (blue/red/black runs) is a fixed domain convention and stays as-is. The UI palette (buttons, panels, controls, stat cards) is separate and currently hardcoded per component. This is a gap against the shared `ui-consistency` skill. Consolidate the UI palette to a shared file (`src/lib/colors.ts`) with mobile-optimised contrast for outdoor daylight readability — this matters more on Cervinia than on the desktop-first projects because users view the app in bright sunlight with gloves on. Best addressed opportunistically.
