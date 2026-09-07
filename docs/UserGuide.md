**Ski Route Planner**

User Guide

Version 1.0 \| February 2026

# Contents

1\. Getting Started

2\. Planning a Route

3\. The Route Panel

4\. The Map

5\. Switching Ski Areas

6\. GPS & Live Location

7\. Daily Activity Tracking

8\. Run History & Season Summary

9\. Weather Forecast

10\. Piste & Lift Status

11\. Sharing a Route

12\. Offline Use

13\. Tips & Troubleshooting

# 1. Getting Started

The Ski Route Planner is a mobile-friendly web app for planning ski
routes across multiple ski areas. It calculates step-by-step directions
from any station to any other station, taking into account lift
connections, piste difficulty, and current lift/piste closures.

## Supported Ski Areas

The app currently supports two ski areas:

  -----------------------------------------------------------------------
  Ski Area                Sub-Areas               Coverage
  ----------------------- ----------------------- -----------------------
  Matterhorn Ski Paradise Cervinia,               233 stations, 158
                          Valtournenche, Zermatt  lifts, 240 pistes

  Pontedilegno-Tonale     Ponte di Legno, Passo   57 stations, 62 lifts,
                          Tonale, Presena         65 pistes
  -----------------------------------------------------------------------

## Opening the App

Open the app in your mobile or desktop browser. On first load you will
see the Matterhorn Ski Paradise map with station markers. The app can be
installed as a home-screen shortcut on iOS and Android for quick access.

  -----------------------------------------------------------------------
  *\
  \
  \[Insert screenshot: App on first load showing the map with station
  markers\]\
  \*
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

# 2. Planning a Route

## Adding Stops

There are two ways to add stops to your route:

- Tap a station marker on the map. The station is added as the next
  stop.

- Use the \"Add stop\" search box at the top. Type a station name to
  filter, then tap to select. Stations are grouped by sub-area for easy
  browsing.

You need at least two stops (a start and a destination) before a route
is calculated. You can add as many intermediate stops as you like to
create a multi-leg route.

  -----------------------------------------------------------------------
  *\
  \
  \[Insert screenshot: Waypoint list with 3 stops and the search dropdown
  open\]\
  \*
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

## Reordering & Removing Stops

Each stop in the list has controls to reorder or remove it:

- Tap the up/down arrows to move a stop earlier or later in the route.

- Tap the X button to remove a stop.

## Setting Difficulty Preference

Below the waypoint list, choose your difficulty preference. This
controls which pistes the router will use:

  -----------------------------------------------------------------------
  Setting                             Behaviour
  ----------------------------------- -----------------------------------
  Blue                                Only blue (easy) pistes. Safest
                                      option for beginners.

  Blue/Red                            Prefers blue pistes but will use
                                      red if no blue route exists.

  Red                                 Uses blue and red pistes freely.
                                      The default setting.

  Red/Black                           Prefers red or easier, but will use
                                      black if needed.

  Black                               Uses all pistes including black
                                      (expert) runs.
  -----------------------------------------------------------------------

If no route can be found at your chosen difficulty, a red error message
will appear telling you which leg failed and suggesting you try a higher
difficulty.

  -----------------------------------------------------------------------
  *\
  \
  \[Insert screenshot: Difficulty selector with \"Red\" selected and a
  calculated route visible\]\
  \*
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

# 3. The Route Panel

When a route is calculated, a panel slides up from the bottom of the
screen showing the step-by-step directions.

## Route Summary

The panel header shows key metrics for your route:

- Total distance (km) --- including lift sections

- Skiing distance (km) --- piste sections only

- Vertical drop (m) --- total descent

- Duration (min) --- estimated total time

- Maximum difficulty --- shown as a coloured dot

## Step-by-Step Directions

Each step shows an instruction such as \"Take gondola Progetto Cabinovia
to Station X\" or \"Ski down Alpino (red) to Station Y\", along with the
distance and duration for that segment.

Tap any step to highlight it on the map. The map will automatically zoom
to show that segment. Tap again to deselect.

  -----------------------------------------------------------------------
  *\
  \
  \[Insert screenshot: Route panel showing step-by-step directions with
  one step highlighted\]\
  \*
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

## Dragging the Panel

The panel has three positions: collapsed (just the header),
half-expanded (default), and fully expanded. Drag the handle bar at the
top of the panel to resize it, or tap the header when collapsed to
expand it.

## Action Buttons

