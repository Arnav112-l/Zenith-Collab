# Zenith Mobile (Expo)

Native iOS/Android replica of Zenith Collab — same auth, documents, sharing, and tool types — powered by the existing Next.js API + Hocuspocus server.

## Prerequisites

1. PostgreSQL + Zenith web stack running:
   - `client` on `http://127.0.0.1:3000`
   - `server` on `ws://127.0.0.1:4000`
2. Node 18+
3. Expo Go app on a phone **or** Android emulator / iOS simulator

## Setup

```bash
cd mobile
npm install
```

Create / edit `.env`:

```
EXPO_PUBLIC_API_URL=http://127.0.0.1:3000
EXPO_PUBLIC_WS_URL=ws://127.0.0.1:4000
EXPO_PUBLIC_GITHUB_CLIENT_ID=your_github_oauth_client_id
```

**Physical device:** replace `127.0.0.1` with your computer’s LAN IP (e.g. `http://192.168.1.10:3000`).

### GitHub OAuth (mobile)

In the GitHub OAuth App settings, add callback URL:

- Custom scheme: `zenith://oauth`
- Expo proxy (optional): `https://auth.expo.io/@your-username/zenith-mobile`

Use the same Client ID as the web app (`GITHUB_ID`).

## Run

```bash
npm start
```

Then press `a` (Android), `i` (iOS), or scan the QR code with Expo Go.

## Features

- Landing with Moti motion + typewriter
- GitHub sign-in via mobile JWT bridge (`/api/auth/mobile/github`)
- Dashboard: all / favorites / archive / trash, search, create all 11 notebook types
- Native editors: Notes, Code (+ Run), Canvas, Kanban, Calendar, Budget, Expense, Goals, Time Tracker, Files, AI
- Share sheet (Private / View / Edit)
- Light / Dark / System theme
- Hocuspocus room connect for TEXT/CODE

## Project layout

```
mobile/
  app/                 # Expo Router screens
  src/theme            # light/dark tokens
  src/auth             # SecureStore session + GitHub AuthSession
  src/api              # Bearer API client
  src/features/editors # native editors
  src/collab           # Yjs / Hocuspocus hook
```
