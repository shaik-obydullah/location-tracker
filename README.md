# Location Tracker

A React Native app that records your location over time and lets you review each tracking session as a route on a map. Everything is stored locally on the device in SQLite — no account, no backend, no data leaves the phone.

## Features

- **Start / stop tracking** from the home screen, with a live count of saved points.
- **Live map** of the current trail using Leaflet + OpenStreetMap inside a `WebView`.
- **Session history** — every start/stop creates a session showing its start time, end time, and point count.
- **Session detail** — view a completed or in-progress track as a polyline with start and end markers.
- **Background capture** via `react-native-background-fetch` (periodic) plus a foreground `watchPosition` subscription.
- **Local-only storage** with `@op-engineering/op-sqlite`.
- **Clear data** for locations only, or all sessions and locations.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | React Native 0.87 (New Architecture, Hermes) |
| Language | TypeScript |
| Storage | `@op-engineering/op-sqlite` |
| Location | `react-native-geolocation-service` |
| Background tasks | `react-native-background-fetch` |
| Maps | `react-native-webview` + Leaflet 1.9 + OpenStreetMap tiles |

## Requirements

- Node.js **>= 22.11.0**
- npm (or yarn)
- Android Studio + Android SDK (compile SDK 36) for Android
- Xcode + CocoaPods for iOS
- A physical device or emulator with location services enabled

## Getting started

Install dependencies:

```sh
npm install
```

Start Metro:

```sh
npm start
```

Run the app in another terminal:

```sh
npm run android
# or
npm run ios
```

For iOS, install pods first (and again whenever native dependencies change):

```sh
bundle install
bundle exec pod install
npm run ios
```

## Permissions

On first tracking start the app requests location permission. Background recording also needs "Allow all the time" (Android) or "Always" (iOS) location access. On Android, if the user grants only foreground access, the app still records while open but not reliably in the background.

The app does not require an API key: maps are rendered from OpenStreetMap tiles through Leaflet. The unused `GOOGLE_MAPS_API_KEY` placeholder in `android/gradle.properties` is left over from the template and can be ignored.

## How tracking works

- `startTracking()` creates a new session row, then subscribes to `watchPosition`
  (`distanceFilter: 20 m`, `interval: 30 s`, high accuracy).
- Each position is written to the `locations` table with the active `session_id`.
- `react-native-background-fetch` is configured with a **15-minute minimum interval**
  and `startOnBoot`/`stopOnTerminate` persistence. The OS decides exactly when it runs.
- `stopTracking()` clears the watch and stamps `end_time` / `point_count` on the session.
- The home map refreshes every 5 seconds while tracking is active.

## Project structure

```
App.tsx                      Screen switching (home / history / detail)
index.js                     App registration + headless background-fetch task
src/
  components/MapComponent.tsx     Live trail map (Leaflet in a WebView)
  context/LocationContext.tsx     Tracking state + cached locations
  database/locationDB.ts          SQLite schema and queries
  screens/HomeScreen.tsx          Start/stop, clear, open history
  screens/HistoryScreen.tsx       List of tracking sessions
  screens/SessionDetailScreen.tsx Per-session track on a map
  services/locationService.ts     Permissions, watchPosition, background fetch
android/                     Native Android project
ios/                         Native iOS project
scripts/generate_icons.py    Generates launcher icons from the brand palette
```

## Database

SQLite file: `locationtracker.sqlite`

```sql
CREATE TABLE locations (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  latitude   REAL NOT NULL,
  longitude  REAL NOT NULL,
  accuracy   REAL,
  speed      REAL,
  session_id INTEGER,
  timestamp  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  start_time  DATETIME DEFAULT CURRENT_TIMESTAMP,
  end_time    DATETIME,
  point_count INTEGER DEFAULT 0
);
```

## Scripts

| Command | Description |
| --- | --- |
| `npm start` | Start Metro |
| `npm run android` | Build and run on Android |
| `npm run ios` | Build and run on iOS |
| `npm run lint` | ESLint |
| `npm test` | Jest |

## Release build (Android)

```sh
cd android
./gradlew assembleRelease
```

The output APK is written to `android/app/build/outputs/apk/release/`. Note that the
template signs release builds with the **debug keystore** — generate and configure a
real keystore before distributing.

The repository also includes a prebuilt `LocationTracker-release.apk` at the project root.

### Dockerized Android build

`docker-compose.yml` and `Dockerfile.android` provide a container with Node 22 and the
Android toolchain. The image builds `FROM rnecommerce-android_env:latest`, which must
exist locally or be replaced with your own base image.

```sh
docker compose run --rm android-builder
```

## Known limitations

- The headless background task currently only acknowledges the task; positions captured
  while the app process is dead are not saved. Background points are only persisted when
  the foreground service/watch is alive.
- Background fetch timing is controlled by the OS (minimum ~15 minutes on Android), so
  intervals are approximate.
- Maps require network access to fetch OpenStreetMap tiles.
- Release builds are debug-signed and ProGuard is disabled.