- Share --- send the route via WhatsApp (see Section 11).

- Finished --- log the route to your history (see Section 8).

- Clear --- remove the current route and start over.

# 4. The Map

The map uses OpenTopoMap, a topographic map that shows terrain contours,
which is ideal for understanding the mountain layout.

## What You See on the Map

- Station markers --- white circles with a blue outline. Tap to add as a
  stop.

- Pistes --- coloured lines: blue, red, or dark grey/black matching
  their difficulty.

- Lifts --- dashed grey lines.

- Route overlay --- when a route is active, the steps are drawn as
  thicker coloured lines on top of the base map. Lifts appear as dashed
  lines, pistes as solid lines coloured by difficulty.

- Numbered stop markers --- blue circles numbered 1, 2, 3... showing
  your route stops.

- Closed indicators --- red \"X\" markers on any closed lifts or pistes
  included in your route.

  -----------------------------------------------------------------------
  *\
  \
  \[Insert screenshot: Map showing pistes, lifts, station markers, and a
  highlighted route\]\
  \*
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

## Hovering Over Markers

Hover over (or long-press on mobile) any station marker to see a tooltip
with the station name and elevation.

# 5. Switching Ski Areas

To switch between ski areas:

1.  Tap the hamburger menu (three lines) in the top-right corner.

2.  Tap \"Ski Site\".

3.  You will see a list of available ski areas. Use the search box to
    filter, then tap the area you want.

When you switch areas, the map flies to the new area, all pistes and
lifts update, and your current route is cleared. If you had previously
cached a different area for offline use, you will be asked to confirm
before switching.

  -----------------------------------------------------------------------
  *\
  \
  \[Insert screenshot: Ski Site selector showing Matterhorn and
  Pontedilegno-Tonale\]\
  \*
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

# 6. GPS & Live Location

Tap the location button in the bottom-right corner of the map to enable
GPS tracking. Your position appears as a blue dot with an accuracy
circle around it.

When GPS is first activated, the map will fly to your current position.
The button turns blue while GPS is active. Tap again to stop tracking.

Your browser will ask for location permission the first time. If
permission is denied, an error message will appear near the button.

  -----------------------------------------------------------------------
  *\
  \
  \[Insert screenshot: Map with GPS position shown as blue dot with
  accuracy circle\]\
  \*
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

# 7. Daily Activity Tracking

Track your skiing day with the built-in activity recorder. Access it
from the hamburger menu under \"Daily Activity\".

## Recording

Tap \"Start Recording\" to begin tracking your movement via GPS. The app
will automatically enable GPS if it is not already active. While
recording:

- A red pulsing dot appears next to \"Daily Activity\" in the menu.

- Your total distance and maximum speed update in real time.

- Data is saved automatically every 10 GPS points and when you stop
  recording.

Tap \"Stop Recording\" when you are done. Your data is saved for the day
and persists if you close and reopen the app.

## Viewing Your Track on the Map

Check \"Show track on map\" to see your recorded track overlaid on the
map. The track is colour-coded:

- Blue solid lines --- skiing/downhill segments.

- Grey dashed lines --- lift segments (detected by speed and altitude).

## Replay

Tap \"Play Replay\" to watch an animated playback of your day. An orange
marker moves along your track. Choose from 4 playback speeds: 1x, 2x,
5x, or 10x.

## Reset

Tap \"Reset\" to clear the day\'s activity data. You will be asked to
confirm before the data is deleted.

  -----------------------------------------------------------------------
  *\
  \
  \[Insert screenshot: Daily Activity panel showing distance, speed, and
  track controls\]\
  \*
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

# 8. Run History & Season Summary

## Logging a Run

After completing a route, tap \"Finished\" in the route panel to log it
to your history. The run is saved with the date, route details,
distance, vertical drop, and duration.

## Viewing History

Open the hamburger menu and tap \"History\" to see all your logged runs,
newest first. Each entry shows the start and end stations, distance,
vertical drop, and time. Tap the X to delete an individual entry.

## Season Summary

Open the hamburger menu and tap \"Season Summary\" to see aggregate
statistics for all your logged runs:

- Total number of runs

- Total km skied

- Total vertical drop (m)

- Total time on the mountain

- Breakdown by difficulty (blue / red / black runs)

- Your top 3 most-repeated favourite routes

  -----------------------------------------------------------------------
  *\
  \
  \[Insert screenshot: Season Summary showing stats grid and difficulty
  breakdown\]\
  \*
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

