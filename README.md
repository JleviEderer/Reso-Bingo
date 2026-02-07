# ResoBingo 2026

A mobile-first Progressive Web App for tracking your 2026 New Year's resolutions in a 5x5 Bingo format. Create a personalized bingo card, mark off resolutions as you complete them, and celebrate when you hit Bingo!

## Features

- **Personalized Bingo Cards** - Enter 24+ standard resolutions and 1+ "Boss Battle" resolutions to generate your unique 5x5 board
- **Boss Battle Center Square** - The center square is always reserved for your toughest resolution
- **Digital Ink Stamps** - Mark completed resolutions with a satisfying ink stamp effect using CSS `mix-blend-mode: multiply`
- **Bingo Detection** - Automatic detection of 5-in-a-row (horizontal, vertical, or diagonal) with confetti celebration
- **Edit Anytime** - Long-press (mobile) or double-click (desktop) any square to update your resolutions
- **Cloud Sync** - Data persists to PostgreSQL so your board syncs across devices
- **Offline Support** - localStorage fallback keeps the app working without an internet connection
- **Authentication** - Sign in with Google, GitHub, Apple, or email via Replit Auth
- **PWA Installable** - Add to your home screen on iOS or Android for a native app experience
- **Data Management** - Export/import your board as JSON, reset progress, or start fresh

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS (mobile-first) |
| Backend | Express.js |
| Database | PostgreSQL (Neon) |
| ORM | Drizzle ORM |
| Auth | Replit Auth (OpenID Connect) |
| Animations | canvas-confetti |
| PWA | Service Worker + Web App Manifest |

## Project Structure

```
client/
  src/
    components/
      BingoGrid.tsx        # 5x5 grid layout
      BingoSquare.tsx       # Individual square with ink effect + editing
    pages/
      home.tsx              # Main game board
      create-card.tsx       # Resolution entry flow
      settings.tsx          # Data management (export, import, reset)
    lib/
      boardUtils.ts         # Board generation, validation, import/export
    hooks/
      use-auth.ts           # Authentication hook
  public/
    manifest.json           # PWA manifest
    sw.js                   # Service worker for offline support
    icons/                  # PWA icons (192x192, 512x512)

server/
    routes.ts               # API endpoints
    db.ts                   # Database connection
    replit_integrations/
      auth/                 # Replit Auth (OIDC) setup

shared/
    schema.ts               # Drizzle ORM schema + Zod validation
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database

### Installation

```bash
npm install
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Secret for session encryption |
| `REPL_ID` | Replit app identifier (set automatically on Replit) |

### Development

```bash
npm run dev
```

The app runs on `http://localhost:5000`.

### Database Setup

Push the schema to your database:

```bash
npm run db:push
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/auth/user` | Get current authenticated user |
| `GET` | `/api/login` | Initiate OAuth login flow |
| `GET` | `/api/callback` | OAuth callback handler |
| `POST` | `/api/logout` | End user session |
| `GET` | `/api/board` | Fetch user's bingo board |
| `POST` | `/api/board` | Save/update bingo board |
| `GET` | `/api/lists` | Fetch user's resolution lists |
| `POST` | `/api/lists` | Save/update resolution lists |

## How It Works

1. **Sign In** - Authenticate with Google, GitHub, Apple, or email
2. **Build Your Card** - Enter at least 24 standard resolutions and 1 boss resolution
3. **Play** - Tap squares to mark resolutions as you complete them throughout the year
4. **Win** - Get 5 in a row to trigger a confetti celebration
5. **Share** - Export your board to show friends your progress

## Data Schema

### Board (25 squares)
```json
{
  "squares": [
    { "text": "Read 12 books", "isBoss": false, "marked": true },
    { "text": "Run a marathon", "isBoss": true, "marked": false }
  ],
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

### Export Format (v2)
```json
{
  "version": 2,
  "createdAt": "2026-01-01T00:00:00.000Z",
  "squares": [...],
  "userLists": {
    "standard": ["resolution1", "resolution2", ...],
    "boss": ["boss resolution", ...]
  }
}
```

## License

MIT
