# Detour

Minimal walking app: you are a blue circle, Detour points at where you want to go and says how far. No cluttered map. Built to discover a city, not optimise a route: "navigation meets zen".

Owner: Beny (solo). Product notes, UI sources and research live outside the repo in `~/Work/Detour`.

## Product principles (read before building anything)

- **Zen first.** The screen stays almost empty: the circle, a title at the top, one action bar at the bottom. Every new element must earn its place.
- **Discovery over optimisation.** Anti Google Maps, anti Strava. Routes by vibe, not speed. Serendipity features (Pick at random, arrival guide) are core.
- **Top of the screen is for reading, never tapping.** All interaction lives at the bottom, where the thumb is.
- **The map is a peek, not a mode.** Pinch out to see it; let go of every finger and it snaps back to zen, re-centred. No map toggle, no north indicator.
- **Poetic language in the UI only.** "Pearls" (places), "Moments" (events), "Nest" (temporary home). Code and DB use plain names (`places`, `events`) so a new engineer isn't confused.
- **Typography:** sans-serif (Geist) for UI, pills and buttons; serif (Playfair Display) only for titles (h1–h3, `font-serif`). Distance text is Roboto at 4vw, from the original vanilla prototype.
- **Copy voice:** short, warm, a bit playful. Never wordy. ("Can't decide? Let fate pick at random.")

## Where things stand (Nov 2026)

Working on a phone, deployed on Vercel (Hobby):
- Compass navigation to any destination; distance with rounding rules (`lib/geoUtils.js`)
- Search: Google Place Autocomplete (prefix matching), recent places (last 3), category chips (Coffee, Restaurants, Bars…)
- Category lists: 20 closest via Places API (New), filters Open now / Open at… / Any time + min rating, client-side; Pick at random
- Destination bottom panel: open/closed, rating, street address, favourite (Supabase)
- Pinch-to-peek map (walkable lines only), walking routes fetched only while peeking, re-route when >30 m off every route
- Arrival guide: detects the town (Mapbox reverse geocoding), "Welcome to <town>" on day one somewhere new, guide drawer (draft content for Cuenca only)
- Time-of-day greetings at the top
- Settings in a bottom drawer (search radius 100 m – 5 km)

Hidden / dormant: itineraries & tours (code kept, removed from UI), Roulette panel (replaced by Pick at random, still reachable from the 🎲 button until BAN-164).

**Next up (Linear):** BAN-167 search results with distance + Open now · BAN-165 feedback (Supabase table) · BAN-164 action bar (📖 guide button, remove 🎲) · BAN-162 phase 2 (real guide content from Wikivoyage/Wikidata + LLM, cached in Supabase).

## Stack

Next.js 16 (App Router), React 19, **JavaScript (no TypeScript)**, Tailwind v4, shadcn/ui (Radix, vaul drawers), Zustand, Supabase (Postgres + PostGIS), Mapbox GL JS (map, reverse geocoding, walking directions), Google Places (legacy Autocomplete/Details + Places API (New) for nearby lists). Yarn classic.

## Commands

```bash
yarn install
yarn dev:phone      # dev server on 0.0.0.0:3000 (plain http)
yarn tunnel         # ngrok https URL → open it on the phone (geolocation + compass need HTTPS)
yarn build          # production build; run it before pushing anything non-trivial
yarn lint           # eslint (see "Lint" below)
yarn supabase:db:push   # apply supabase/migrations to the hosted project
```

`yarn dev:https` / `server.js` use an expired self-signed cert: don't use them.

Env (`.env.local`, never commit): `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`, `NEXT_PUBLIC_MAPBOX_ZEN_VARIANT` (default `walkable`), `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

## Architecture map

- `src/app/(map)/layout.js`: the app shell. Mounts geolocation, navigation, current-place and pinch hooks, `MapboxMap`, `Compass`, `BottomBar`.
- `src/components/BottomBar.jsx`: decides which panel sits above the action bar (search → nearby list → roulette → destination → arrival welcome). `MapActionBar.jsx` becomes the search field when search is open (`PlaceSearch.jsx`).
- `src/components/MapboxMap.jsx`: map, circle scaling (2^(zoom−22), 12 px floor), `returnToZen()` tween. `hooks/usePinchZoom.js` drives the peek.
- Stores (Zustand): `placeStore` (location, destination, recents), `mapViewStore` (open panels/drawers, peeking), `settingsStore` (persisted radius), `visitStore` (current town, welcome state).
- On-device storage (no accounts yet), always wrapped in try/catch: `lib/recentPlaces.js`, `lib/visitHistory.js`, settings.
- API routes (`src/app/api/**`): thin wrappers over `services/providers/googlePlacesProvider.js`. Keys stay server-side except the Mapbox token.
- Content: `lib/greetings.js` (top greetings), `lib/placeGuides.js` (arrival guide), `lib/nearbyCategories.js` (chips).

## Rules that keep the API bill small

Google and Mapbox calls cost money and the app URL is public.
- Never fetch on every GPS update (~1/s). Fetch once per open/category/query and read the location with `usePlaceStore.getState()` inside the request.
- Walking routes only while peeking, once per destination, again only when off-route (`useWalkingRoutes.js`).
- Autocomplete uses a session token, closed by the Place Details call on selection.
- Prefer filtering on the client over a new request.

## iOS Safari gotchas

- Geolocation and compass need HTTPS. Compass permission must come from a user tap, once per page load (`useCompass.js`).
- The keyboard doesn't shrink the layout: `hooks/useKeyboardInset.js` lifts the bottom bar; focus inputs with `{ preventScroll: true }`.
- Horizontal scrollers and `overflow` wrappers clip box-shadows into grey bands: give them vertical padding.
- Panels on the white background need the `glass-surface` utility (88% opaque + hairline border) or they have no visible edge.

## Conventions

- One commit per feature, conventional style with the Linear id: `feat(search): … (BAN-130)`. Body explains the why.
- Features developed on branch `development` for local testing through ngrok.
- Branch `main` is Vercel's production branch. Push to deploy.
- Small surgical edits over rewrites. Match the surrounding style (4-space indent in components).
- Lint: React's `set-state-in-effect` rule flags a few existing spots (PlaceSearch, TourOverlay). Don't add new ones; prefer derived state, `useSyncExternalStore`, or setting state inside async callbacks.
- Check UI changes on a phone, not just desktop.

## Project management

Linear, team **Banjaman Scatt**, project **Detour**. Turn raw ideas into well-written issues without being asked: a human-readable part (experience, rules, decisions), then implementation detail in a collapsible `+++ Agent notes … +++` block. Check for duplicates first (the backlog has many old ideas, e.g. BAN-154/155/156 on arrival). Move issues to In Review when built, and say what still needs testing on a phone.

`README.md` is partly out of date (setup is still right; feature list and structure aren't).