# 9. Weather Forecast

Open the hamburger menu and tap \"Weather\" to see the current
conditions and a 7-day forecast for the selected ski area.

## Current Conditions

Shows the current temperature, weather condition (with icon), wind speed
and gusts, and the elevation of the weather station.

## 7-Day Forecast

Each day shows the high/low temperature, condition, precipitation or
snowfall amount, and wind speed. Days are labelled \"Today\",
\"Tomorrow\", or by weekday.

Tap \"Refresh\" to fetch the latest forecast. Weather data comes from
the Open-Meteo service and is centred on the current ski area.

  -----------------------------------------------------------------------
  *\
  \
  \[Insert screenshot: Weather panel showing current conditions and 7-day
  forecast\]\
  \*
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

# 10. Piste & Lift Status

Open the hamburger menu and tap \"P&L Status\" to see which lifts and
pistes are currently open or closed.

Each lift and piste is shown with a green \"open\" or red \"closed\"
label. The header shows the count (e.g. \"12/15 lifts, 30/35 pistes\").
If everything is open, the panel shows \"All pistes and lifts are
open.\"

Closed lifts and pistes are automatically avoided by the route planner.
If a closed segment must be used (no alternative exists), it will be
shown with a red X marker on the map and a warning in the route panel.

Tap \"Refresh\" to fetch the latest status data.

  -----------------------------------------------------------------------
  *\
  \
  \[Insert screenshot: P&L Status panel showing open and closed lifts\]\
  \*
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

# 11. Sharing a Route

With an active route, tap the \"Share\" button in the route panel. This
opens WhatsApp with a pre-composed message containing:

- Start and end station names

- Number of stops (if multi-stop)

- Total distance, skiing distance, vertical drop, and duration

- A clickable link that recreates the exact route when opened

When the recipient opens the shared link, the app will automatically
load the correct ski area, set the difficulty, and calculate the same
route.

Note: Sharing requires an internet connection. If you are offline,
nothing will happen.

# 12. Offline Use

The app is designed to work on the mountain where signal can be patchy.
Once loaded, it works fully offline.

## Automatic Caching

When you first load a ski area, the route data (stations, pistes, lifts)
is cached locally. On subsequent visits, the app loads instantly from
the cache even without internet.

## Downloading Map Tiles

The map tiles (the background topographic map) are only cached as you
browse. To ensure full map coverage offline:

4.  Open the hamburger menu and tap \"Offline Map\".

5.  Tap \"Download Map Tiles\". This pre-downloads all tiles for the
    current ski area at the relevant zoom levels.

6.  Wait for the progress bar to complete.

It is recommended to do this on Wi-Fi before heading to the mountain.

## Offline Indicator

When you lose internet connection, a brief amber banner appears at the
top: \"You are offline --- using cached data\". This auto-dismisses
after 2 seconds.

## What Works Offline

  -----------------------------------------------------------------------
  Feature                             Offline?
  ----------------------------------- -----------------------------------
  Route planning & directions         Yes --- fully functional

  Map display                         Yes --- if tiles were cached or
                                      pre-downloaded

  GPS & live location                 Yes --- GPS works without internet

  Daily activity tracking             Yes --- stored locally

  Run history & season summary        Yes --- stored locally

  Weather & P&L status                No --- requires internet to refresh
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------
  *\
  \
  \[Insert screenshot: Offline Map download panel with progress bar\]\
  \*
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

# 13. Tips & Troubleshooting

## \"No route found\"

This means the router cannot find a path between your stops at the
selected difficulty. The error message will tell you which leg failed.
Try:

- Increasing the difficulty preference (e.g. from Blue to Red).

- Checking P&L Status --- a key lift may be closed.

- Removing or reordering intermediate stops.

## Map not showing pistes

If pistes are not visible after switching areas, try zooming in or out
to trigger a map refresh. Ensure you have an internet connection for the
initial load.

## GPS not working

Ensure you have granted location permission to your browser. On iOS,
this is under Settings \> Safari \> Location. On Android, check the site
permissions in Chrome.

## Installing as an App

On iOS: Open in Safari, tap the share button, then \"Add to Home
Screen\".

On Android: Open in Chrome, tap the three-dot menu, then \"Add to Home
Screen\" or \"Install App\".

## Battery Saving

GPS tracking and daily activity recording use battery. If you do not
need live tracking, tap the location button to turn off GPS when not in
use.
