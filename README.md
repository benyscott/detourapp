App name: Detour
Description: An app that displays a compass pointing to different POIs with estimated time to walk or cycle

# Detour - Navigation meets zen

Bringing travelling to your city / Discovering your neighbourhood

Detour is an app to help discover new places. It is a navigation app, a touristic guide and an events alerter, all in one.

💡 The idea originated when a friend was visiting me in London, and as we walked around I’d tell them: *“Oh! If we walk 100m down that road we can see where they shot this scene from Harry Potter”*, over and over again… 🚨 App idea alert!

No need to plan everything in advance, walk around any town as you feel, and let the app take you on mini-detours to places you might find interesting: 🏰 architectural gems, 🎬 famous movie scenes, 📚 following book characters, or the 💯 must-go places if you’re in a rush.

Find places around you that your friends like, stop sifting through 20 cafes before deciding for one, trust your friends have good taste (otherwise stop being their friends).

## 🦪 Pearls

*Places, restaurants, monuments*

Decide, or be recommended, what to see, where to go.

## ⏳ Moments

*Events, experiences*

You can physically walk through a city, but nothing beats discovering a city through events & traditions.

## 🗺️ Navigation

*Map*

Choose the experience. Point towards it. Walk… or bike.

# Zen 🧘🏼

We live in a world of “everything, everywhere, all at once”, overloaded with unnecessary information. *Let’s kick back, bring back our clean analog past to our overstimulating digital present.*

😌 Clutter-free: the UI/UX and branding is primordial. It needs to be clean, simple. Need to get to the Sagrada Familia? Detour points to it and tells you how far it is. Create your own path.

🗨️ Language: let’s be poetic and humoristic. Let’s *think different*. Points of Interest (POIs), Events and Maps are words we see everyday everywhere. Let’s rename them. POIs could be **Pearls** 🦪 (after all, the world is your oyster), Events are **Moments** ⏳ (live in the moment, baby).

# Features of the Futures 🚀

Some to be launched with the MVP, the rest to be integrated as the project grows.

<aside>
🥸 📍search shops or addresses

🏡 add home and 📆 work (not sure if that is useful as you’d probably know how to travel through your own city)

🪺 add nest (temporary home in a place you visit)

🫱🏼‍🫲🏾 share live location button

💡 suggest features

🔂 Tour creator

🚲 bike mode, 🚙 gps mode (maybe you have your speed and simple directions)

⏱️ opening times, ⭐️ reviews

👨🏿‍💻 move to open source 🗺️ maps & 📍POIs

🎬 movies tours, 📚 book tours

🧑🏽‍🎨 create your own tours (and beautiful timelines of your trips)

📅 events around me

🧳 solo travelling: meeting people on holidays in unknown places (Tinder of travelling)

📈 stay up-to-date with current trends: recommend must-gos (for example Jon Cake in Barcelona, with its 100m long queue of hungry tourists)

</aside>

# Design 🎨

Everything to do with UX/UI, branding, philosophy. 
<aside>
🎨 🐌 Movement

🏳️‍🌈 Colours
</aside>

---

# Development Setup 🛠️

## Prerequisites
- Node.js 18+ and pnpm
- Google Places API key (see [GOOGLE_PLACES_SETUP.md](./GOOGLE_PLACES_SETUP.md))
- Mapbox access token (optional, for map display)

## Environment Variables

Create a `.env.local` file in the project root:

```bash
# Required: Google Places API key for location search
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_google_places_api_key

# Optional: Mapbox token for map display (future feature)
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token

# Optional: Choose location provider ('google' or 'mapbox')
# Default: google
NEXT_PUBLIC_LOCATION_PROVIDER=google
```

## Installation

```bash
# Install dependencies
pnpm install

# Run development server with HTTPS (required for geolocation on mobile)
pnpm run dev:https

# Or run without HTTPS (desktop only)
pnpm run dev
```

## Testing on Mobile

1. Ensure your phone and computer are on the same WiFi network
2. Find your computer's local IP address
3. On your phone, navigate to: `https://<your-ip>:3000`
4. Accept the self-signed certificate warning

For detailed Google Places API setup, see [GOOGLE_PLACES_SETUP.md](./GOOGLE_PLACES_SETUP.md)

## Architecture

The app uses a **service layer pattern** for location APIs:

```
PlaceSearch Component
    ↓
Location Service Factory
    ↓
┌──────────┬──────────┬──────────┐
│  Google  │  Mapbox  │   OSM    │
│  Places  │          │ (future) │
└──────────┴──────────┴──────────┘
```

This makes it easy to switch between providers or add new ones. See:
- `src/services/locationService.js` - Base interface
- `src/services/providers/` - Provider implementations
- `src/services/locationServiceFactory.js` - Provider selection

## Key Features

- 🧭 **Compass navigation** - Points to your destination with device orientation
- 📍 **Smart search** - Find businesses and places with Google Places API
- 🗺️ **Country filtering** - Automatically limits search to your country (IP-based)
- 📏 **Adjustable radius** - Configure search radius in settings (1-20km)
- 💰 **Cost optimized** - Session tokens and smart caching keep API costs low
- 🔄 **Provider flexibility** - Easy to switch between location providers

## Project Structure

```
src/
├── app/
│   ├── (root)/           # Main compass page
│   ├── api/              # API routes
│   │   ├── places/       # Text search
│   │   ├── nearby/       # Nearby search
│   │   └── place-details/ # Detailed place info
│   └── settings/         # Settings page
├── components/           # UI components
├── hooks/               # Custom React hooks
├── lib/                 # Utilities
│   └── countryDetection.js # IP-based country detection
├── services/            # Location service abstraction
│   ├── locationService.js
│   ├── locationServiceFactory.js
│   └── providers/
│       ├── googlePlacesProvider.js
│       └── mapboxProvider.js
└── store/              # Zustand state management
    ├── placeStore.js
    └── settingsStore.js
```