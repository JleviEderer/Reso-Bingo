# ResoBingo 2026

A mobile-first Progressive Web App (PWA) for tracking New Year's resolutions in a 5x5 Bingo format.

## Overview
ResoBingo 2026 is a gamified resolution tracker where users create their own bingo card with personal 2026 resolutions. Users enter 24+ standard resolutions and 1+ boss resolutions, then the app generates a unique 5x5 board with the boss challenge in the center.

## Technical Stack
- **Frontend:** React + Vite + TypeScript
- **Styling:** Tailwind CSS (Mobile-first)
- **State:** LocalStorage persistence
- **Libraries:** canvas-confetti (win animations)

## Project Structure
```
client/
├── public/
│   ├── icons/
│   │   ├── icon-192.png      # PWA icon
│   │   └── icon-512.png      # PWA icon
│   ├── apple-touch-icon.png  # iOS icon
│   ├── manifest.json         # PWA manifest
│   ├── sw.js                 # Service worker
│   └── favicon.png
├── src/
│   ├── components/
│   │   ├── ui/               # Shadcn components
│   │   ├── BingoGrid.tsx     # 5x5 grid component
│   │   └── BingoSquare.tsx   # Individual square with ink effect + editing
│   ├── lib/
│   │   ├── boardUtils.ts     # Board generation, localStorage, validation, import/export
│   │   └── utils.ts
│   ├── pages/
│   │   ├── home.tsx          # Main game page
│   │   ├── create-card.tsx   # Build My Card flow
│   │   └── settings.tsx      # Data management
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
└── index.html                # PWA meta tags, iOS support
```

## Key Features
- **Build My Card:** Users enter their own resolutions (24+ standard, 1+ boss)
- **5x5 Bingo Grid:** Center square is always Boss resolution
- **No Duplicates:** Board generation ensures all 25 squares are unique
- **Square Editing:** Long-press (mobile), double-click or edit icon (desktop) to edit any square
- **Digital Ink Stamp:** Mix-blend-mode: multiply effect when marking squares
- **Confetti Celebration:** canvas-confetti animation on bingo win
- **Data Management:** Export (v2 JSON with userLists + board), Import (strict validation), Reset Progress, Reset All
- **PWA:** Installable on iOS/Android, works offline

## localStorage Keys
- `resobingo-board-2026` - Current board state {squares, createdAt}
- `resobingo-user-standard` - User's standard resolution list
- `resobingo-user-boss` - User's boss resolution list

## Export Schema (v2)
```json
{
  "version": 2,
  "createdAt": "ISO timestamp",
  "squares": [{ "text": "...", "isBoss": false, "marked": false }, ...],
  "userLists": {
    "standard": ["resolution1", "resolution2", ...],
    "boss": ["boss resolution", ...]
  }
}
```

## Routes
- `/` - Home (bingo board)
- `/create` - Build My Card (first launch or via Settings)
- `/settings` - Data management

## Development
The app runs on port 5000 via `npm run dev`.
